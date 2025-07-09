import React, { useState, useEffect } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { motion, AnimatePresence } from "framer-motion";

interface StepData {
  date: string;
  steps: number;
}

interface StepChartProps {
  stepData?: {
    daily?: StepData[];
    weekly?: StepData[];
    monthly?: StepData[];
  };
  gymData?: {
    daily?: StepData[];
    weekly?: StepData[];
    monthly?: StepData[];
  };
  goal?: number;
  gymGoal?: number;
  trackingMode?: "steps" | "location" | "both";
}

const StepChart = ({
  stepData = {
    daily: [
      { date: "Sunday", steps: 7652 },
      { date: "Monday", steps: 8432 },
      { date: "Tuesday", steps: 7621 },
      { date: "Wednesday", steps: 9214 },
      { date: "Thursday", steps: 6532 },
      { date: "Friday", steps: 8945 },
      { date: "Saturday", steps: 11023 },
    ],
    weekly: [
      { date: "Week 1", steps: 52341 },
      { date: "Week 2", steps: 48762 },
      { date: "Week 3", steps: 61234 },
      { date: "Week 4", steps: 57890 },
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
  },
  gymData = {
    daily: [
      { date: "Sunday", steps: 0 },
      { date: "Monday", steps: 65 },
      { date: "Tuesday", steps: 45 },
      { date: "Wednesday", steps: 90 },
      { date: "Thursday", steps: 30 },
      { date: "Friday", steps: 75 },
      { date: "Saturday", steps: 120 },
    ],
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
  },
  goal = 10000,
  gymGoal = 60,
  trackingMode = "steps",
}: StepChartProps) => {
  const [activeView, setActiveView] = useState("daily");
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [chartKey, setChartKey] = useState(0);

  // Handle view transitions with animation
  const handleViewChange = (newView: string) => {
    if (newView !== activeView) {
      setIsTransitioning(true);
      setTimeout(() => {
        setActiveView(newView);
        setChartKey((prev) => prev + 1);
        setTimeout(() => setIsTransitioning(false), 100);
      }, 200);
    }
  };

  useEffect(() => {
    // Reset transition state if data changes
    setIsTransitioning(false);
  }, [stepData, gymData]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const stepValue =
        payload.find((p: any) => p.dataKey === "steps")?.value || 0;
      const gymValue =
        payload.find((p: any) => p.dataKey === "gymTime")?.value || 0;

      return (
        <div className="bg-background border rounded-md p-3 shadow-md">
          <p className="font-medium">{`${label}`}</p>
          {(trackingMode === "steps" || trackingMode === "both") && (
            <p className="text-blue-600">{`${stepValue.toLocaleString()} steps`}</p>
          )}
          {(trackingMode === "location" || trackingMode === "both") && (
            <p className="text-green-600">{`${gymValue} minutes`}</p>
          )}
          {trackingMode === "both" && (
            <div className="text-xs text-muted-foreground mt-1">
              <p>
                Steps:{" "}
                {stepValue >= goal
                  ? "✓ Goal achieved"
                  : `${(goal - stepValue).toLocaleString()} to goal`}
              </p>
              <p>
                Gym:{" "}
                {gymValue >= gymGoal
                  ? "✓ Goal achieved"
                  : `${gymGoal - gymValue} min to goal`}
              </p>
            </div>
          )}
          {trackingMode === "steps" && goal && (
            <p className="text-xs text-muted-foreground">
              {stepValue >= goal
                ? `Goal achieved! +${(stepValue - goal).toLocaleString()} steps`
                : `${(goal - stepValue).toLocaleString()} steps to goal`}
            </p>
          )}
          {trackingMode === "location" && gymGoal && (
            <p className="text-xs text-muted-foreground">
              {gymValue >= gymGoal
                ? `Goal achieved! +${gymValue - gymGoal} minutes`
                : `${gymGoal - gymValue} minutes to goal`}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  const renderChart = (stepChartData: StepData[], gymChartData: StepData[]) => {
    // Combine data for dual tracking
    const combinedData = stepChartData.map((stepItem, index) => ({
      date: stepItem.date,
      steps: stepItem.steps,
      gymTime: gymChartData[index]?.steps || 0,
    }));

    return (
      <AnimatePresence mode="wait">
        <motion.div
          key={chartKey}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: isTransitioning ? 0.3 : 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
        >
          <ResponsiveContainer width="100%" height={350}>
            <BarChart
              data={combinedData}
              margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#e5e7eb"
              />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={{ stroke: "#e5e7eb" }}
              />
              <YAxis
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={{ stroke: "#e5e7eb" }}
              />
              <Tooltip content={<CustomTooltip />} />
              {(trackingMode === "steps" || trackingMode === "both") && (
                <Bar
                  dataKey="steps"
                  fill="#3b82f6"
                  radius={[4, 4, 0, 0]}
                  animationDuration={800}
                  animationEasing="ease-in-out"
                  name="Steps"
                />
              )}
              {(trackingMode === "location" || trackingMode === "both") && (
                <Bar
                  dataKey="gymTime"
                  fill="#10b981"
                  radius={[4, 4, 0, 0]}
                  animationDuration={800}
                  animationEasing="ease-in-out"
                  name="Gym Time"
                />
              )}
              {activeView === "daily" &&
                goal &&
                (trackingMode === "steps" || trackingMode === "both") && (
                  <ReferenceLine
                    y={goal}
                    stroke="#3b82f6"
                    strokeDasharray="3 3"
                    label={{
                      position: "right",
                      value: "Step Goal",
                      fill: "#3b82f6",
                      fontSize: 12,
                    }}
                  />
                )}
              {activeView === "daily" &&
                gymGoal &&
                (trackingMode === "location" || trackingMode === "both") && (
                  <ReferenceLine
                    y={gymGoal}
                    stroke="#10b981"
                    strokeDasharray="3 3"
                    label={{
                      position: "right",
                      value: "Gym Goal",
                      fill: "#10b981",
                      fontSize: 12,
                    }}
                  />
                )}
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </AnimatePresence>
    );
  };

  const getTitle = () => {
    if (trackingMode === "both") return "Activity History";
    if (trackingMode === "location") return "Gym History";
    return "Step History";
  };

  return (
    <Card className="w-full bg-white">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">{getTitle()}</CardTitle>
        <Tabs
          defaultValue="daily"
          value={activeView}
          onValueChange={handleViewChange}
          className="w-full"
        >
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger
              value="daily"
              disabled={isTransitioning}
              className="transition-all duration-200"
            >
              Daily
            </TabsTrigger>
            <TabsTrigger
              value="weekly"
              disabled={isTransitioning}
              className="transition-all duration-200"
            >
              Weekly
            </TabsTrigger>
            <TabsTrigger
              value="monthly"
              disabled={isTransitioning}
              className="transition-all duration-200"
            >
              Monthly
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent className="justify-center items-center relative">
        {isTransitioning && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        )}
        {(() => {
          const currentStepData =
            activeView === "daily"
              ? stepData.daily || []
              : activeView === "weekly"
                ? stepData.weekly || []
                : stepData.monthly || [];

          const currentGymData =
            activeView === "daily"
              ? gymData.daily || []
              : activeView === "weekly"
                ? gymData.weekly || []
                : gymData.monthly || [];

          return renderChart(currentStepData, currentGymData);
        })()}
      </CardContent>
    </Card>
  );
};

export default StepChart;
