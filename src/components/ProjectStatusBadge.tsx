import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, AlertCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProjectStatusBadgeProps {
  status: string;
  className?: string;
  showIcon?: boolean;
}

export function ProjectStatusBadge({ status, className, showIcon = true }: ProjectStatusBadgeProps) {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case "done":
        return {
          text: "Completed",
          icon: CheckCircle,
          variant: "default" as const,
          className: "bg-success text-success-foreground border-success/20"
        };
      case "rendering":
        return {
          text: "Rendering",
          icon: Loader2,
          variant: "secondary" as const,
          className: "bg-warning text-warning-foreground border-warning/20",
          animate: true
        };
      case "queued":
        return {
          text: "Queued",
          icon: Clock,
          variant: "outline" as const,
          className: "bg-muted text-muted-foreground border-muted-foreground/20"
        };
      case "error":
        return {
          text: "Error",
          icon: AlertCircle,
          variant: "destructive" as const,
          className: "bg-destructive text-destructive-foreground border-destructive/20"
        };
      default:
        return {
          text: "Draft",
          icon: Clock,
          variant: "outline" as const,
          className: "bg-muted text-muted-foreground border-muted-foreground/20"
        };
    }
  };

  const config = getStatusConfig(status);
  const Icon = config.icon;

  return (
    <Badge 
      variant={config.variant}
      className={cn(config.className, className)}
    >
      <div className="flex items-center space-x-1">
        {showIcon && (
          <Icon 
            className={cn(
              "h-3 w-3", 
              config.animate && "animate-spin"
            )} 
          />
        )}
        <span className="text-xs font-medium">{config.text}</span>
      </div>
    </Badge>
  );
}