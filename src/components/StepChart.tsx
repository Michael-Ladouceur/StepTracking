import React, { useState } from "react";
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

interface StepData {
  date: string;
  steps: number;
}

interface StepChartProps {
  dailyData?: StepData[];
  weeklyData?: StepData[];
  monthlyData?: StepData[];
  goal?: number;
}

const StepChart = ({
  dailyData = [
    { date: "Mon", steps: 8432 },
    { date: "Tue", steps: 7621 },
    { date: "Wed", steps: 9214 },
    { date: "Thu", steps: 6532 },
    { date: "Fri", steps: 8945 },
    { date: "Sat", steps: 11023 },
    { date: "Sun", steps: 7652 },
  ],
  weeklyData = [
    { date: "Week 1", steps: 52341 },
    { date: "Week 2", steps: 48762 },
    { date: "Week 3", steps: 61234 },
    { date: "Week 4", steps: 57890 },
  ],
  monthlyData = [
    { date: "Jan", steps: 231456 },
    { date: "Feb", steps: 198732 },
    { date: "Mar", steps: 245678 },
    { date: "Apr", steps: 213567 },
    { date: "May", steps: 267890 },
    { date: "Jun", steps: 243219 },
  ],
  goal = 10000,
}: StepChartProps) => {
  const [activeView, setActiveView] = useState("daily");

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border rounded-md p-3 shadow-md">
          <p className="font-medium">{`${label}`}</p>
          <p className="text-primary">{`${payload[0].value.toLocaleString()} steps`}</p>
          {goal && (
            <p className="text-xs text-muted-foreground">
              {payload[0].value >= goal
                ? `Goal achieved! +${(payload[0].value - goal).toLocaleString()}`
                : `${(goal - payload[0].value).toLocaleString()} steps to goal`}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  const renderChart = (data: StepData[], yAxisLabel: string) => (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart
        data={data}
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
          label={{
            value: yAxisLabel,
            angle: -90,
            position: "insideLeft",
            style: { textAnchor: "middle", fontSize: 12, fill: "#6b7280" },
          }}
          tick={{ fontSize: 12 }}
          tickLine={false}
          axisLine={{ stroke: "#e5e7eb" }}
        />
        <Tooltip content={<CustomTooltip />} />
        <Bar
          dataKey="steps"
          fill="#3b82f6"
          radius={[4, 4, 0, 0]}
          animationDuration={1500}
        />
        {activeView === "daily" && (
          <ReferenceLine
            y={goal}
            stroke="#10b981"
            strokeDasharray="3 3"
            label={{
              position: "right",
              value: "Goal",
              fill: "#10b981",
              fontSize: 12,
            }}
          />
        )}
      </BarChart>
    </ResponsiveContainer>
  );

  return (
    <Card className="w-full bg-white">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">Step History</CardTitle>
        <Tabs
          defaultValue="daily"
          value={activeView}
          onValueChange={setActiveView}
          className="w-full"
        >
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="daily">Daily</TabsTrigger>
            <TabsTrigger value="weekly">Weekly</TabsTrigger>
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent>
        {activeView === "daily" && renderChart(dailyData, "Steps")}
        {activeView === "weekly" && renderChart(weeklyData, "Weekly Steps")}
        {activeView === "monthly" && renderChart(monthlyData, "Monthly Steps")}
      </CardContent>
    </Card>
  );
};

export default StepChart;
