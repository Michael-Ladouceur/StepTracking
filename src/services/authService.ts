export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  createdAt: string;
  lastLogin: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
}

export interface SignUpData {
  email: string;
  password: string;
  name: string;
}

export interface SignInData {
  email: string;
  password: string;
}

class AuthService {
  private authState: AuthState = {
    isAuthenticated: false,
    user: null,
    loading: false,
  };
  private listeners: Set<(state: AuthState) => void> = new Set();

  constructor() {
    this.loadAuthState();
  }

  private loadAuthState(): void {
    const saved = localStorage.getItem("stepTracker_authState");
    if (saved) {
      try {
        const parsedState = JSON.parse(saved);
        this.authState = { ...this.authState, ...parsedState, loading: false };
      } catch (error) {
        console.error("Error loading auth state:", error);
      }
    }
  }

  private saveAuthState(): void {
    localStorage.setItem(
      "stepTracker_authState",
      JSON.stringify({
        isAuthenticated: this.authState.isAuthenticated,
        user: this.authState.user,
      }),
    );
  }

  private notifyListeners(): void {
    this.listeners.forEach((callback) => callback(this.authState));
  }

  getAuthState(): AuthState {
    return { ...this.authState };
  }

  addListener(callback: (state: AuthState) => void): void {
    this.listeners.add(callback);
  }

  removeListener(callback: (state: AuthState) => void): void {
    this.listeners.delete(callback);
  }

  async signUp(
    data: SignUpData,
  ): Promise<{ success: boolean; error?: string }> {
    this.authState.loading = true;
    this.notifyListeners();

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Check if email already exists (simulate)
      const existingUsers = JSON.parse(
        localStorage.getItem("stepTracker_users") || "[]",
      );
      if (existingUsers.find((user: any) => user.email === data.email)) {
        throw new Error("Email already exists");
      }

      // Create new user
      const newUser: User = {
        id: Date.now().toString(),
        email: data.email,
        name: data.name,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
      };

      // Save user to localStorage (simulate database)
      existingUsers.push({ ...newUser, password: data.password });
      localStorage.setItem("stepTracker_users", JSON.stringify(existingUsers));

      // Update auth state
      this.authState = {
        isAuthenticated: true,
        user: newUser,
        loading: false,
      };

      this.saveAuthState();
      this.notifyListeners();

      return { success: true };
    } catch (error) {
      this.authState.loading = false;
      this.notifyListeners();
      return {
        success: false,
        error: error instanceof Error ? error.message : "Sign up failed",
      };
    }
  }

  async signIn(
    data: SignInData,
  ): Promise<{ success: boolean; error?: string }> {
    this.authState.loading = true;
    this.notifyListeners();

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Find user (simulate)
      const existingUsers = JSON.parse(
        localStorage.getItem("stepTracker_users") || "[]",
      );
      const user = existingUsers.find(
        (u: any) => u.email === data.email && u.password === data.password,
      );

      if (!user) {
        throw new Error("Invalid email or password");
      }

      // Update last login
      user.lastLogin = new Date().toISOString();
      localStorage.setItem("stepTracker_users", JSON.stringify(existingUsers));

      // Update auth state
      const { password, ...userWithoutPassword } = user;
      this.authState = {
        isAuthenticated: true,
        user: userWithoutPassword,
        loading: false,
      };

      this.saveAuthState();
      this.notifyListeners();

      return { success: true };
    } catch (error) {
      this.authState.loading = false;
      this.notifyListeners();
      return {
        success: false,
        error: error instanceof Error ? error.message : "Sign in failed",
      };
    }
  }

  async signInWithGoogle(): Promise<{ success: boolean; error?: string }> {
    this.authState.loading = true;
    this.notifyListeners();

    try {
      // Simulate Google OAuth flow
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Simulate Google user data
      const googleUser: User = {
        id: `google_${Date.now()}`,
        email: "user@gmail.com",
        name: "Google User",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=google",
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
      };

      // Save to localStorage
      const existingUsers = JSON.parse(
        localStorage.getItem("stepTracker_users") || "[]",
      );
      const existingUser = existingUsers.find(
        (u: any) => u.email === googleUser.email,
      );

      if (!existingUser) {
        existingUsers.push({ ...googleUser, provider: "google" });
        localStorage.setItem(
          "stepTracker_users",
          JSON.stringify(existingUsers),
        );
      }

      this.authState = {
        isAuthenticated: true,
        user: googleUser,
        loading: false,
      };

      this.saveAuthState();
      this.notifyListeners();

      return { success: true };
    } catch (error) {
      this.authState.loading = false;
      this.notifyListeners();
      return {
        success: false,
        error: error instanceof Error ? error.message : "Google sign in failed",
      };
    }
  }

  async signOut(): Promise<void> {
    this.authState = {
      isAuthenticated: false,
      user: null,
      loading: false,
    };

    localStorage.removeItem("stepTracker_authState");
    this.notifyListeners();
  }

  async resetPassword(
    email: string,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const existingUsers = JSON.parse(
        localStorage.getItem("stepTracker_users") || "[]",
      );
      const user = existingUsers.find((u: any) => u.email === email);

      if (!user) {
        throw new Error("Email not found");
      }

      // In a real app, this would send a reset email
      console.log(`Password reset email sent to ${email}`);

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Reset failed",
      };
    }
  }
}

export const authService = new AuthService();
export default authService;
