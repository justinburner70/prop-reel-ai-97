import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, Clock, AlertCircle, TrendingUp, Video, Users, Calendar } from "lucide-react";

interface StatsData {
  totalProjects: number;
  videosGenerated: number;
  freeClipsRemaining: number;
  recentActivity: {
    projectsThisWeek: number;
    videosThisWeek: number;
  };
}

interface DashboardStatsProps {
  stats: StatsData;
  onRefresh?: () => void;
}

export function DashboardStats({ stats, onRefresh }: DashboardStatsProps) {
  const [animatedStats, setAnimatedStats] = useState({
    totalProjects: 0,
    videosGenerated: 0,
    freeClipsRemaining: 0
  });

  // Animate numbers on mount/update
  useEffect(() => {
    const duration = 1000; // 1 second
    const steps = 50;
    const stepDuration = duration / steps;

    let currentStep = 0;
    const interval = setInterval(() => {
      currentStep++;
      const progress = currentStep / steps;
      
      setAnimatedStats({
        totalProjects: Math.floor(stats.totalProjects * progress),
        videosGenerated: Math.floor(stats.videosGenerated * progress),
        freeClipsRemaining: Math.floor(stats.freeClipsRemaining * progress)
      });

      if (currentStep >= steps) {
        clearInterval(interval);
        setAnimatedStats({
          totalProjects: stats.totalProjects,
          videosGenerated: stats.videosGenerated,
          freeClipsRemaining: stats.freeClipsRemaining
        });
      }
    }, stepDuration);

    return () => clearInterval(interval);
  }, [stats]);

  const completionRate = stats.totalProjects > 0 ? (stats.videosGenerated / stats.totalProjects) * 100 : 0;
  const usageProgress = stats.freeClipsRemaining > 0 ? ((2 - stats.freeClipsRemaining) / 2) * 100 : 100;

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Total Projects */}
      <Card className="relative overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total Projects
          </CardTitle>
          <Video className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{animatedStats.totalProjects}</div>
          {stats.recentActivity.projectsThisWeek > 0 && (
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              <TrendingUp className="h-3 w-3 mr-1 text-success" />
              +{stats.recentActivity.projectsThisWeek} this week
            </div>
          )}
        </CardContent>
        <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-primary/20 to-primary" />
      </Card>

      {/* Videos Generated */}
      <Card className="relative overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Videos Generated
          </CardTitle>
          <CheckCircle className="h-4 w-4 text-success" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{animatedStats.videosGenerated}</div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-muted-foreground">
              {completionRate.toFixed(0)}% completion rate
            </span>
          </div>
          <Progress value={completionRate} className="mt-2 h-1" />
        </CardContent>
      </Card>

      {/* Free Clips Remaining */}
      <Card className="relative overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Free Clips Remaining
          </CardTitle>
          <Clock className="h-4 w-4 text-warning" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{animatedStats.freeClipsRemaining}</div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-muted-foreground">
              {usageProgress.toFixed(0)}% used
            </span>
            {stats.freeClipsRemaining === 0 && (
              <Badge variant="outline" className="text-xs">
                Upgrade needed
              </Badge>
            )}
          </div>
          <Progress value={usageProgress} className="mt-2 h-1" />
        </CardContent>
      </Card>

      {/* Current Plan */}
      <Card className="relative overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Current Plan
          </CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-lg font-bold">Free Trial</div>
          <div className="text-xs text-muted-foreground mt-1">
            2 watermarked videos included
          </div>
          {stats.freeClipsRemaining === 0 && (
            <Button size="sm" className="mt-2 w-full" variant="outline">
              Upgrade Plan
            </Button>
          )}
        </CardContent>
        <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-warning/20 to-warning" />
      </Card>
    </div>
  );
}