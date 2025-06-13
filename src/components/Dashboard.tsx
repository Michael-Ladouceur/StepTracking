import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  CircleCheck,
  Award,
  TrendingUp,
  Clock,
  Shield,
  ShieldCheck,
} from "lucide-react";
import StepChart from "./StepChart";
import SettingsPanel from "./SettingsPanel";
import healthAppService from "../services/healthAppService";
import blockingService, { BlockingStatus } from "../services/blockingService";

interface DashboardProps {
  currentSteps?: number;
  dailyGoal?: number;
  achievements?: Array<{
    id: string;
    title: string;
    description: string;
    earned: boolean;
    date?: string;
  }>;
  weeklyData?: Array<{
    date: string;
    steps: number;
  }>;
}

const Dashboard = ({
  currentSteps = 7842,
  dailyGoal = 10000,
  achievements = [
    {
      id: "1",
      title: "First Steps",
      description: "Complete your first 1,000 steps",
      earned: true,
      date: "2023-05-15",
    },
    {
      id: "2",
      title: "Consistent Walker",
      description: "Reach your step goal 3 days in a row",
      earned: true,
      date: "2023-05-18",
    },
    {
      id: "3",
      title: "Step Master",
      description: "Complete 100,000 total steps",
      earned: false,
    },
    {
      id: "4",
      title: "Marathon Walker",
      description: "Walk 26.2 miles in a week",
      earned: false,
    },
  ],
  weeklyData = [
    { date: "Mon", steps: 8245 },
    { date: "Tue", steps: 9471 },
    { date: "Wed", steps: 7523 },
    { date: "Thu", steps: 10248 },
    { date: "Fri", steps: 7842 },
    { date: "Sat", steps: 5327 },
    { date: "Sun", steps: 0 },
  ],
}: DashboardProps) => {
  const [showSettings, setShowSettings] = useState(false);
  const [syncStatus, setSyncStatus] = useState<
    "idle" | "syncing" | "success" | "error"
  >("idle");
  const [blockingStatus, setBlockingStatus] = useState<BlockingStatus | null>(
    null,
  );
  const progressPercentage = Math.min(
    Math.round((currentSteps / dailyGoal) * 100),
    100,
  );

  useEffect(() => {
    // Update blocking service with current step count
    blockingService.updateStepCount(currentSteps);
    localStorage.setItem("stepTracker_currentSteps", currentSteps.toString());

    // Listen for blocking status updates
    const handleStatusUpdate = (status: BlockingStatus) => {
      setBlockingStatus(status);
    };

    blockingService.addListener(handleStatusUpdate);
    setBlockingStatus(blockingService.getBlockingStatus());

    return () => {
      blockingService.removeListener(handleStatusUpdate);
    };
  }, [currentSteps]);

  const handleSyncHealthApps = async () => {
    setSyncStatus("syncing");
    try {
      await healthAppService.syncAllApps();
      setSyncStatus("success");
      setTimeout(() => setSyncStatus("idle"), 2000);
    } catch (error) {
      setSyncStatus("error");
      setTimeout(() => setSyncStatus("idle"), 2000);
    }
  };

  return (
    <div className="w-full h-full p-6 bg-background">
      <div className="flex flex-col gap-6 max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Step Tracker</h1>
            <p className="text-muted-foreground">
              Track your daily movement and boost productivity
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSyncHealthApps}
              disabled={syncStatus === "syncing"}
              className="px-4 py-2 rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/90 disabled:opacity-50 flex items-center gap-2"
            >
              {syncStatus === "syncing" ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Syncing...
                </>
              ) : syncStatus === "success" ? (
                <>
                  <CircleCheck className="w-4 h-4" />
                  Synced
                </>
              ) : syncStatus === "error" ? (
                "Sync Failed"
              ) : (
                "Sync Health Apps"
              )}
            </button>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {showSettings ? "Close Settings" : "Settings"}
            </button>
          </div>
        </div>

        {/* Blocking Status Alert */}
        {blockingStatus && blockingStatus.isBlocked && (
          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-orange-600" />
                <div>
                  <h3 className="font-medium text-orange-800">
                    Website Blocking Active
                  </h3>
                  <p className="text-sm text-orange-700">
                    Complete {blockingStatus.remainingSteps.toLocaleString()}{" "}
                    more steps to unlock blocked websites.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {blockingStatus &&
          !blockingStatus.isBlocked &&
          blockingStatus.currentSteps >= blockingStatus.goalSteps && (
            <Card className="border-green-200 bg-green-50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="h-5 w-5 text-green-600" />
                  <div>
                    <h3 className="font-medium text-green-800">
                      Goal Achieved! All Sites Unlocked
                    </h3>
                    <p className="text-sm text-green-700">
                      Congratulations! You've reached your daily step goal.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

        {/* Main Content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Today's Progress */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Today's Progress</CardTitle>
              <CardDescription>Friday, May 19, 2023</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center gap-4">
                <div className="relative w-48 h-48 flex items-center justify-center">
                  <svg
                    className="w-full h-full border-[#e3f0e1]"
                    viewBox="0 0 100 100"
                  >
                    <circle
                      className="text-muted stroke-current"
                      strokeWidth="10"
                      cx="50"
                      cy="50"
                      r="40"
                      fill="transparent"
                    />
                    <circle
                      className="text-primary stroke-current"
                      strokeWidth="10"
                      strokeLinecap="round"
                      cx="50"
                      cy="50"
                      r="40"
                      fill="transparent"
                      strokeDasharray="251.2"
                      strokeDashoffset={
                        251.2 - (251.2 * progressPercentage) / 100
                      }
                      transform="rotate(-90 50 50)"
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center justify-center">
                    <span className="text-4xl font-bold">
                      {currentSteps.toLocaleString()}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      of {dailyGoal.toLocaleString()} steps
                    </span>
                  </div>
                </div>
                <Progress value={progressPercentage} className="w-full h-2" />
                <div className="flex items-center gap-2">
                  <span className="text-lg font-medium">
                    {progressPercentage}% Complete
                  </span>
                  {progressPercentage >= 100 && (
                    <Badge className="bg-green-500">
                      <CircleCheck className="w-4 h-4 mr-1" /> Goal Reached
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Achievements */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="w-5 h-5" /> Achievements
              </CardTitle>
              <CardDescription>Your earned badges</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {achievements.map((achievement) => (
                  <div
                    key={achievement.id}
                    className={`p-3 rounded-lg border ${achievement.earned ? "bg-muted/50" : "bg-muted/20 opacity-60"}`}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={`p-2 rounded-full ${achievement.earned ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"}`}
                      >
                        <Award className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-medium">{achievement.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          {achievement.description}
                        </p>
                        {achievement.earned && achievement.date && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Earned on {achievement.date}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Step History Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" /> Step History
            </CardTitle>
            <CardDescription>View your progress over time</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="weekly">
              <TabsList className="mb-4">
                <TabsTrigger value="daily">Daily</TabsTrigger>
                <TabsTrigger value="weekly">Weekly</TabsTrigger>
                <TabsTrigger value="monthly">Monthly</TabsTrigger>
              </TabsList>
              <TabsContent value="daily" className="h-[300px]">
                <StepChart data={[{ date: "Today", steps: currentSteps }]} />
              </TabsContent>
              <TabsContent value="weekly" className="h-[300px]">
                <StepChart data={weeklyData} />
              </TabsContent>
              <TabsContent value="monthly" className="h-[300px]">
                <StepChart
                  data={[
                    { date: "Week 1", steps: 52000 },
                    { date: "Week 2", steps: 48500 },
                    { date: "Week 3", steps: 61200 },
                    { date: "Week 4", steps: 43800 },
                  ]}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Movement Break Reminders */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" /> Movement Breaks
            </CardTitle>
            <CardDescription>Scheduled reminders to get moving</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {["Morning Break", "Lunch Walk", "Afternoon Stretch"].map(
                (reminder, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <h4 className="font-medium">{reminder}</h4>
                    <p className="text-sm text-muted-foreground">
                      {["10:30 AM", "12:45 PM", "3:15 PM"][index]}
                    </p>
                    <Badge variant="outline" className="mt-2">
                      Active
                    </Badge>
                  </div>
                ),
              )}
            </div>
          </CardContent>
        </Card>

        {/* Settings Panel */}
        {showSettings && (
          <Card>
            <CardHeader>
              <CardTitle>Settings</CardTitle>
              <CardDescription>
                Configure your step goals and reminders
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SettingsPanel
                isOpen={true}
                onSave={(settings) => {
                  console.log("Settings saved:", settings);
                  setShowSettings(false);
                }}
              />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
