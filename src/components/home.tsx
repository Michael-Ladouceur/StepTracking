import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Settings, User, Award, BarChart2, LogOut } from "lucide-react";
import Dashboard from "./Dashboard";
import SettingsPanel from "./SettingsPanel";
import Auth from "./Auth";
import { Progress } from "@/components/ui/progress";
import authService, { AuthState } from "../services/authService";

const Home = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [authState, setAuthState] = useState<AuthState>(
    authService.getAuthState(),
  );
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Mock data for UI scaffolding
  const mockData = {
    dailySteps: 7842,
    goalSteps: 10000,
    achievements: [
      {
        id: 1,
        name: "First Mile",
        description: "Walk your first mile",
        completed: true,
      },
      {
        id: 2,
        name: "Step Master",
        description: "Complete 10,000 steps in a day",
        completed: false,
      },
      {
        id: 3,
        name: "Consistency King",
        description: "Hit your goal 7 days in a row",
        completed: true,
      },
    ],
    weeklyAverage: 8245,
  };

  const progressPercentage = (mockData.dailySteps / mockData.goalSteps) * 100;

  useEffect(() => {
    const handleAuthStateChange = (state: AuthState) => {
      setAuthState(state);
    };

    authService.addListener(handleAuthStateChange);
    return () => authService.removeListener(handleAuthStateChange);
  }, []);

  const handleSignOut = async () => {
    await authService.signOut();
    setShowUserMenu(false);
  };

  // Show auth component if user is not authenticated
  if (!authState.isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Auth onAuthSuccess={() => setAuthState(authService.getAuthState())} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <header className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-2">
          <div className="bg-primary p-2 rounded-full">
            <BarChart2 className="h-6 w-6 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold">StepTracker</h1>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
          >
            <Settings className="h-5 w-5" />
          </Button>
          <div className="relative">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowUserMenu(!showUserMenu)}
            >
              <User className="h-5 w-5" />
            </Button>
            {showUserMenu && (
              <div className="absolute right-0 top-12 w-64 bg-white border rounded-lg shadow-lg z-50 p-4">
                <div className="space-y-3">
                  <div className="border-b pb-3">
                    <p className="font-medium">{authState.user?.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {authState.user?.email}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Member since{" "}
                      {authState.user?.createdAt
                        ? new Date(
                            authState.user.createdAt,
                          ).toLocaleDateString()
                        : "N/A"}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSignOut}
                    className="w-full justify-start"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>
      <main className="container mx-auto">
        <Tabs
          defaultValue="dashboard"
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full"
        >
          <div className="flex justify-between items-center mb-6">
            <TabsList>
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
              <TabsTrigger value="achievements">Achievements</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="history" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Step History</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  View your step history over time
                </p>
                {/* Step Chart would be rendered here */}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="col-span-1 md:col-span-2">
                <CardHeader>
                  <CardTitle>Today's Progress</CardTitle>
                </CardHeader>
                <CardContent>
                  <Dashboard />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Daily Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="text-center">
                    <span className="text-4xl font-bold">
                      {mockData.dailySteps.toLocaleString()}
                    </span>
                    <p className="text-muted-foreground">steps today</p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">
                        Goal: {mockData.goalSteps.toLocaleString()} steps
                      </span>
                      <span className="text-sm font-medium">
                        {Math.round(progressPercentage)}%
                      </span>
                    </div>
                    <Progress value={progressPercentage} className="h-2" />
                  </div>

                  <div className="pt-4 border-t">
                    <p className="text-sm text-muted-foreground mb-2">
                      Weekly Average
                    </p>
                    <p className="text-xl font-semibold">
                      {mockData.weeklyAverage.toLocaleString()} steps
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="achievements" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Your Achievements</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {mockData.achievements.map((achievement) => (
                    <div
                      key={achievement.id}
                      className={`p-4 border rounded-lg flex items-center gap-3 ${achievement.completed ? "bg-primary/10" : "bg-muted/50"}`}
                    >
                      <div
                        className={`p-2 rounded-full ${achievement.completed ? "bg-primary" : "bg-muted"}`}
                      >
                        <Award
                          className={`h-5 w-5 ${achievement.completed ? "text-primary-foreground" : "text-muted-foreground"}`}
                        />
                      </div>
                      <div>
                        <h3 className="font-medium">{achievement.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {achievement.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 flex justify-end">
          <div className="bg-background w-full max-w-md h-full overflow-y-auto p-6 shadow-lg">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Settings</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsSettingsOpen(false)}
              >
                <span className="sr-only">Close</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="lucide lucide-x"
                >
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </Button>
            </div>
            <SettingsPanel />
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
