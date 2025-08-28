// components/Login/LoginPage.tsx - Complete with Police Authentication
import { useState } from "react";
import React from "react";
import { useNavigate } from "react-router-dom";
import { usePoliceAuth } from "@/contexts/PoliceAuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ForgotPasswordModal } from "./ForgotPasswordModal";
import { useToast } from "@/hooks/use-toast";
import { AutoRefresh } from "@/components/ui/auto-refresh";

export const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { login, isAuthenticated } = usePoliceAuth();

  // Redirect if already authenticated

  // Simplified handleLogin function
  // In LoginPage.tsx - handleLogin function
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";

      const response = await fetch(`${apiUrl}/api/police/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Store tokens
        const storage = rememberMe ? localStorage : sessionStorage;
        storage.setItem("policeToken", data.token);
        storage.setItem(
          "police-dashboard-auth",
          JSON.stringify({
            token: data.token,
            police: data.police,
            officerId: data.police.id,
            loginTime: Date.now(),
          })
        );

        // Update context
        login(data.token, data.police);

        toast({
          title: "Login Successful",
          description: `Welcome back, ${data.police.name}!`,
        });

        // FORCE NAVIGATION - Try all these approaches
        console.log("About to navigate...");

        // Method 1: Direct navigation with replace
        navigate("/dashboard", { replace: true });

        // Method 2: If above doesn't work, try with setTimeout
        setTimeout(() => {
          console.log("Timeout navigation attempt");
          navigate("/dashboard", { replace: true });
        }, 100);

        // Method 3: As a last resort, use window.location
        setTimeout(() => {
          console.log("Window location fallback");
          window.location.href = "/dashboard";
        }, 500);
      } else {
        toast({
          title: "Login Failed",
          description: data.error || "Invalid credentials",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Login error:", error);
      toast({
        title: "Login Error",
        description: "Cannot connect to server",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Quick fill for testing
  const fillTestCredentials = (type: "admin" | "officer" | "inspector") => {
    const credentials = {
      admin: { email: "admin@police.gov.in", password: "admin123" },
      officer: { email: "officer@police.gov.in", password: "police123" },
      inspector: { email: "inspector@police.gov.in", password: "inspect123" },
    };

    setEmail(credentials[type].email);
    setPassword(credentials[type].password);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-accent/20 to-primary/10 p-4">
      <AutoRefresh />

      <div className="w-full max-w-md space-y-8">
        {/* Safe CheckIn Logo */}
        <div className="text-center">
          <img
            src="/lovable-uploads/9d9969a7-cbda-48a5-a664-db7cd40ca9fa.png"
            alt="Safe CheckIn"
            className="mx-auto h-16 w-auto mb-8"
          />
        </div>

        {/* Login Card */}
        <Card className="bg-gradient-card shadow-card border-0 rounded-2xl">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-bold text-primary">
              Police Dashboard
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Enter your credentials to access the dashboard
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="rounded-xl border-2 focus:border-primary"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="rounded-xl border-2 focus:border-primary"
                  required
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="remember"
                  checked={rememberMe}
                  onCheckedChange={(checked) =>
                    setRememberMe(checked as boolean)
                  }
                  className="rounded-md"
                />
                <Label htmlFor="remember" className="text-sm font-medium">
                  Remember Me
                </Label>
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-primary hover:opacity-90 text-primary-foreground font-semibold py-3 rounded-xl transition-all duration-300 hover:scale-105 shadow-glow"
                disabled={isLoading}
              >
                {isLoading ? "Logging in..." : "Login"}
              </Button>
            </form>
            <Button
              type="button"
              onClick={() => {
                console.log("Manual navigation test");
                navigate("/dashboard", { replace: true });
              }}
              className="w-full mt-2 bg-red-500 hover:bg-red-600"
            >
              DEBUG: Test Navigation
            </Button>
            <div className="text-center">
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="text-sm text-primary hover:text-primary-hover underline font-medium transition-colors"
              >
                Forgot Password?
              </button>
            </div>

            {/* Test Credentials Section */}
            <div className="mt-6 p-4 bg-muted/50 rounded-lg">
              <h4 className="text-sm font-semibold text-foreground mb-3">
                Test Credentials (Development):
              </h4>

              {/* Quick Fill Buttons */}
              <div className="grid grid-cols-3 gap-2 mb-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fillTestCredentials("admin")}
                  className="text-xs"
                >
                  Admin
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fillTestCredentials("officer")}
                  className="text-xs"
                >
                  Officer
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fillTestCredentials("inspector")}
                  className="text-xs"
                >
                  Inspector
                </Button>
              </div>

              <div className="space-y-1 text-xs text-muted-foreground">
                <div>
                  <strong>Admin:</strong> admin@police.gov.in / admin123
                </div>
                <div>
                  <strong>Officer:</strong> officer@police.gov.in / police123
                </div>
                <div>
                  <strong>Inspector:</strong> inspector@police.gov.in /
                  inspect123
                </div>
              </div>

              <div className="mt-2 text-xs text-blue-600">
                API URL:{" "}
                {import.meta.env.VITE_API_URL || "http://localhost:5000"}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Powered by Deltamarch */}
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-2">Powered by</p>
          <img
            src="/lovable-uploads/2a19bb73-df31-4860-aae7-1059f90f54b4.png"
            alt="Deltamarch"
            className="mx-auto h-8 w-auto opacity-70"
          />
        </div>
      </div>

      <ForgotPasswordModal
        open={showForgotPassword}
        onOpenChange={setShowForgotPassword}
      />
    </div>
  );
};
