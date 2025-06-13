export interface HealthAppConnection {
  id: string;
  name: string;
  type: "apple_health" | "google_fit" | "fitbit" | "samsung_health" | "garmin";
  connected: boolean;
  lastSync?: string;
  icon: string;
}

export interface StepData {
  date: string;
  steps: number;
  source: string;
}

export interface HealthAppCredentials {
  clientId?: string;
  clientSecret?: string;
  accessToken?: string;
  refreshToken?: string;
}

class HealthAppService {
  private connections: Map<string, HealthAppConnection> = new Map();
  private credentials: Map<string, HealthAppCredentials> = new Map();

  // Available health app integrations
  getAvailableApps(): HealthAppConnection[] {
    return [
      {
        id: "apple_health",
        name: "Apple Health",
        type: "apple_health",
        connected: false,
        icon: "🍎",
      },
      {
        id: "google_fit",
        name: "Google Fit",
        type: "google_fit",
        connected: false,
        icon: "🏃",
      },
      {
        id: "fitbit",
        name: "Fitbit",
        type: "fitbit",
        connected: false,
        icon: "⌚",
      },
      {
        id: "samsung_health",
        name: "Samsung Health",
        type: "samsung_health",
        connected: false,
        icon: "📱",
      },
      {
        id: "garmin",
        name: "Garmin Connect",
        type: "garmin",
        connected: false,
        icon: "⌚",
      },
    ];
  }

  // Get connected apps
  getConnectedApps(): HealthAppConnection[] {
    return Array.from(this.connections.values()).filter((app) => app.connected);
  }

  // Connect to a health app
  async connectApp(
    appId: string,
    credentials?: HealthAppCredentials,
  ): Promise<boolean> {
    try {
      const app = this.getAvailableApps().find((a) => a.id === appId);
      if (!app) throw new Error("App not found");

      // Simulate connection process
      await this.simulateConnection(app.type, credentials);

      const connectedApp: HealthAppConnection = {
        ...app,
        connected: true,
        lastSync: new Date().toISOString(),
      };

      this.connections.set(appId, connectedApp);

      if (credentials) {
        this.credentials.set(appId, credentials);
      }

      return true;
    } catch (error) {
      console.error("Failed to connect to health app:", error);
      return false;
    }
  }

  // Disconnect from a health app
  async disconnectApp(appId: string): Promise<boolean> {
    try {
      const app = this.connections.get(appId);
      if (app) {
        app.connected = false;
        this.connections.delete(appId);
        this.credentials.delete(appId);
      }
      return true;
    } catch (error) {
      console.error("Failed to disconnect from health app:", error);
      return false;
    }
  }

  // Fetch step data from connected apps
  async fetchStepData(dateRange: {
    start: Date;
    end: Date;
  }): Promise<StepData[]> {
    const connectedApps = this.getConnectedApps();
    const allStepData: StepData[] = [];

    for (const app of connectedApps) {
      try {
        const data = await this.fetchFromApp(app, dateRange);
        allStepData.push(...data);
      } catch (error) {
        console.error(`Failed to fetch data from ${app.name}:`, error);
      }
    }

    // Merge and deduplicate data by date, preferring the highest step count
    const mergedData = this.mergeStepData(allStepData);
    return mergedData;
  }

  // Get today's step count
  async getTodaySteps(): Promise<number> {
    const today = new Date();
    const startOfDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
    );
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000 - 1);

    const stepData = await this.fetchStepData({
      start: startOfDay,
      end: endOfDay,
    });
    return stepData.reduce((total, data) => total + data.steps, 0);
  }

  // Sync data from all connected apps
  async syncAllApps(): Promise<void> {
    const connectedApps = this.getConnectedApps();

    for (const app of connectedApps) {
      try {
        await this.syncApp(app.id);
      } catch (error) {
        console.error(`Failed to sync ${app.name}:`, error);
      }
    }
  }

  // Sync specific app
  async syncApp(appId: string): Promise<void> {
    const app = this.connections.get(appId);
    if (!app || !app.connected) return;

    // Update last sync time
    app.lastSync = new Date().toISOString();
    this.connections.set(appId, app);
  }

  // Private methods
  private async simulateConnection(
    type: string,
    credentials?: HealthAppCredentials,
  ): Promise<void> {
    // Simulate API connection delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // In a real implementation, this would handle OAuth flows or API key validation
    switch (type) {
      case "apple_health":
        // Apple Health uses HealthKit on iOS
        if (typeof window !== "undefined" && "DeviceMotionEvent" in window) {
          // Check if we're on a device that supports motion events
          return;
        }
        break;
      case "google_fit":
        // Google Fit requires OAuth 2.0
        if (credentials?.clientId) {
          return;
        }
        break;
      case "fitbit":
        // Fitbit requires OAuth 2.0
        if (credentials?.clientId) {
          return;
        }
        break;
      default:
        return;
    }
  }

  private async fetchFromApp(
    app: HealthAppConnection,
    dateRange: { start: Date; end: Date },
  ): Promise<StepData[]> {
    // Simulate fetching data from different health apps
    const days = Math.ceil(
      (dateRange.end.getTime() - dateRange.start.getTime()) /
        (1000 * 60 * 60 * 24),
    );
    const data: StepData[] = [];

    for (let i = 0; i < days; i++) {
      const date = new Date(
        dateRange.start.getTime() + i * 24 * 60 * 60 * 1000,
      );
      const steps = Math.floor(Math.random() * 5000) + 5000; // Simulate 5000-10000 steps

      data.push({
        date: date.toISOString().split("T")[0],
        steps,
        source: app.name,
      });
    }

    return data;
  }

  private mergeStepData(data: StepData[]): StepData[] {
    const merged = new Map<string, StepData>();

    data.forEach((item) => {
      const existing = merged.get(item.date);
      if (!existing || item.steps > existing.steps) {
        merged.set(item.date, item);
      }
    });

    return Array.from(merged.values()).sort((a, b) =>
      a.date.localeCompare(b.date),
    );
  }
}

export const healthAppService = new HealthAppService();
export default healthAppService;
