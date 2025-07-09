import React, { useState, useEffect, useCallback } from "react";
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
import { Calendar } from "@/components/ui/calendar";
import {
  CircleCheck,
  Award,
  TrendingUp,
  Shield,
  ShieldCheck,
  CalendarDays,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import StepChart from "./StepChart";
import SettingsPanel from "./SettingsPanel";
import LocationTracker from "./LocationTracker";
import healthAppService from "../services/healthAppService";
import blockingService, { BlockingStatus } from "../services/blockingService";

interface DashboardProps {
  currentSteps?: number;
  currentGymTime?: number;
  dailyGoal?: number;
  dailyGymGoal?: number;
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
  weeklyGymData?: Array<{
    date: string;
    gymTime: number;
  }>;
}

const Dashboard = ({
  currentSteps = 7842,
  currentGymTime = 45,
  dailyGoal = 10000,
  dailyGymGoal = 60,
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
  weeklyGymData = [
    { date: "Mon", gymTime: 65 },
    { date: "Tue", gymTime: 45 },
    { date: "Wed", gymTime: 90 },
    { date: "Thu", gymTime: 30 },
    { date: "Fri", gymTime: 75 },
    { date: "Sat", gymTime: 120 },
    { date: "Sun", gymTime: 0 },
  ],
}: DashboardProps) => {
  const [showSettings, setShowSettings] = useState(false);
  const [syncStatus, setSyncStatus] = useState<
    "idle" | "syncing" | "success" | "error"
  >("idle");
  const [blockingStatus, setBlockingStatus] = useState<BlockingStatus | null>(
    null,
  );

  const [goalAchievedDates, setGoalAchievedDates] = useState<Date[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    new Date(),
  );
  const [historicalStepData, setHistoricalStepData] = useState<
    Record<string, number>
  >({});
  const [historicalGymData, setHistoricalGymData] = useState<
    Record<string, number>
  >({});
  const [previousProgress, setPreviousProgress] = useState({
    stepProgress: 0,
    gymProgress: 0,
    overallProgress: 0,
  });

  // Get current tracking mode from blocking service
  const trackingMode = blockingStatus?.trackingMode || "steps";
  const isLocationMode = trackingMode === "location";
  const isBothMode = trackingMode === "both";

  // Calculate progress based on tracking mode with real-time updates
  const stepProgressPercentage = Math.min(
    Math.round((currentSteps / dailyGoal) * 100),
    100,
  );
  const gymProgressPercentage = Math.min(
    Math.round((currentGymTime / dailyGymGoal) * 100),
    100,
  );

  const progressPercentage = isBothMode
    ? Math.min(stepProgressPercentage, gymProgressPercentage) // Show the lower of the two for combined mode
    : isLocationMode
      ? gymProgressPercentage
      : stepProgressPercentage;

  // Real-time progress update handler
  const updateProgressWithAnimation = useCallback(() => {
    const newProgress = {
      stepProgress: stepProgressPercentage,
      gymProgress: gymProgressPercentage,
      overallProgress: progressPercentage,
    };

    // Only update if there's a significant change (>1%) to avoid excessive re-renders
    if (
      Math.abs(newProgress.stepProgress - previousProgress.stepProgress) > 1 ||
      Math.abs(newProgress.gymProgress - previousProgress.gymProgress) > 1 ||
      Math.abs(newProgress.overallProgress - previousProgress.overallProgress) >
        1
    ) {
      setPreviousProgress(newProgress);
    }
  }, [
    stepProgressPercentage,
    gymProgressPercentage,
    progressPercentage,
    previousProgress,
  ]);

  // Update progress in real-time
  useEffect(() => {
    updateProgressWithAnimation();
  }, [updateProgressWithAnimation]);

  useEffect(() => {
    // Update blocking service with current data based on tracking mode
    if (trackingMode === "steps") {
      blockingService.updateStepCount(currentSteps);
      localStorage.setItem("stepTracker_currentSteps", currentSteps.toString());
    } else {
      blockingService.updateGymTime(currentGymTime);
      localStorage.setItem("stepTracker_gymTime", currentGymTime.toString());
    }

    // Listen for blocking status updates
    const handleStatusUpdate = (status: BlockingStatus) => {
      setBlockingStatus(status);
    };

    blockingService.addListener(handleStatusUpdate);
    const initialStatus = blockingService.getBlockingStatus();
    setBlockingStatus(initialStatus);

    // Generate goal achieved dates and historical data
    const generateHistoricalData = () => {
      const dates: Date[] = [];
      const stepData: Record<string, number> = {};
      const gymData: Record<string, number> = {};
      const today = new Date();

      // Generate realistic data for the past 30 days
      for (let i = 0; i < 30; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        const dateKey = date.toISOString().split("T")[0];

        // Generate realistic step counts (3000-15000 range)
        const baseSteps = 6000 + Math.floor(Math.random() * 6000);
        const weekendMultiplier =
          date.getDay() === 0 || date.getDay() === 6 ? 0.7 : 1;
        const steps = Math.floor(baseSteps * weekendMultiplier);
        stepData[dateKey] = steps;

        // Generate realistic gym time (0-120 minutes)
        const baseGymTime = Math.floor(Math.random() * 90) + 30; // 30-120 minutes
        const gymTime =
          date.getDay() === 0 ? 0 : Math.floor(baseGymTime * weekendMultiplier);
        gymData[dateKey] = gymTime;

        // Add to goal achieved dates based on tracking mode
        const goalMet =
          trackingMode === "steps"
            ? steps >= dailyGoal
            : gymTime >= dailyGymGoal;

        if (goalMet) {
          dates.push(date);
        }
      }

      // Set today's data to current values
      const todayKey = today.toISOString().split("T")[0];
      stepData[todayKey] = currentSteps;
      gymData[todayKey] = currentGymTime;

      // Add today to goal achieved dates if goal is met
      const todayGoalMet =
        trackingMode === "steps"
          ? currentSteps >= dailyGoal
          : currentGymTime >= dailyGymGoal;

      if (todayGoalMet) {
        const todayExists = dates.some(
          (date) => date.toDateString() === today.toDateString(),
        );
        if (!todayExists) {
          dates.push(today);
        }
      }

      setGoalAchievedDates(dates);
      setHistoricalStepData(stepData);
      setHistoricalGymData(gymData);
    };

    generateHistoricalData();

    return () => {
      blockingService.removeListener(handleStatusUpdate);
    };
  }, [currentSteps, currentGymTime, dailyGoal, dailyGymGoal, trackingMode]);

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
            <h1 className="text-3xl font-bold">FitLock</h1>
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
                    {blockingStatus.trackingMode === "steps" ? (
                      <>
                        Complete{" "}
                        {blockingStatus.remainingSteps.toLocaleString()} more
                        steps to unlock blocked websites.
                      </>
                    ) : blockingStatus.trackingMode === "location" ? (
                      <>
                        Spend {blockingStatus.remainingGymTime} more minutes at
                        the gym to unlock blocked websites.
                      </>
                    ) : (
                      <>
                        Complete BOTH goals to unlock:
                        <br />• Steps:{" "}
                        {blockingStatus.stepGoalAchieved
                          ? "✓ Complete"
                          : `${blockingStatus.remainingSteps.toLocaleString()} remaining`}
                        <br />• Gym:{" "}
                        {blockingStatus.gymGoalAchieved
                          ? "✓ Complete"
                          : `${blockingStatus.remainingGymTime} min remaining`}
                      </>
                    )}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {blockingStatus &&
          blockingStatus.trackingMode === "both" &&
          !blockingStatus.isBlocked && (
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="h-5 w-5 text-blue-600" />
                  <div>
                    <h3 className="font-medium text-blue-800">
                      Dual Tracking Status
                    </h3>
                    <p className="text-sm text-blue-700">
                      Steps:{" "}
                      {blockingStatus.stepGoalAchieved
                        ? "✓ Complete"
                        : `${stepProgressPercentage}% (${blockingStatus.remainingSteps.toLocaleString()} remaining)`}
                      <br />
                      Gym:{" "}
                      {blockingStatus.gymGoalAchieved
                        ? "✓ Complete"
                        : `${gymProgressPercentage}% (${blockingStatus.remainingGymTime} min remaining)`}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

        {blockingStatus &&
          !blockingStatus.isBlocked &&
          ((blockingStatus.trackingMode === "steps" &&
            blockingStatus.currentSteps >= blockingStatus.goalSteps) ||
            (blockingStatus.trackingMode === "location" &&
              blockingStatus.currentGymTime >= blockingStatus.goalGymTime) ||
            (blockingStatus.trackingMode === "both" &&
              blockingStatus.stepGoalAchieved &&
              blockingStatus.gymGoalAchieved)) && (
            <Card className="border-green-200 bg-green-50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="h-5 w-5 text-green-600" />
                  <div>
                    <h3 className="font-medium text-green-800">
                      Goal Achieved! All Sites Unlocked
                    </h3>
                    <p className="text-sm text-green-700">
                      {blockingStatus.trackingMode === "steps"
                        ? "Congratulations! You've reached your daily step goal."
                        : blockingStatus.trackingMode === "location"
                          ? "Congratulations! You've completed your gym time goal."
                          : "Congratulations! You've completed both your step and gym goals!"}
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
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>
                    Today's Progress -{" "}
                    {isBothMode
                      ? "Dual Tracking"
                      : isLocationMode
                        ? "Gym Time"
                        : "Steps"}
                  </CardTitle>
                  <CardDescription>Friday, May 19, 2023</CardDescription>
                </div>
                {/* Tracking Method Toggle */}
                {!isBothMode && (
                  <div className="flex items-center gap-2 bg-muted rounded-lg p-1">
                    <button
                      onClick={() => {
                        blockingService.updateSettings({
                          trackingMode: "steps",
                        });
                      }}
                      className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${
                        trackingMode === "steps"
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Steps
                    </button>
                    <button
                      onClick={() => {
                        blockingService.updateSettings({
                          trackingMode: "location",
                        });
                      }}
                      className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${
                        trackingMode === "location"
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Gym
                    </button>
                  </div>
                )}
              </div>
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
                    <motion.circle
                      className="text-primary stroke-current"
                      strokeWidth="10"
                      strokeLinecap="round"
                      cx="50"
                      cy="50"
                      r="40"
                      fill="transparent"
                      strokeDasharray="251.2"
                      initial={{ strokeDashoffset: 251.2 }}
                      animate={{
                        strokeDashoffset:
                          251.2 - (251.2 * progressPercentage) / 100,
                      }}
                      transition={{
                        duration: 0.4,
                        ease: "easeInOut",
                      }}
                      transform="rotate(-90 50 50)"
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center justify-center">
                    {isBothMode ? (
                      <>
                        <div className="text-center">
                          <div className="text-2xl font-bold">
                            {currentSteps.toLocaleString()}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            of {dailyGoal.toLocaleString()} steps
                          </div>
                        </div>
                        <div className="text-center mt-1">
                          <div className="text-2xl font-bold">
                            {currentGymTime}min
                          </div>
                          <div className="text-xs text-muted-foreground">
                            of {dailyGymGoal} minutes
                          </div>
                        </div>
                      </>
                    ) : isLocationMode ? (
                      <>
                        <span className="text-4xl font-bold">
                          {currentGymTime}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          of {dailyGymGoal} minutes
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="text-4xl font-bold">
                          {currentSteps.toLocaleString()}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          of {dailyGoal.toLocaleString()} steps
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <motion.div
                  className="w-full"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <Progress
                    value={progressPercentage}
                    className="w-full h-2 transition-all duration-300 ease-in-out"
                  />
                </motion.div>
                <div className="flex items-center gap-2">
                  {isBothMode ? (
                    <div className="text-center">
                      <span className="text-lg font-medium">
                        Steps: {stepProgressPercentage}% | Gym:{" "}
                        {gymProgressPercentage}%
                      </span>
                      {blockingStatus?.stepGoalAchieved &&
                        blockingStatus?.gymGoalAchieved && (
                          <Badge className="bg-green-500 ml-2">
                            <CircleCheck className="w-4 h-4 mr-1" /> Both Goals
                            Reached
                          </Badge>
                        )}
                    </div>
                  ) : (
                    <>
                      <span className="text-lg font-medium">
                        {progressPercentage}% Complete
                      </span>
                      {progressPercentage >= 100 && (
                        <Badge className="bg-green-500">
                          <CircleCheck className="w-4 h-4 mr-1" /> Goal Reached
                        </Badge>
                      )}
                    </>
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

        {/* History Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              {isLocationMode ? "Gym History" : "Step History"}
            </CardTitle>
            <CardDescription>
              View your {isLocationMode ? "gym time" : "step"} progress over
              time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <StepChart
              stepData={{
                daily: weeklyData.map((item) => ({
                  date: item.date,
                  steps: item.steps,
                })),
                weekly: [
                  { date: "Week 1", steps: 52000 },
                  { date: "Week 2", steps: 48500 },
                  { date: "Week 3", steps: 61200 },
                  { date: "Week 4", steps: 43800 },
                ],
                monthly: [
                  { date: "January", steps: 231456 },
                  { date: "February", steps: 198732 },
                  { date: "March", steps: 245678 },
                  { date: "April", steps: 213567 },
                  { date: "May", steps: 267890 },
                  { date: "June", steps: 243219 },
                  { date: "July", steps: 254321 },
                  { date: "August", steps: 268754 },
                  { date: "September", steps: 241987 },
                  { date: "October", steps: 229876 },
                  { date: "November", steps: 235432 },
                  { date: "December", steps: 248765 },
                ],
              }}
              gymData={{
                daily: weeklyGymData.map((item) => ({
                  date: item.date,
                  steps: item.gymTime,
                })),
                weekly: [
                  { date: "Week 1", steps: 420 },
                  { date: "Week 2", steps: 380 },
                  { date: "Week 3", steps: 510 },
                  { date: "Week 4", steps: 290 },
                ],
                monthly: [
                  { date: "January", steps: 1680 },
                  { date: "February", steps: 1520 },
                  { date: "March", steps: 1890 },
                  { date: "April", steps: 1650 },
                  { date: "May", steps: 1980 },
                  { date: "June", steps: 1740 },
                  { date: "July", steps: 1820 },
                  { date: "August", steps: 1950 },
                  { date: "September", steps: 1680 },
                  { date: "October", steps: 1590 },
                  { date: "November", steps: 1720 },
                  { date: "December", steps: 1860 },
                ],
              }}
              goal={dailyGoal}
              gymGoal={dailyGymGoal}
              trackingMode={trackingMode}
            />
          </CardContent>
        </Card>

        {/* Goal Achievement Calendar */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="w-5 h-5" /> Goal Calendar
            </CardTitle>
            <CardDescription>
              Days when you achieved your step goal
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col lg:flex-row gap-6">
              <div className="flex-shrink-0">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  className="rounded-md border"
                  modifiers={{
                    goalAchieved: goalAchievedDates,
                  }}
                  modifiersStyles={{
                    goalAchieved: {
                      backgroundColor: "#10b981",
                      color: "white",
                      fontWeight: "bold",
                    },
                  }}
                  disabled={(date) => date > new Date()}
                />
              </div>
              <div className="flex-1 space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span>Goal achieved ({goalAchievedDates.length} days)</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="w-3 h-3 bg-muted rounded-full"></div>
                    <span>Goal not achieved</span>
                  </div>
                </div>
                {selectedDate && (
                  <div className="pt-4 border-t">
                    <p className="text-sm font-medium mb-2">
                      {selectedDate.toLocaleDateString("en-US", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                    {(() => {
                      const dateKey = selectedDate.toISOString().split("T")[0];
                      const stepsForDate = historicalStepData[dateKey];
                      const gymTimeForDate = historicalGymData[dateKey];
                      const goalAchieved = goalAchievedDates.some(
                        (date) =>
                          date.toDateString() === selectedDate.toDateString(),
                      );

                      const currentValue = isLocationMode
                        ? gymTimeForDate
                        : stepsForDate;
                      const currentGoal = isLocationMode
                        ? dailyGymGoal
                        : dailyGoal;
                      const unit = isLocationMode ? "minutes" : "steps";

                      return (
                        <div className="space-y-1">
                          {currentValue !== undefined && (
                            <p className="text-sm font-medium">
                              {isLocationMode ? "Gym Time" : "Steps"}:{" "}
                              {isLocationMode
                                ? currentValue
                                : currentValue.toLocaleString()}{" "}
                              {unit}
                            </p>
                          )}
                          <p className="text-sm text-muted-foreground">
                            {goalAchieved ? (
                              <span className="text-green-600 font-medium">
                                ✓ Goal achieved! (
                                {Math.round(
                                  ((currentValue || 0) / currentGoal) * 100,
                                )}
                                %)
                              </span>
                            ) : currentValue !== undefined ? (
                              <span className="text-orange-600">
                                Goal not achieved (
                                {Math.round(
                                  ((currentValue || 0) / currentGoal) * 100,
                                )}
                                %)
                              </span>
                            ) : (
                              "No data available"
                            )}
                          </p>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Location Tracker - Hidden from user but still functional */}
        {blockingStatus && blockingStatus.trackingMode === "location" && (
          <div style={{ display: "none" }}>
            <LocationTracker
              trackingEnabled={true}
              gymLocation={{
                latitude: blockingService.getSettings().locationGoal.latitude,
                longitude: blockingService.getSettings().locationGoal.longitude,
                name: blockingService.getSettings().locationGoal.gymName,
                radiusMeters:
                  blockingService.getSettings().locationGoal.radiusMeters,
              }}
              onGymStatusChange={(isAtGym, timeSpent) => {
                if (!isAtGym) {
                  blockingService.updateGymTime(timeSpent);
                  localStorage.setItem(
                    "stepTracker_gymTime",
                    timeSpent.toString(),
                  );
                }
              }}
            />
          </div>
        )}

        {/* Settings Panel */}
        {showSettings && (
          <Card>
            <CardHeader>
              <CardTitle>Settings</CardTitle>
              <CardDescription>
                Configure your goals and reminders
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
