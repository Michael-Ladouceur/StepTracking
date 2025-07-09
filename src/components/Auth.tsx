import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  AlertCircle,
  CheckCircle,
  Loader2,
} from "lucide-react";
import authService, {
  AuthState,
  SignUpData,
  SignInData,
} from "../services/authService";

interface AuthProps {
  onAuthSuccess?: () => void;
}

const Auth: React.FC<AuthProps> = ({ onAuthSuccess }) => {
  const [authState, setAuthState] = useState<AuthState>(
    authService.getAuthState(),
  );
  const [activeTab, setActiveTab] = useState("signin");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [resetEmailSent, setResetEmailSent] = useState(false);

  const [signInForm, setSignInForm] = useState<SignInData>({
    email: "",
    password: "",
  });

  const [signUpForm, setSignUpForm] = useState<
    SignUpData & { confirmPassword: string }
  >({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [resetEmail, setResetEmail] = useState("");

  useEffect(() => {
    const handleAuthStateChange = (state: AuthState) => {
      setAuthState(state);
      if (state.isAuthenticated && onAuthSuccess) {
        onAuthSuccess();
      }
    };

    authService.addListener(handleAuthStateChange);
    return () => authService.removeListener(handleAuthStateChange);
  }, [onAuthSuccess]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!signInForm.email || !signInForm.password) {
      setError("Please fill in all fields");
      return;
    }

    const result = await authService.signIn(signInForm);
    if (!result.success) {
      setError(result.error || "Sign in failed");
    } else {
      setSuccess("Successfully signed in!");
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (
      !signUpForm.name ||
      !signUpForm.email ||
      !signUpForm.password ||
      !signUpForm.confirmPassword
    ) {
      setError("Please fill in all fields");
      return;
    }

    if (signUpForm.password !== signUpForm.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (signUpForm.password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    const { confirmPassword, ...signUpData } = signUpForm;
    const result = await authService.signUp(signUpData);
    if (!result.success) {
      setError(result.error || "Sign up failed");
    } else {
      setSuccess("Account created successfully!");
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setSuccess(null);

    const result = await authService.signInWithGoogle();
    if (!result.success) {
      setError(result.error || "Google sign in failed");
    } else {
      setSuccess("Successfully signed in with Google!");
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!resetEmail) {
      setError("Please enter your email address");
      return;
    }

    const result = await authService.resetPassword(resetEmail);
    if (!result.success) {
      setError(result.error || "Password reset failed");
    } else {
      setResetEmailSent(true);
      setSuccess("Password reset email sent! Check your inbox.");
    }
  };

  if (authState.isAuthenticated) {
    return (
      <Card className="w-full max-w-md mx-auto bg-white">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl font-bold">Welcome Back!</CardTitle>
          <CardDescription>
            You are signed in as {authState.user?.name}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              Email: {authState.user?.email}
            </p>
            <p className="text-sm text-muted-foreground">
              Member since:{" "}
              {authState.user?.createdAt
                ? new Date(authState.user.createdAt).toLocaleDateString()
                : "N/A"}
            </p>
          </div>
          <Button
            onClick={() => authService.signOut()}
            variant="outline"
            className="w-full"
          >
            Sign Out
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto bg-white">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">FitLock</CardTitle>
        <CardDescription>
          Create an account or sign in to track your steps
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="signin">Sign In</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>

          <TabsContent value="signin" className="space-y-4 mt-6">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  {success}
                </AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signin-email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="signin-email"
                    type="email"
                    placeholder="Enter your email"
                    value={signInForm.email}
                    onChange={(e) =>
                      setSignInForm((prev) => ({
                        ...prev,
                        email: e.target.value,
                      }))
                    }
                    className="pl-10"
                    disabled={authState.loading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="signin-password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="signin-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={signInForm.password}
                    onChange={(e) =>
                      setSignInForm((prev) => ({
                        ...prev,
                        password: e.target.value,
                      }))
                    }
                    className="pl-10 pr-10"
                    disabled={authState.loading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={authState.loading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={authState.loading}
              >
                {authState.loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing In...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>

            <div className="text-center">
              <Button
                variant="link"
                className="text-sm"
                onClick={() => setActiveTab("reset")}
              >
                Forgot your password?
              </Button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or continue with
                </span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleGoogleSignIn}
              disabled={authState.loading}
            >
              {authState.loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
              )}
              Continue with Google
            </Button>
          </TabsContent>

          <TabsContent value="signup" className="space-y-4 mt-6">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  {success}
                </AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSignUp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signup-name">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="signup-name"
                    type="text"
                    placeholder="Enter your full name"
                    value={signUpForm.name}
                    onChange={(e) =>
                      setSignUpForm((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    className="pl-10"
                    disabled={authState.loading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="Enter your email"
                    value={signUpForm.email}
                    onChange={(e) =>
                      setSignUpForm((prev) => ({
                        ...prev,
                        email: e.target.value,
                      }))
                    }
                    className="pl-10"
                    disabled={authState.loading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="signup-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a password"
                    value={signUpForm.password}
                    onChange={(e) =>
                      setSignUpForm((prev) => ({
                        ...prev,
                        password: e.target.value,
                      }))
                    }
                    className="pl-10 pr-10"
                    disabled={authState.loading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={authState.loading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-confirm-password">
                  Confirm Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="signup-confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your password"
                    value={signUpForm.confirmPassword}
                    onChange={(e) =>
                      setSignUpForm((prev) => ({
                        ...prev,
                        confirmPassword: e.target.value,
                      }))
                    }
                    className="pl-10 pr-10"
                    disabled={authState.loading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={authState.loading}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={authState.loading}
              >
                {authState.loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  "Create Account"
                )}
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or continue with
                </span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleGoogleSignIn}
              disabled={authState.loading}
            >
              {authState.loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
              )}
              Sign up with Google
            </Button>
          </TabsContent>

          <TabsContent value="reset" className="space-y-4 mt-6">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  {success}
                </AlertDescription>
              </Alert>
            )}

            <div className="text-center space-y-2">
              <h3 className="text-lg font-medium">Reset Password</h3>
              <p className="text-sm text-muted-foreground">
                Enter your email address and we'll send you a link to reset your
                password.
              </p>
            </div>

            {!resetEmailSent ? (
              <form onSubmit={handlePasswordReset} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reset-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="reset-email"
                      type="email"
                      placeholder="Enter your email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      className="pl-10"
                      disabled={authState.loading}
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={authState.loading}
                >
                  {authState.loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    "Send Reset Link"
                  )}
                </Button>
              </form>
            ) : (
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <p className="text-sm text-muted-foreground">
                  If an account with that email exists, we've sent you a
                  password reset link.
                </p>
              </div>
            )}

            <div className="text-center">
              <Button
                variant="link"
                className="text-sm"
                onClick={() => {
                  setActiveTab("signin");
                  setResetEmailSent(false);
                  setResetEmail("");
                }}
              >
                Back to Sign In
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default Auth;
