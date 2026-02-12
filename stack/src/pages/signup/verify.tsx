import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState, FormEvent } from "react";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/AuthContext";

const OTP_TTL_SECONDS = 300;
const RESEND_COOLDOWN_SECONDS = 60;

export default function VerifySignupOtpPage() {
  const router = useRouter();
  const { email } = router.query;
  const { verifyRegistrationOtp, resendRegistrationOtp, loading } = useAuth();
  const [otp, setOtp] = useState("");
  const [secondsLeft, setSecondsLeft] = useState(OTP_TTL_SECONDS);
  const [resendSecondsLeft, setResendSecondsLeft] = useState(0);
  const [devOtp, setDevOtp] = useState("");

  const normalizedEmail = useMemo(
    () => (typeof email === "string" ? email : ""),
    [email]
  );

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedOtp = sessionStorage.getItem("regOtpDev");
      if (storedOtp) {
        setDevOtp(storedOtp);
        sessionStorage.removeItem("regOtpDev"); // Clear after reading
      }
    }
  }, []);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const interval = setInterval(() => {
      setSecondsLeft((prev) => Math.max(prev - 1, 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [secondsLeft]);

  useEffect(() => {
    if (resendSecondsLeft <= 0) return;
    const interval = setInterval(() => {
      setResendSecondsLeft((prev) => Math.max(prev - 1, 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [resendSecondsLeft]);

  const handleVerify = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!normalizedEmail) {
      toast.error("Email is missing. Please restart signup.");
      return;
    }
    if (!otp || otp.length !== 6) {
      toast.error("Enter a valid 6-digit OTP");
      return;
    }

    try {
      await verifyRegistrationOtp({ email: normalizedEmail, otp });
      router.push("/");
    } catch (error) {
      setOtp("");
    }
  };

  const handleResend = async () => {
    if (!normalizedEmail) {
      toast.error("Email is missing. Please restart signup.");
      return;
    }

    try {
      const res = await resendRegistrationOtp(normalizedEmail);
      if (typeof window !== "undefined" && res?.devOtp) {
        sessionStorage.setItem("regOtpDev", res.devOtp);
        setDevOtp(res.devOtp);
      }
      setSecondsLeft(OTP_TTL_SECONDS);
      setResendSecondsLeft(RESEND_COOLDOWN_SECONDS);
    } catch (error) {
      // handled in context
    }
  };

  const timeDisplay = `${String(Math.floor(secondsLeft / 60)).padStart(2, "0")}:${String(
    secondsLeft % 60
  ).padStart(2, "0")}`;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6 lg:mb-8">
          <Link href="/" className="flex items-center justify-center mb-4">
            <div className="w-6 h-6 lg:w-8 lg:h-8 bg-orange-500 rounded mr-2 flex items-center justify-center">
              <div className="w-4 h-4 lg:w-6 lg:h-6 bg-white rounded-sm flex items-center justify-center">
                <div className="w-3 h-3 lg:w-4 lg:h-4 bg-orange-500 rounded-sm"></div>
              </div>
            </div>
            <span className="text-lg lg:text-xl font-bold text-gray-800">
              stack<span className="font-normal">overflow</span>
            </span>
          </Link>
        </div>
        <form onSubmit={handleVerify}>
          <Card>
            <CardHeader className="space-y-1 text-center">
              <CardTitle className="text-xl lg:text-2xl">Verify your email</CardTitle>
              <CardDescription>
                Enter the 6-digit OTP sent to {normalizedEmail || "your email"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {devOtp && (
                <div className="p-3 rounded-md bg-amber-50 text-amber-800 text-xs text-center">
                  Dev OTP: <strong>{devOtp}</strong>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="otp" className="text-sm text-gray-700">
                  OTP
                </Label>
                <Input
                  id="otp"
                  type="text"
                  placeholder="000000"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="text-center text-2xl tracking-widest bg-white text-gray-900 border-gray-300"
                />
              </div>

              <div className="flex items-center justify-between text-xs text-gray-600">
                <span>OTP expires in {timeDisplay}</span>
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resendSecondsLeft > 0 || loading}
                  className="text-blue-600 hover:underline disabled:text-gray-400 disabled:no-underline"
                >
                  {resendSecondsLeft > 0
                    ? `Resend in ${resendSecondsLeft}s`
                    : "Resend OTP"}
                </button>
              </div>

              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-sm"
                disabled={loading || secondsLeft === 0}
              >
                {loading ? "Verifying..." : "Verify OTP"}
              </Button>

              <div className="text-center text-sm">
                <Link href="/signup" className="text-blue-600 hover:underline">
                  Back to sign up
                </Link>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  );
}
