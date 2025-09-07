import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Video, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { ProjectCard } from "@/components/ProjectCard";
import { useNavigate } from "react-router-dom";
import { CreateProjectModal } from "@/components/CreateProjectModal";
import { ProjectDetailModal } from "@/components/ProjectDetailModal";
import { DashboardStats } from "@/components/DashboardStats";
import { toast } from "sonner";

interface Project {
  id: string;
  title: string;
  status: string;
  created_at: string;
  aspect: string;
  theme: string;
}

const Dashboard = () => {
  const { user, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [userStats, setUserStats] = useState({
    totalProjects: 0,
    videosGenerated: 0,
    freeClipsRemaining: 0,
    recentActivity: {
      projectsThisWeek: 0,
      videosThisWeek: 0
    }
  });

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
      return;
    }

    if (user) {
      fetchProjects();
      fetchUserStats();
    }
  }, [user, loading, navigate]);

  const fetchProjects = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast.error("Failed to load projects");
    }
  };

  // Set up real-time subscription for project updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('project-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'projects',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Real-time project update:', payload);
          
          if (payload.eventType === 'INSERT') {
            setProjects(prev => [payload.new as Project, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setProjects(prev => prev.map(project => 
              project.id === payload.new.id ? payload.new as Project : project
            ));
            
            // Show toast for important status changes
            const newProject = payload.new as Project;
            if (newProject.status === 'done') {
              toast.success(`Video for "${newProject.title}" is ready!`);
            } else if (newProject.status === 'error') {
              toast.error(`Video generation failed for "${newProject.title}"`);
            }
          } else if (payload.eventType === 'DELETE') {
            setProjects(prev => prev.filter(project => project.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const fetchUserStats = async () => {
    if (!user) return;

    // Fetch trial info
    const { data: trialData } = await supabase
      .from('trials')
      .select('free_clips_remaining')
      .eq('user_id', user.id)
      .single();

    // Count projects and completed videos
    const { data: projectData } = await supabase
      .from('projects')
      .select('status, created_at, updated_at')
      .eq('user_id', user.id);

    const totalProjects = projectData?.length || 0;
    const videosGenerated = projectData?.filter(p => p.status === 'done').length || 0;
    const freeClipsRemaining = trialData?.free_clips_remaining || 0;

    // Calculate recent activity (projects/videos from last 7 days)
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const recentProjects = projectData?.filter(p => 
      new Date(p.created_at) >= oneWeekAgo
    ) || [];
    
    const recentVideos = projectData?.filter(p => 
      p.status === 'done' && new Date(p.updated_at) >= oneWeekAgo
    ) || [];

    setUserStats({
      totalProjects,
      videosGenerated,
      freeClipsRemaining,
      recentActivity: {
        projectsThisWeek: recentProjects.length,
        videosThisWeek: recentVideos.length
      }
    });
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const handleProjectClick = (projectId: string) => {
    setSelectedProjectId(projectId);
    setShowDetailModal(true);
  };

  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-lg">Loading...</div>
    </div>;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Video className="h-8 w-8 text-primary" />
              <span className="text-2xl font-bold">PropVids</span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-muted-foreground">Welcome, {user?.email}</span>
              <Button variant="ghost" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">Manage your video projects</p>
          </div>
          <Button size="lg" className="text-lg px-6" onClick={() => setShowCreateModal(true)}>
            <Plus className="h-5 w-5 mr-2" />
            New Project from Listing URL
          </Button>
        </div>

        <div className="mb-8">
          <DashboardStats stats={userStats} onRefresh={fetchUserStats} />
        </div>

        {/* Projects Grid */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Your Projects</h2>
            {projects.length > 0 && (
              <Button variant="outline" onClick={fetchProjects}>
                Refresh
              </Button>
            )}
          </div>
          
          {projects.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <Video className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No projects yet</h3>
                <p className="text-muted-foreground mb-6">
                  Create your first video from a real estate listing URL
                </p>
                <Button onClick={() => setShowCreateModal(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Project
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => (
                <ProjectCard key={project.id} project={project} onProjectClick={handleProjectClick} />
              ))}
            </div>
          )}
        </div>

      </div>

      <CreateProjectModal 
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onProjectCreated={fetchProjects}
      />

      <ProjectDetailModal
        open={showDetailModal}
        onOpenChange={setShowDetailModal}
        projectId={selectedProjectId}
      />
    </div>
  );
};

export default Dashboard;