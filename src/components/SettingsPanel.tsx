import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  ChevronDown,
  ChevronUp,
  Clock,
  Target,
  Bell,
  Lock,
  Plus,
  X,
  Smartphone,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Shield,
  ShieldCheck,
} from "lucide-react";
import blockingService, { BlockingStatus } from "../services/blockingService";

interface SettingsPanelProps {
  isOpen?: boolean;
  onSave?: (settings: SettingsData) => void;
}

interface SettingsData {
  dailyStepGoal: number;
  enableReminders: boolean;
  reminderFrequency: string;
  activeHoursStart: string;
  activeHoursEnd: string;
  enableAppBlocking: boolean;
  appsToBlock: string[];
  websitesToBlock: string[];
  strictMode: boolean;
  healthAppIntegration: {
    enabled: boolean;
    connectedApps: string[];
    autoSync: boolean;
    syncFrequency: string;
  };
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({
  isOpen = true,
  onSave = () => {},
}) => {
  const [isExpanded, setIsExpanded] = useState(isOpen);
  const [blockingStatus, setBlockingStatus] = useState<BlockingStatus | null>(
    null,
  );
  const [settings, setSettings] = useState<SettingsData>({
    dailyStepGoal: 10000,
    enableReminders: true,
    reminderFrequency: "60",
    activeHoursStart: "09:00",
    activeHoursEnd: "17:00",
    enableAppBlocking: false,
    appsToBlock: ["Social Media", "Games", "Video Streaming"],
    websitesToBlock: ["facebook.com", "twitter.com", "instagram.com"],
    strictMode: false,
    healthAppIntegration: {
      enabled: false,
      connectedApps: [],
      autoSync: true,
      syncFrequency: "15",
    },
  });

  useEffect(() => {
    // Load blocking service settings
    const blockingSettings = blockingService.getSettings();
    setSettings((prev) => ({
      ...prev,
      dailyStepGoal: blockingSettings.dailyGoal,
      enableAppBlocking: blockingSettings.enabled,
      strictMode: blockingSettings.strictMode,
      appsToBlock: blockingSettings.blockedApps,
      websitesToBlock: blockingSettings.blockedWebsites,
    }));

    // Listen for blocking status updates
    const handleStatusUpdate = (status: BlockingStatus) => {
      setBlockingStatus(status);
    };

    blockingService.addListener(handleStatusUpdate);
    setBlockingStatus(blockingService.getBlockingStatus());

    return () => {
      blockingService.removeListener(handleStatusUpdate);
    };
  }, []);
  const [isConnecting, setIsConnecting] = useState<string | null>(null);
  const [availableApps] = useState([
    { id: "apple_health", name: "Apple Health", icon: "🍎", connected: false },
    { id: "google_fit", name: "Google Fit", icon: "🏃", connected: false },
    { id: "fitbit", name: "Fitbit", icon: "⌚", connected: false },
    {
      id: "samsung_health",
      name: "Samsung Health",
      icon: "📱",
      connected: false,
    },
    { id: "garmin", name: "Garmin Connect", icon: "⌚", connected: false },
  ]);

  const handleSave = () => {
    // Update blocking service settings
    blockingService.updateSettings({
      enabled: settings.enableAppBlocking,
      strictMode: settings.strictMode,
      dailyGoal: settings.dailyStepGoal,
      blockedApps: settings.appsToBlock,
      blockedWebsites: settings.websitesToBlock,
    });

    onSave(settings);
  };

  const updateSettings = (key: keyof SettingsData, value: any) => {
    setSettings((prev) => ({ ...prev, [key]: value }));

    // Update blocking service immediately for critical settings
    if (key === "enableAppBlocking") {
      blockingService.updateSettings({ enabled: value });
    } else if (key === "strictMode") {
      blockingService.updateSettings({ strictMode: value });
    } else if (key === "dailyStepGoal") {
      blockingService.updateSettings({ dailyGoal: value });
    }
  };

  const testBlocking = () => {
    // Open a blocked website in a new tab to test the blocking functionality
    const testUrl = "https://facebook.com";
    window.open(testUrl, "_blank");
  };

  const handleHealthAppConnect = async (appId: string) => {
    setIsConnecting(appId);

    // Simulate connection process
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const updatedApps = [...settings.healthAppIntegration.connectedApps];
    if (!updatedApps.includes(appId)) {
      updatedApps.push(appId);
    }

    updateSettings("healthAppIntegration", {
      ...settings.healthAppIntegration,
      connectedApps: updatedApps,
      enabled: true,
    });

    setIsConnecting(null);
  };

  const handleHealthAppDisconnect = (appId: string) => {
    const updatedApps = settings.healthAppIntegration.connectedApps.filter(
      (id) => id !== appId,
    );
    updateSettings("healthAppIntegration", {
      ...settings.healthAppIntegration,
      connectedApps: updatedApps,
      enabled: updatedApps.length > 0,
    });
  };

  const isAppConnected = (appId: string) => {
    return settings.healthAppIntegration.connectedApps.includes(appId);
  };

  return (
    <Card className="w-full max-w-md bg-white shadow-md">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold">Settings</CardTitle>
          <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="w-9 p-0">
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
                <span className="sr-only">{isExpanded ? "Close" : "Open"}</span>
              </Button>
            </CollapsibleTrigger>
          </Collapsible>
        </div>
        <CardDescription>
          Configure your step goals and reminders
        </CardDescription>
      </CardHeader>

      <Collapsible open={isExpanded}>
        <CollapsibleContent>
          <CardContent className="pt-4 space-y-6">
            {/* Step Goal Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-medium">Daily Step Goal</h3>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="step-goal">Target Steps</Label>
                  <span className="text-sm font-medium">
                    {settings.dailyStepGoal.toLocaleString()}
                  </span>
                </div>
                <Slider
                  id="step-goal"
                  min={1000}
                  max={30000}
                  step={500}
                  value={[settings.dailyStepGoal]}
                  onValueChange={(value) =>
                    updateSettings("dailyStepGoal", value[0])
                  }
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>1,000</span>
                  <span>30,000</span>
                </div>
              </div>
            </div>

            {/* Reminders Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-medium">Movement Reminders</h3>
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="reminder-toggle">Enable Reminders</Label>
                <Switch
                  id="reminder-toggle"
                  checked={settings.enableReminders}
                  onCheckedChange={(checked) =>
                    updateSettings("enableReminders", checked)
                  }
                />
              </div>

              {settings.enableReminders && (
                <div className="space-y-4 pl-2 border-l-2 border-muted">
                  <div className="space-y-2">
                    <Label htmlFor="reminder-frequency">
                      Reminder Frequency
                    </Label>
                    <Select
                      value={settings.reminderFrequency}
                      onValueChange={(value) =>
                        updateSettings("reminderFrequency", value)
                      }
                    >
                      <SelectTrigger id="reminder-frequency">
                        <SelectValue placeholder="Select frequency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="30">Every 30 minutes</SelectItem>
                        <SelectItem value="60">Every hour</SelectItem>
                        <SelectItem value="90">Every 1.5 hours</SelectItem>
                        <SelectItem value="120">Every 2 hours</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <Label>Active Hours</Label>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label htmlFor="hours-start" className="text-xs">
                          Start
                        </Label>
                        <Input
                          id="hours-start"
                          type="time"
                          value={settings.activeHoursStart}
                          onChange={(e) =>
                            updateSettings("activeHoursStart", e.target.value)
                          }
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="hours-end" className="text-xs">
                          End
                        </Label>
                        <Input
                          id="hours-end"
                          type="time"
                          value={settings.activeHoursEnd}
                          onChange={(e) =>
                            updateSettings("activeHoursEnd", e.target.value)
                          }
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            {/* Health App Integration Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Smartphone className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-medium">Health App Integration</h3>
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="health-integration-toggle">
                  Enable Health App Integration
                </Label>
                <Switch
                  id="health-integration-toggle"
                  checked={settings.healthAppIntegration.enabled}
                  onCheckedChange={(checked) =>
                    updateSettings("healthAppIntegration", {
                      ...settings.healthAppIntegration,
                      enabled: checked,
                    })
                  }
                />
              </div>

              {settings.healthAppIntegration.enabled && (
                <div className="space-y-4 pl-2 border-l-2 border-muted">
                  <div className="space-y-3">
                    <Label>Available Health Apps</Label>
                    <div className="space-y-2">
                      {availableApps.map((app) => {
                        const connected = isAppConnected(app.id);
                        const connecting = isConnecting === app.id;

                        return (
                          <div
                            key={app.id}
                            className="flex items-center justify-between p-3 border rounded-lg bg-muted/20"
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-lg">{app.icon}</span>
                              <div>
                                <span className="font-medium">{app.name}</span>
                                {connected && (
                                  <div className="flex items-center gap-1 mt-1">
                                    <CheckCircle className="h-3 w-3 text-green-500" />
                                    <span className="text-xs text-green-600">
                                      Connected
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {connecting && (
                                <RefreshCw className="h-4 w-4 animate-spin text-primary" />
                              )}
                              {connected ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    handleHealthAppDisconnect(app.id)
                                  }
                                  disabled={connecting}
                                >
                                  Disconnect
                                </Button>
                              ) : (
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={() => handleHealthAppConnect(app.id)}
                                  disabled={connecting}
                                >
                                  {connecting ? "Connecting..." : "Connect"}
                                </Button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {settings.healthAppIntegration.connectedApps.length > 0 && (
                    <>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="auto-sync-toggle">Auto Sync</Label>
                        <Switch
                          id="auto-sync-toggle"
                          checked={settings.healthAppIntegration.autoSync}
                          onCheckedChange={(checked) =>
                            updateSettings("healthAppIntegration", {
                              ...settings.healthAppIntegration,
                              autoSync: checked,
                            })
                          }
                        />
                      </div>

                      {settings.healthAppIntegration.autoSync && (
                        <div className="space-y-2">
                          <Label htmlFor="sync-frequency">Sync Frequency</Label>
                          <Select
                            value={settings.healthAppIntegration.syncFrequency}
                            onValueChange={(value) =>
                              updateSettings("healthAppIntegration", {
                                ...settings.healthAppIntegration,
                                syncFrequency: value,
                              })
                            }
                          >
                            <SelectTrigger id="sync-frequency">
                              <SelectValue placeholder="Select frequency" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="5">Every 5 minutes</SelectItem>
                              <SelectItem value="15">
                                Every 15 minutes
                              </SelectItem>
                              <SelectItem value="30">
                                Every 30 minutes
                              </SelectItem>
                              <SelectItem value="60">Every hour</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="h-4 w-4 text-blue-600" />
                          <span className="text-sm font-medium text-blue-800">
                            Integration Active
                          </span>
                        </div>
                        <p className="text-xs text-blue-700 mt-1">
                          Step data will be automatically synced from your
                          connected health apps.
                        </p>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* App Blocking Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-medium">App & Website Blocking</h3>
              </div>

              {blockingStatus && (
                <div
                  className={`p-3 rounded-lg border ${
                    blockingStatus.isBlocked
                      ? "bg-red-50 border-red-200"
                      : "bg-green-50 border-green-200"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {blockingStatus.isBlocked ? (
                      <Shield className="h-4 w-4 text-red-600" />
                    ) : (
                      <ShieldCheck className="h-4 w-4 text-green-600" />
                    )}
                    <span
                      className={`text-sm font-medium ${
                        blockingStatus.isBlocked
                          ? "text-red-800"
                          : "text-green-800"
                      }`}
                    >
                      {blockingStatus.isBlocked
                        ? "Blocking Active"
                        : "Sites Unlocked"}
                    </span>
                  </div>
                  <p
                    className={`text-xs mt-1 ${
                      blockingStatus.isBlocked
                        ? "text-red-700"
                        : "text-green-700"
                    }`}
                  >
                    {blockingStatus.isBlocked
                      ? `${blockingStatus.remainingSteps.toLocaleString()} steps remaining to unlock`
                      : "Daily goal achieved! All sites are accessible."}
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between">
                <Label htmlFor="app-blocking-toggle">
                  Enable Website Blocking
                </Label>
                <Switch
                  id="app-blocking-toggle"
                  checked={settings.enableAppBlocking}
                  onCheckedChange={(checked) =>
                    updateSettings("enableAppBlocking", checked)
                  }
                  disabled={settings.strictMode}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="strict-mode-toggle">Strict Mode</Label>
                  <p className="text-xs text-muted-foreground">
                    Prevent changes to blocking settings once enabled
                  </p>
                </div>
                <Switch
                  id="strict-mode-toggle"
                  checked={settings.strictMode}
                  onCheckedChange={(checked) =>
                    updateSettings("strictMode", checked)
                  }
                />
              </div>

              {settings.enableAppBlocking && (
                <div className="space-y-4 pl-2 border-l-2 border-muted">
                  {settings.strictMode && (
                    <div className="bg-amber-50 border border-amber-200 rounded-md p-3">
                      <div className="flex items-center gap-2">
                        <Lock className="h-4 w-4 text-amber-600" />
                        <span className="text-sm font-medium text-amber-800">
                          Strict Mode Active
                        </span>
                      </div>
                      <p className="text-xs text-amber-700 mt-1">
                        App blocking settings are locked and cannot be modified.
                      </p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>Apps to Block</Label>
                    <div className="space-y-2">
                      {settings.appsToBlock.map((app, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between bg-muted/30 p-2 rounded-md"
                        >
                          <span>{app}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            disabled={settings.strictMode}
                            onClick={() => {
                              const newApps = [...settings.appsToBlock];
                              newApps.splice(index, 1);
                              updateSettings("appsToBlock", newApps);
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      <div className="flex gap-2 mt-2">
                        <Input
                          id="new-app"
                          placeholder="Add app to block"
                          className="flex-1"
                          disabled={settings.strictMode}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && e.currentTarget.value) {
                              updateSettings("appsToBlock", [
                                ...settings.appsToBlock,
                                e.currentTarget.value,
                              ]);
                              e.currentTarget.value = "";
                            }
                          }}
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          disabled={settings.strictMode}
                          onClick={() => {
                            const input = document.getElementById(
                              "new-app",
                            ) as HTMLInputElement;
                            if (input.value) {
                              updateSettings("appsToBlock", [
                                ...settings.appsToBlock,
                                input.value,
                              ]);
                              input.value = "";
                            }
                          }}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      These apps will be blocked until you reach your daily step
                      goal.
                    </p>
                  </div>

                  <div className="space-y-2 mt-4">
                    <Label>Websites to Block</Label>
                    <div className="space-y-2">
                      {settings.websitesToBlock.map((website, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between bg-muted/30 p-2 rounded-md"
                        >
                          <span>{website}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            disabled={settings.strictMode}
                            onClick={() => {
                              const newWebsites = [...settings.websitesToBlock];
                              newWebsites.splice(index, 1);
                              updateSettings("websitesToBlock", newWebsites);
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      <div className="flex gap-2 mt-2">
                        <Input
                          id="new-website"
                          placeholder="Add website to block (e.g., example.com)"
                          className="flex-1"
                          disabled={settings.strictMode}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && e.currentTarget.value) {
                              updateSettings("websitesToBlock", [
                                ...settings.websitesToBlock,
                                e.currentTarget.value,
                              ]);
                              e.currentTarget.value = "";
                            }
                          }}
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          disabled={settings.strictMode}
                          onClick={() => {
                            const input = document.getElementById(
                              "new-website",
                            ) as HTMLInputElement;
                            if (input.value) {
                              updateSettings("websitesToBlock", [
                                ...settings.websitesToBlock,
                                input.value,
                              ]);
                              input.value = "";
                            }
                          }}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      These websites will be blocked until you reach your daily
                      step goal.
                    </p>
                  </div>

                  {settings.enableAppBlocking && (
                    <div className="mt-4 pt-4 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={testBlocking}
                        className="w-full"
                      >
                        Test Blocking (Opens Facebook)
                      </Button>
                      <p className="text-xs text-muted-foreground mt-2 text-center">
                        Click to test if website blocking is working correctly
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>

          <CardFooter className="flex justify-end pt-2">
            <Button onClick={handleSave}>Save Settings</Button>
          </CardFooter>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};

export default SettingsPanel;
