import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/AuthContext";
import Link from "next/link";
import { useRouter } from "next/router";
import React, { useState } from "react";
import { toast } from "react-toastify";
import { Eye, EyeOff } from "lucide-react";

const index = () => {
  const router = useRouter();
  const { Login, loading } = useAuth();
  const backendUrl = process.env.BACKEND_URL || "https://stackoverflow-clone-6cll.onrender.com";
  const [form, setform] = useState({ email: "", password: "" });
  const [requiresOTP, setRequiresOTP] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [devOtp, setDevOtp] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e: any) => {
    setform({ ...form, [e.target.id]: e.target.value });
  };

  const handlesubmit = async (e: any) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      toast.error("All fields are required");
      return;
    }
    
    try {
      // Use AuthContext for login to ensure consistent token storage
      const response = await Login({
        email: form.email,
        password: form.password,
        otp: requiresOTP ? otp : undefined,
      });

      // Handle OTP-required response from backend (Chrome)
      if (response?.requiresOTP) {
        setRequiresOTP(true);
        setDevOtp(response.devOtp || "");
        toast.info(`🔐 ${response.message}. Check your ${response.otpSentTo}.`);
        return;
      }

      router.push("/");
    } catch (error: any) {
      const message = error.response?.data?.message || "Login failed";
      
      // Check for time window restriction (mobile)
      if (error.response?.data?.requiresTimeWindow) {
        toast.error(`📱 ${message}`);
      } else {
        toast.error(message);
      }
      
      // Reset OTP state on error
      if (requiresOTP) {
        setOtp("");
        setDevOtp("");
      }
    } finally {
      setOtpLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6 lg:mb-8">
          <Link href="/" className="flex items-center justify-center mb-4">
            <div className="w-6 h-6 lg:w-8 lg:h-8 bg-orange-500 rounded mr-2 flex items-center justify-center">
              <div className="w-4 h-4 lg:w-6 lg:h-6 bg-white rounded-sm flex items-center justify-center">
                <div className="w-3 h-3 lg:w-4 lg:h-4 bg-orange-500 rounded-sm"></div>
              </div>
            </div>
            <span className="text-lg lg:text-xl font-bold text-gray-800 dark:text-white">
              stack<span className="font-normal">overflow</span>
            </span>
          </Link>
        </div>
        <form onSubmit={handlesubmit}>
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardHeader className="space-y-1 text-center">
              <CardTitle className="text-xl lg:text-2xl text-gray-900 dark:text-white">
                {requiresOTP ? "Enter OTP" : "Log in to your account"}
              </CardTitle>
              <CardDescription className="text-gray-500 dark:text-gray-400">
                {requiresOTP 
                  ? "A verification code was sent to your email" 
                  : "Enter your email and password to access Stack Overflow"
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!requiresOTP ? (
                <>
                  <Button
                    variant="outline"
                    className="w-full bg-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 text-sm"
                    type="button"
                    onClick={() => window.location.href = `${backendUrl}/auth/google`}
                  >
                    <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
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
                    Log in with Google
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full bg-white text-gray-800 border-gray-300 hover:bg-gray-50 text-sm"
                    type="button"
                    onClick={(e) => { e.preventDefault(); toast.info("GitHub OAuth not configured yet. Please use email/password login."); }}
                  >
                    <svg
                      className="w-4 h-4 mr-2"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Log in with GitHub
                  </Button>
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-white px-2 text-muted-foreground">
                        Or continue with
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm text-gray-700">
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="m@example.com"
                      onChange={handleChange}
                      value={form.email}
                      className="bg-white text-gray-900 border-gray-300"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm text-gray-700">
                      Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        onChange={handleChange}
                        value={form.password}
                        className="bg-white text-gray-900 border-gray-300 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="p-4 bg-blue-50 rounded-lg text-center mb-4">
                    <p className="text-sm text-blue-800">
                      🔒 Chrome browser detected. OTP verification required for security.
                    </p>
                  </div>
                  {devOtp && (
                    <div className="p-3 rounded-md bg-amber-50 text-amber-800 text-xs text-center">
                      Dev OTP: <strong>{devOtp}</strong>
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="otp" className="text-sm">
                      Enter 6-digit OTP
                    </Label>
                    <Input
                      id="otp"
                      type="text"
                      placeholder="000000"
                      maxLength={6}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      className="text-center text-2xl tracking-widest"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => { setRequiresOTP(false); setOtp(""); }}
                    className="text-sm text-blue-600 hover:underline w-full text-center"
                  >
                    ← Back to login
                  </button>
                </>
              )}
              
              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-sm"
                disabled={loading || otpLoading}
              >
                {loading || otpLoading ? "Please wait..." : requiresOTP ? "Verify OTP" : "Log in"}
              </Button>
              
              {!requiresOTP && (
                <>
                  <div className="text-center text-sm">
                    <Link href="/forgot-password" className="text-blue-600 hover:underline">
                      Forgot your password?
                    </Link>
                  </div>
                  <div className="text-center text-sm">
                    Don't have an account?{" "}
                    <Link href="/signup" className="text-blue-600 hover:underline">
                      Sign up
                    </Link>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  );
};

export default index;
