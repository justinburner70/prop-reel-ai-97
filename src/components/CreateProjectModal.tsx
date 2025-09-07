import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Loader2, ExternalLink, AlertCircle } from "lucide-react";

interface CreateProjectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProjectCreated: () => void;
}

interface ListingData {
  title: string;
  description: string;
  images: string[];
  price: string;
  address: string;
}

export function CreateProjectModal({ open, onOpenChange, onProjectCreated }: CreateProjectModalProps) {
  const { user } = useAuth();
  const [step, setStep] = useState<'url' | 'configure' | 'creating'>('url');
  const [listingUrl, setListingUrl] = useState("");
  const [listingData, setListingData] = useState<ListingData | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    aspect: "9x16" as const,
    theme: "clean" as const
  });
  const [loading, setLoading] = useState(false);

  const handleAnalyzeUrl = async () => {
    if (!listingUrl.trim()) {
      toast.error("Please enter a listing URL");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-listing', {
        body: { url: listingUrl }
      });

      if (error) {
        toast.error("Failed to analyze listing URL");
        console.error('Error:', error);
        return;
      }

      setListingData(data);
      setFormData(prev => ({ ...prev, title: data.title || "" }));
      setStep('configure');
    } catch (error) {
      toast.error("An error occurred while analyzing the listing");
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async () => {
    if (!user || !listingData) return;

    setStep('creating');
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('projects')
        .insert([{
          user_id: user.id,
          title: formData.title,
          aspect: formData.aspect,
          theme: formData.theme,
          listing_url: listingUrl,
          status: 'queued'
        }])
        .select()
        .single();

      if (error) {
        toast.error("Failed to create project");
        console.error('Error:', error);
        return;
      }

      // Start video generation process
      const { error: generateError } = await supabase.functions.invoke('generate-video', {
        body: { 
          projectId: data.id,
          listingData,
          projectConfig: formData
        }
      });

      if (generateError) {
        console.error('Video generation error:', generateError);
        toast.error("Project created but video generation failed to start");
      } else {
        toast.success("Project created successfully! Video generation has started.");
      }

      onProjectCreated();
      handleClose();
    } catch (error) {
      toast.error("An error occurred while creating the project");
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep('url');
    setListingUrl("");
    setListingData(null);
    setFormData({ title: "", aspect: "9x16", theme: "clean" });
    setLoading(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Video Project</DialogTitle>
          <DialogDescription>
            {step === 'url' && "Enter a real estate listing URL to get started"}
            {step === 'configure' && "Configure your video project settings"}
            {step === 'creating' && "Creating your project and starting video generation"}
          </DialogDescription>
        </DialogHeader>

        {step === 'url' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="url">Listing URL</Label>
              <div className="flex space-x-2">
                <Input
                  id="url"
                  placeholder="https://example.com/listing/123"
                  value={listingUrl}
                  onChange={(e) => setListingUrl(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={handleAnalyzeUrl} disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Analyze"}
                </Button>
              </div>
            </div>
            
            <div className="text-xs text-muted-foreground space-y-1">
              <p>Supported platforms:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Zillow, Realtor.com, Redfin</li>
                <li>MLS listings</li>
                <li>Real estate agency websites</li>
              </ul>
            </div>
          </div>
        )}

        {step === 'configure' && listingData && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  Property Details
                  <ExternalLink className="h-4 w-4" />
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="font-medium">{listingData.title}</p>
                  <p className="text-sm text-muted-foreground">{listingData.address}</p>
                  <p className="text-sm font-medium text-primary">{listingData.price}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {listingData.description}
                  </p>
                </div>
                <div className="text-sm text-muted-foreground">
                  Found {listingData.images.length} images
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Video Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Beautiful Downtown Condo"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Aspect Ratio</Label>
                  <Select 
                    value={formData.aspect} 
                    onValueChange={(value: any) => setFormData(prev => ({ ...prev, aspect: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="9x16">9:16 (Instagram/TikTok)</SelectItem>
                      <SelectItem value="1x1">1:1 (Square)</SelectItem>
                      <SelectItem value="16x9">16:9 (Landscape)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Theme</Label>
                  <Select 
                    value={formData.theme} 
                    onValueChange={(value: any) => setFormData(prev => ({ ...prev, theme: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="clean">Clean & Modern</SelectItem>
                      <SelectItem value="luxury">Luxury</SelectItem>
                      <SelectItem value="warm">Warm & Cozy</SelectItem>
                      <SelectItem value="professional">Professional</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="flex space-x-2">
              <Button variant="outline" onClick={() => setStep('url')}>
                Back
              </Button>
              <Button onClick={handleCreateProject} className="flex-1">
                Create Project
              </Button>
            </div>
          </div>
        )}

        {step === 'creating' && (
          <div className="space-y-4 text-center py-8">
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
            <div className="space-y-2">
              <h3 className="text-lg font-medium">Creating Your Project</h3>
              <p className="text-muted-foreground">
                This may take a moment while we process the listing and start video generation...
              </p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}