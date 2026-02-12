import { useState, useEffect } from "react";
import { createContext } from "react";
import axiosInstance from "./axiosinstance";
import { toast } from "react-toastify";
import { useContext } from "react";
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("user");
      if (stored) {
        const parsed = JSON.parse(stored);
        setUser(parsed);
        setToken(parsed.token);
      }
      setInitialLoading(false);
    }
  }, []);
  const [loading, setloading] = useState(false);
  const [error, seterror] = useState(null);

  const Signup = async ({ name, email, password, mobile }) => {
    setloading(true);
    seterror(null);
    try {
      const res = await axiosInstance.post("/user/signup", {
        name,
        email,
        password,
        mobile,
      });
      const { data, token: newToken } = res.data;
      localStorage.setItem("user", JSON.stringify({ ...data, token: newToken }));
      setUser(data);
      setToken(newToken);
      toast.success("Signup Successful");
    } catch (error) {
      const msg = error.response?.data.message || "Signup failed";
      seterror(msg);
      toast.error(msg);
    } finally {
      setloading(false);
    }
  };

  const registerWithOtp = async ({ name, email, password, mobile }) => {
    setloading(true);
    seterror(null);
    try {
      await axiosInstance.post("/user/register", {
        name,
        email,
        password,
        mobile,
      });
      const otpRes = await axiosInstance.post("/user/send-otp", { email });
      toast.success("Registration created. OTP sent.");
      return otpRes.data;
    } catch (error) {
      // If account exists but needs verification, send OTP and redirect
      if (error.response?.data?.requiresVerification) {
        try {
          const otpRes = await axiosInstance.post("/user/send-otp", { email });
          toast.info("Account exists. OTP sent for verification.");
          // Return the OTP response so devOtp is available
          error.response.data.devOtp = otpRes.data.devOtp;
          throw error; // Re-throw so frontend handles redirect
        } catch (otpError) {
          // If OTP sending fails, still throw original error
          throw error;
        }
      }
      const msg = error.response?.data?.message || "Registration failed";
      seterror(msg);
      toast.error(msg);
      throw error;
    } finally {
      setloading(false);
    }
  };

  const verifyRegistrationOtp = async ({ email, otp }) => {
    setloading(true);
    seterror(null);
    try {
      const res = await axiosInstance.post("/user/verify-otp", { email, otp });
      const { data, token: newToken } = res.data;
      localStorage.setItem("user", JSON.stringify({ ...data, token: newToken }));
      setUser(data);
      setToken(newToken);
      toast.success("Verification successful");
      return res.data;
    } catch (error) {
      const msg = error.response?.data?.message || "Verification failed";
      seterror(msg);
      toast.error(msg);
      throw error;
    } finally {
      setloading(false);
    }
  };

  const resendRegistrationOtp = async (email) => {
    setloading(true);
    seterror(null);
    try {
      const res = await axiosInstance.post("/user/resend-otp", { email });
      toast.success("OTP resent");
      return res.data;
    } catch (error) {
      const msg = error.response?.data?.message || "Failed to resend OTP";
      seterror(msg);
      toast.error(msg);
      throw error;
    } finally {
      setloading(false);
    }
  };
  
  const Login = async ({ email, password, otp }) => {
    setloading(true);
    seterror(null);
    try {
      const res = await axiosInstance.post("/user/login", {
        email,
        password,
        otp,
      });
      
      // Check if OTP is required
      if (res.data.requiresOTP) {
        setloading(false);
        return res.data; // Return the response for handling in the component
      }
      
      const { data, token: newToken } = res.data;
      localStorage.setItem("user", JSON.stringify({ ...data, token: newToken }));
      setUser(data);
      setToken(newToken);
      toast.success("Login Successful");
      return res.data;
    } catch (error) {
      const msg = error.response?.data.message || "Login failed";
      seterror(msg);
      toast.error(msg);
      throw error;
    } finally {
      setloading(false);
    }
  };
  
  const Logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("user");
    toast.info("Logged out");
  };

  const updateUserProfile = async (id, updates) => {
    try {
      const res = await axiosInstance.patch(`/user/update/${id}`, {
        editForm: updates,
      });
      const updatedUserData = res.data.data;
      const currentUser = JSON.parse(localStorage.getItem("user"));
      const newData = { ...updatedUserData, token: currentUser.token };
      localStorage.setItem("user", JSON.stringify(newData));
      setUser(updatedUserData);
      toast.success("Profile Updated");
    } catch (error) {
      console.log(error);
      toast.error("Update failed");
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        setUser,
        setToken,
        Signup,
        registerWithOtp,
        verifyRegistrationOtp,
        resendRegistrationOtp,
        Login,
        Logout,
        loading,
        initialLoading,
        error,
        updateUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
export const useAuth = () => useContext(AuthContext);
