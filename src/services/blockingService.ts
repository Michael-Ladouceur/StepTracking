export interface BlockingRule {
  id: string;
  type: "app" | "website";
  name: string;
  pattern: string;
  enabled: boolean;
}

export interface BlockingStatus {
  isBlocked: boolean;
  reason: string;
  trackingMode: "steps" | "location" | "both";
  currentSteps: number;
  goalSteps: number;
  remainingSteps: number;
  currentGymTime: number;
  goalGymTime: number;
  remainingGymTime: number;
  stepGoalAchieved: boolean;
  gymGoalAchieved: boolean;
  strictModeTimeRemaining?: number;
}

export interface BlockingSettings {
  enabled: boolean;
  strictMode: boolean;
  strictModeActivatedAt?: number;
  trackingMode: "steps" | "location" | "both";
  dailyGoal: number;
  locationGoal: {
    gymName: string;
    latitude: number;
    longitude: number;
    radiusMeters: number;
    requiredMinutes: number;
  };
  blockedApps: string[];
  blockedWebsites: string[];
  allowedDomains: string[];
  blockingMessage: string;
}

class BlockingService {
  private settings: BlockingSettings;
  private currentSteps: number = 0;
  private currentGymTime: number = 0;
  private isStepGoalAchieved: boolean = false;
  private isGymGoalAchieved: boolean = false;
  private listeners: Set<(status: BlockingStatus) => void> = new Set();
  private checkInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.settings = this.loadSettings();
    this.startMonitoring();
  }

  private loadSettings(): BlockingSettings {
    const saved = localStorage.getItem("stepTracker_blockingSettings");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Ensure locationGoal has all required properties
        if (!parsed.locationGoal || typeof parsed.locationGoal !== "object") {
          parsed.locationGoal = {
            gymName: "My Gym",
            latitude: 0,
            longitude: 0,
            radiusMeters: 150, // Default to 150 meters
            requiredMinutes: 60,
          };
        } else {
          // Fill in missing properties with defaults
          parsed.locationGoal = {
            gymName: parsed.locationGoal.gymName || "My Gym",
            latitude: parsed.locationGoal.latitude || 0,
            longitude: parsed.locationGoal.longitude || 0,
            radiusMeters: parsed.locationGoal.radiusMeters || 150, // Default to 150 meters
            requiredMinutes: parsed.locationGoal.requiredMinutes || 60,
          };
        }
        // TESTING: Disable strict mode temporarily
        parsed.strictMode = false;
        parsed.strictModeActivatedAt = undefined;
        return parsed;
      } catch (error) {
        console.error("Error parsing saved settings:", error);
      }
    }
    return {
      enabled: false,
      strictMode: false, // TESTING: Disabled for testing
      strictModeActivatedAt: undefined,
      trackingMode: "steps" as const,
      dailyGoal: 10000,
      locationGoal: {
        gymName: "My Gym",
        latitude: 0,
        longitude: 0,
        radiusMeters: 150, // Default to 150 meters
        requiredMinutes: 60,
      },
      blockedApps: ["Social Media", "Games", "Video Streaming"],
      blockedWebsites: [
        "facebook.com",
        "twitter.com",
        "instagram.com",
        "youtube.com",
        "tiktok.com",
      ],
      allowedDomains: ["localhost", "127.0.0.1"],
      blockingMessage: "This site is blocked until you reach your daily goal!",
    };
  }

  private saveSettings(): void {
    localStorage.setItem(
      "stepTracker_blockingSettings",
      JSON.stringify(this.settings),
    );
  }

  updateSettings(newSettings: Partial<BlockingSettings>): void {
    // TESTING: Strict mode disabled - allow all changes
    // Check if strict mode is locked (3 weeks = 21 days)
    // const strictModeLockDuration = 21 * 24 * 60 * 60 * 1000; // 21 days in milliseconds
    // const now = Date.now();

    // if (this.settings.strictMode && this.settings.strictModeActivatedAt) {
    //   const timeElapsed = now - this.settings.strictModeActivatedAt;
    //   if (timeElapsed < strictModeLockDuration) {
    //     if (
    //       newSettings.strictMode === false ||
    //       newSettings.dailyGoal !== undefined ||
    //       (newSettings.locationGoal &&
    //         newSettings.locationGoal.requiredMinutes !==
    //           this.settings.locationGoal.requiredMinutes)
    //     ) {
    //       console.warn(
    //         "Cannot modify goal settings while strict mode is locked",
    //       );
    //       return;
    //     }
    //   }
    // }

    // TESTING: Force strict mode to false
    if (newSettings.strictMode === true) {
      console.log("TESTING: Strict mode is disabled for testing purposes");
      newSettings.strictMode = false;
    }

    // If enabling strict mode, record the timestamp
    // if (newSettings.strictMode === true && !this.settings.strictMode) {
    //   newSettings.strictModeActivatedAt = now;
    // }

    // If disabling strict mode after lock period, clear the timestamp
    if (newSettings.strictMode === false) {
      newSettings.strictModeActivatedAt = undefined;
    }

    // Ensure detection radius is always 150m
    if (newSettings.locationGoal) {
      newSettings.locationGoal.radiusMeters = 150;
    }

    this.settings = { ...this.settings, ...newSettings };
    this.saveSettings();
    this.notifyListeners();
  }

  getSettings(): BlockingSettings {
    return { ...this.settings };
  }

  updateStepCount(steps: number): void {
    this.currentSteps = steps;
    this.updateGoalStatus();
    this.notifyListeners();
  }

  updateGymTime(minutes: number): void {
    this.currentGymTime = minutes;
    this.updateGoalStatus();
    this.notifyListeners();
  }

  private updateGoalStatus(): void {
    this.isStepGoalAchieved = this.currentSteps >= this.settings.dailyGoal;
    this.isGymGoalAchieved =
      this.currentGymTime >=
      (this.settings.locationGoal?.requiredMinutes || 60);
  }

  shouldBlockWebsite(url: string): boolean {
    if (!this.settings.enabled) {
      return false;
    }

    // Check if goals are achieved based on tracking mode
    let goalsAchieved = false;
    if (this.settings.trackingMode === "steps") {
      goalsAchieved = this.isStepGoalAchieved;
    } else if (this.settings.trackingMode === "location") {
      goalsAchieved = this.isGymGoalAchieved;
    } else if (this.settings.trackingMode === "both") {
      goalsAchieved = this.isStepGoalAchieved && this.isGymGoalAchieved;
    }

    if (goalsAchieved) {
      return false;
    }

    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname.toLowerCase();

      // Check if it's an allowed domain
      if (
        this.settings.allowedDomains.some((domain) => hostname.includes(domain))
      ) {
        return false;
      }

      // Check if it matches any blocked website pattern
      return this.settings.blockedWebsites.some((pattern) => {
        const normalizedPattern = pattern
          .toLowerCase()
          .replace(/^https?:\/\//, "")
          .replace(/^www\./, "");
        const normalizedHostname = hostname.replace(/^www\./, "");
        return (
          normalizedHostname.includes(normalizedPattern) ||
          normalizedPattern.includes(normalizedHostname)
        );
      });
    } catch (error) {
      console.error("Error parsing URL:", error);
      return false;
    }
  }

  getBlockingStatus(): BlockingStatus {
    let goalsAchieved = false;
    let reason = "";

    if (this.settings.trackingMode === "steps") {
      goalsAchieved = this.isStepGoalAchieved;
      reason = goalsAchieved ? "Step goal achieved" : "Step goal not reached";
    } else if (this.settings.trackingMode === "location") {
      goalsAchieved = this.isGymGoalAchieved;
      reason = goalsAchieved
        ? "Gym goal achieved"
        : "Gym time goal not reached";
    } else if (this.settings.trackingMode === "both") {
      goalsAchieved = this.isStepGoalAchieved && this.isGymGoalAchieved;
      if (goalsAchieved) {
        reason = "Both goals achieved";
      } else if (!this.isStepGoalAchieved && !this.isGymGoalAchieved) {
        reason = "Both step and gym goals not reached";
      } else if (!this.isStepGoalAchieved) {
        reason = "Step goal not reached";
      } else {
        reason = "Gym goal not reached";
      }
    }

    // Calculate strict mode time remaining
    let strictModeTimeRemaining: number | undefined;
    if (this.settings.strictMode && this.settings.strictModeActivatedAt) {
      const strictModeLockDuration = 21 * 24 * 60 * 60 * 1000; // 21 days
      const timeElapsed = Date.now() - this.settings.strictModeActivatedAt;
      strictModeTimeRemaining = Math.max(
        0,
        strictModeLockDuration - timeElapsed,
      );
    }

    return {
      isBlocked: this.settings.enabled && !goalsAchieved,
      reason,
      trackingMode: this.settings.trackingMode,
      currentSteps: this.currentSteps,
      goalSteps: this.settings.dailyGoal,
      remainingSteps: Math.max(0, this.settings.dailyGoal - this.currentSteps),
      currentGymTime: this.currentGymTime,
      goalGymTime: this.settings.locationGoal?.requiredMinutes || 60,
      remainingGymTime: Math.max(
        0,
        (this.settings.locationGoal?.requiredMinutes || 60) -
          this.currentGymTime,
      ),
      stepGoalAchieved: this.isStepGoalAchieved,
      gymGoalAchieved: this.isGymGoalAchieved,
      strictModeTimeRemaining,
    };
  }

  addListener(callback: (status: BlockingStatus) => void): void {
    this.listeners.add(callback);
  }

  removeListener(callback: (status: BlockingStatus) => void): void {
    this.listeners.delete(callback);
  }

  private notifyListeners(): void {
    const status = this.getBlockingStatus();
    this.listeners.forEach((callback) => callback(status));
  }

  private startMonitoring(): void {
    // Check step count every 5 minutes
    this.checkInterval = setInterval(
      () => {
        this.checkStepGoal();
      },
      5 * 60 * 1000,
    );

    // Initial check
    this.checkStepGoal();
  }

  private async checkStepGoal(): Promise<void> {
    try {
      const storedSteps = localStorage.getItem("stepTracker_currentSteps");
      if (storedSteps) {
        this.updateStepCount(parseInt(storedSteps, 10));
      }

      const storedGymTime = localStorage.getItem("stepTracker_gymTime");
      if (storedGymTime) {
        this.updateGymTime(parseInt(storedGymTime, 10));
      }
    } catch (error) {
      console.error("Error checking goals:", error);
    }
  }

  destroy(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }
    this.listeners.clear();
  }
}

export const blockingService = new BlockingService();
export default blockingService;
