import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Video, Clock, CheckCircle, AlertCircle } from "lucide-react";

const Dashboard = () => {
  // Mock projects data
  const projects = [
    {
      id: "1",
      title: "Luxury Downtown Condo",
      status: "done",
      createdAt: "2024-01-15",
      aspect: "9x16",
      theme: "luxury"
    },
    {
      id: "2", 
      title: "Suburban Family Home",
      status: "rendering",
      createdAt: "2024-01-14",
      aspect: "1x1",
      theme: "clean"
    },
    {
      id: "3",
      title: "Modern Apartment",
      status: "idle",
      createdAt: "2024-01-13",
      aspect: "16x9",
      theme: "modern"
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "done":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "rendering":
        return <Clock className="h-5 w-5 text-yellow-500 animate-spin" />;
      case "error":
        return <AlertCircle className="h-5 w-5 text-red-500" />;
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
              <Button variant="ghost">Billing</Button>
              <Button variant="ghost">Account</Button>
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
          <Button size="lg" className="text-lg px-6">
            <Plus className="h-5 w-5 mr-2" />
            New Project from Listing URL
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Projects</CardDescription>
              <CardTitle className="text-2xl">3</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Videos Generated</CardDescription>
              <CardTitle className="text-2xl">1</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Free Clips Remaining</CardDescription>
              <CardTitle className="text-2xl">2</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Current Plan</CardDescription>
              <CardTitle className="text-lg">Free Trial</CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Projects Grid */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold">Your Projects</h2>
          
          {projects.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <Video className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No projects yet</h3>
                <p className="text-muted-foreground mb-6">
                  Create your first video from a real estate listing URL
                </p>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Project
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => (
                <Card key={project.id} className="hover:shadow-md transition-shadow cursor-pointer">
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
                      <span>Created {new Date(project.createdAt).toLocaleDateString()}</span>
                      {project.status === "done" && (
                        <Button size="sm" variant="outline">
                          Download
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;