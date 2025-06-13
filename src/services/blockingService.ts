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
  currentSteps: number;
  goalSteps: number;
  remainingSteps: number;
}

export interface BlockingSettings {
  enabled: boolean;
  strictMode: boolean;
  dailyGoal: number;
  blockedApps: string[];
  blockedWebsites: string[];
  allowedDomains: string[];
  blockingMessage: string;
}

class BlockingService {
  private settings: BlockingSettings;
  private currentSteps: number = 0;
  private isGoalAchieved: boolean = false;
  private listeners: Set<(status: BlockingStatus) => void> = new Set();
  private checkInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.settings = this.loadSettings();
    this.startMonitoring();
  }

  private loadSettings(): BlockingSettings {
    const saved = localStorage.getItem("stepTracker_blockingSettings");
    if (saved) {
      return JSON.parse(saved);
    }
    return {
      enabled: false,
      strictMode: false,
      dailyGoal: 10000,
      blockedApps: ["Social Media", "Games", "Video Streaming"],
      blockedWebsites: [
        "facebook.com",
        "twitter.com",
        "instagram.com",
        "youtube.com",
        "tiktok.com",
      ],
      allowedDomains: ["localhost", "127.0.0.1"],
      blockingMessage:
        "This site is blocked until you reach your daily step goal!",
    };
  }

  private saveSettings(): void {
    localStorage.setItem(
      "stepTracker_blockingSettings",
      JSON.stringify(this.settings),
    );
  }

  updateSettings(newSettings: Partial<BlockingSettings>): void {
    if (this.settings.strictMode && newSettings.enabled === false) {
      console.warn("Cannot disable blocking in strict mode");
      return;
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
    this.isGoalAchieved = steps >= this.settings.dailyGoal;
    this.notifyListeners();
  }

  shouldBlockWebsite(url: string): boolean {
    if (!this.settings.enabled || this.isGoalAchieved) {
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
    return {
      isBlocked: this.settings.enabled && !this.isGoalAchieved,
      reason: this.isGoalAchieved ? "Goal achieved" : "Step goal not reached",
      currentSteps: this.currentSteps,
      goalSteps: this.settings.dailyGoal,
      remainingSteps: Math.max(0, this.settings.dailyGoal - this.currentSteps),
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
      // In a real implementation, this would fetch from health apps
      // For now, we'll use stored step data or simulate
      const storedSteps = localStorage.getItem("stepTracker_currentSteps");
      if (storedSteps) {
        this.updateStepCount(parseInt(storedSteps, 10));
      }
    } catch (error) {
      console.error("Error checking step goal:", error);
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
