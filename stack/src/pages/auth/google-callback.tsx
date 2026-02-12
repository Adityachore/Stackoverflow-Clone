import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import axiosInstance from "@/lib/axiosinstance";
import { useAuth } from "@/lib/AuthContext";
import { toast } from "react-toastify";

const GoogleCallback = () => {
  const router = useRouter();
  const { setUser, setToken } = useAuth();
  const [error, setError] = useState("");

  useEffect(() => {
    if (!router.isReady) return;

    const token = typeof router.query.token === "string" ? router.query.token : "";

    if (!token) {
      setError("Missing token from Google login.");
      return;
    }

    const init = async () => {
      try {
        // Store token first so axiosInstance picks it up
        localStorage.setItem("user", JSON.stringify({ token }));
        setToken(token);

        const { data } = await axiosInstance.get("/user/me");
        const userData = data?.data;

        if (!userData) {
          throw new Error("Failed to load user profile");
        }

        localStorage.setItem("user", JSON.stringify({ ...userData, token }));
        setUser(userData);
        toast.success("Logged in with Google");
        router.replace("/");
      } catch (err: any) {
        console.error(err);
        setError(err.response?.data?.message || err.message || "Google login failed");
      }
    };

    init();
  }, [router.isReady, router.query.token, router, setToken, setUser]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="max-w-md w-full bg-white rounded-lg shadow p-6 text-center">
        {!error ? (
          <>
            <h1 className="text-xl font-semibold mb-2">Signing you in…</h1>
            <p className="text-sm text-gray-500">Please wait while we finish Google login.</p>
          </>
        ) : (
          <>
            <h1 className="text-xl font-semibold mb-2">Google login failed</h1>
            <p className="text-sm text-red-600">{error}</p>
            <button
              className="mt-4 inline-flex items-center justify-center px-4 py-2 rounded bg-blue-600 text-white"
              onClick={() => router.replace("/auth")}
            >
              Go to Login
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default GoogleCallback;
