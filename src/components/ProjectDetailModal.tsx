import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle, Clock, AlertCircle, Download, ExternalLink, Image, Play } from "lucide-react";
import { toast } from "sonner";

interface ProjectDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string | null;
}

interface Project {
  id: string;
  title: string;
  status: string;
  created_at: string;
  updated_at: string;
  aspect: string;
  theme: string;
  listing_url: string;
}

interface Asset {
  id: string;
  url: string;
  type: string;
  sort_order: number;
  width?: number;
  height?: number;
}

export function ProjectDetailModal({ open, onOpenChange, projectId }: ProjectDetailModalProps) {
  const [project, setProject] = useState<Project | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open && projectId) {
      fetchProjectDetails();
      
      // Set up real-time subscription for this project
      const channel = supabase
        .channel(`project-${projectId}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'projects',
            filter: `id=eq.${projectId}`
          },
          (payload) => {
            console.log('Project detail updated:', payload);
            setProject(payload.new as Project);
            
            // Show status update notifications
            const updatedProject = payload.new as Project;
            if (updatedProject.status === 'done') {
              toast.success("Video generation completed!");
            } else if (updatedProject.status === 'error') {
              toast.error("Video generation failed");
            } else if (updatedProject.status === 'rendering') {
              toast.info("Video generation started");
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [open, projectId]);

  const fetchProjectDetails = async () => {
    if (!projectId) return;

    setLoading(true);
    try {
      // Fetch project details
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (projectError) {
        toast.error("Failed to load project details");
        console.error('Project fetch error:', projectError);
        return;
      }

      setProject(projectData);

      // Fetch project assets
      const { data: assetsData, error: assetsError } = await supabase
        .from('assets')
        .select('*')
        .eq('project_id', projectId)
        .order('sort_order', { ascending: true });

      if (assetsError) {
        console.error('Assets fetch error:', assetsError);
      } else {
        setAssets(assetsData || []);
      }
    } catch (error) {
      toast.error("An error occurred while loading project details");
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "done":
        return <CheckCircle className="h-5 w-5 text-success" />;
      case "rendering":
        return <Clock className="h-5 w-5 text-warning animate-spin" />;
      case "error":
        return <AlertCircle className="h-5 w-5 text-destructive" />;
      default:
        return <Clock className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "done":
        return "Completed";
      case "rendering":
        return "Rendering...";
      case "queued":
        return "Queued";
      case "error":
        return "Error";
      default:
        return "Draft";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "done":
        return "bg-success text-success-foreground";
      case "rendering":
        return "bg-warning text-warning-foreground";
      case "error":
        return "bg-destructive text-destructive-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const handleDownload = () => {
    // In a real implementation, this would download the actual video file
    toast.success("Video download started!");
  };

  const handlePreview = () => {
    // In a real implementation, this would open a video preview
    toast.info("Video preview coming soon!");
  };

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-center py-8">
            <Clock className="h-8 w-8 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Loading project details...</span>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!project) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl">
          <div className="text-center py-8">
            <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-2" />
            <p className="text-muted-foreground">Project not found</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <DialogTitle className="text-2xl">{project.title}</DialogTitle>
              <Badge className={getStatusColor(project.status)}>
                <span className="flex items-center space-x-1">
                  {getStatusIcon(project.status)}
                  <span>{getStatusText(project.status)}</span>
                </span>
              </Badge>
            </div>
            {project.listing_url && (
              <Button variant="outline" size="sm" asChild>
                <a href={project.listing_url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View Listing
                </a>
              </Button>
            )}
          </div>
          <DialogDescription>
            Created {new Date(project.created_at).toLocaleDateString()} • 
            {project.aspect} • {project.theme} theme
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Video Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Play className="h-5 w-5" />
                <span>Generated Video</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {project.status === 'done' ? (
                <div className="space-y-4">
                  <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <Play className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                      <p className="text-muted-foreground">Video Preview</p>
                      <p className="text-sm text-muted-foreground">Click to play generated video</p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button onClick={handlePreview} className="flex-1">
                      <Play className="h-4 w-4 mr-2" />
                      Preview Video
                    </Button>
                    <Button onClick={handleDownload} variant="outline">
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </div>
              ) : project.status === 'rendering' ? (
                <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <Clock className="h-12 w-12 text-warning animate-spin mx-auto mb-2" />
                    <p className="text-muted-foreground">Video is being generated...</p>
                    <p className="text-sm text-muted-foreground">This usually takes 2-5 minutes</p>
                  </div>
                </div>
              ) : project.status === 'error' ? (
                <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-2" />
                    <p className="text-muted-foreground">Video generation failed</p>
                    <p className="text-sm text-muted-foreground">Please try creating a new project</p>
                  </div>
                </div>
              ) : (
                <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground">Video generation queued</p>
                    <p className="text-sm text-muted-foreground">Processing will start shortly</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Project Assets */}
          {assets.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Image className="h-5 w-5" />
                  <span>Property Images ({assets.length})</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {assets.map((asset, index) => (
                    <div key={asset.id} className="aspect-video bg-muted rounded-lg overflow-hidden">
                      <img
                        src={asset.url}
                        alt={`Property image ${index + 1}`}
                        className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer"
                        onClick={() => window.open(asset.url, '_blank')}
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Project Info */}
          <Card>
            <CardHeader>
              <CardTitle>Project Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Project ID:</span>
                  <p className="font-mono text-xs break-all">{project.id}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Status:</span>
                  <p>{getStatusText(project.status)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Created:</span>
                  <p>{new Date(project.created_at).toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Last Updated:</span>
                  <p>{new Date(project.updated_at).toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Aspect Ratio:</span>
                  <p>{project.aspect}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Theme:</span>
                  <p className="capitalize">{project.theme}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}