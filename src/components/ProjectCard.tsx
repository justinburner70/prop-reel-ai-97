import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Clock, AlertCircle, Video } from "lucide-react";

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

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => onProjectClick(project.id)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{project.title}</CardTitle>
          <div className="flex items-center space-x-2">
            {getStatusIcon(project.status)}
            <span className="text-sm text-muted-foreground">
              {getStatusText(project.status)}
            </span>
          </div>
        </div>
        <CardDescription>
          {project.aspect} • {project.theme} theme
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="aspect-video bg-muted rounded-md flex items-center justify-center mb-4">
          <Video className="h-8 w-8 text-muted-foreground" />
        </div>
        <div className="flex justify-between items-center text-sm text-muted-foreground">
          <span>Created {new Date(project.created_at).toLocaleDateString()}</span>
          {project.status === "done" && (
            <Button size="sm" variant="outline">
              Download
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}