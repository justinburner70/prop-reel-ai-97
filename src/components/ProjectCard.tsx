import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Video, Download, Eye } from "lucide-react";
import { ProjectStatusBadge } from "./ProjectStatusBadge";

interface ProjectCardProps {
  project: {
    id: string;
    title: string;
    status: string;
    created_at: string;
    aspect: string;
    theme: string;
  };
  onProjectClick: (projectId: string) => void;
}

export function ProjectCard({ project, onProjectClick }: ProjectCardProps) {
  return (
    <Card className="hover:shadow-md transition-all duration-200 cursor-pointer group" onClick={() => onProjectClick(project.id)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg group-hover:text-primary transition-colors">
            {project.title}
          </CardTitle>
          <ProjectStatusBadge status={project.status} />
        </div>
        <CardDescription>
          {project.aspect} • {project.theme} theme
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="aspect-video bg-muted rounded-md flex items-center justify-center mb-4 overflow-hidden">
          {project.status === 'done' ? (
            <div className="relative w-full h-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Eye className="h-8 w-8 text-primary" />
              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <span className="text-white text-sm font-medium">Click to view</span>
              </div>
            </div>
          ) : (
            <Video className="h-8 w-8 text-muted-foreground" />
          )}
        </div>
        <div className="flex justify-between items-center text-sm text-muted-foreground">
          <span>Created {new Date(project.created_at).toLocaleDateString()}</span>
          {project.status === "done" && (
            <Button 
              size="sm" 
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                // Handle download
              }}
            >
              <Download className="h-3 w-3 mr-1" />
              Download
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}