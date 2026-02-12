import mongoose from "mongoose";
import user from "../models/auth.js";
import otpModel from "../models/otp.js";
import Friendship from "../models/friendship.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import * as UAParserModule from "ua-parser-js";
const UAParser = UAParserModule.default || UAParserModule;
import moment from "moment-timezone";
import {
  sendPasswordResetEmail,
  sendEmailOTP,
  sendSMSOTP,
  generateRandomPassword,
  generateOTP
} from "../services/notification.js";

// Supported languages
const SUPPORTED_LANGUAGES = ['English', 'Spanish', 'Hindi', 'Portuguese', 'Chinese', 'French'];

// Language change OTP settings
const LANGUAGE_OTP_TTL_MS = 5 * 60 * 1000; // 5 minutes
const LANGUAGE_OTP_MAX_ATTEMPTS = 5;
const LANGUAGE_OTP_RESEND_COOLDOWN_MS = 30 * 1000; // 30 seconds
const LANGUAGE_OTP_MAX_RESENDS = 5;

const REGISTRATION_OTP_TTL_MS = 5 * 60 * 1000;
const REGISTRATION_OTP_MAX_ATTEMPTS = 3;
const REGISTRATION_OTP_RESEND_COOLDOWN_MS = 60 * 1000;

const LOGIN_OTP_TTL_MS = 5 * 60 * 1000;
const LOGIN_OTP_MAX_ATTEMPTS = 3;
const LOGIN_OTP_RESEND_COOLDOWN_MS = 60 * 1000;

const PASSWORD_RESET_OTP_TTL_MS = 5 * 60 * 1000;
const PASSWORD_RESET_OTP_MAX_ATTEMPTS = 3;
const PASSWORD_RESET_OTP_RESEND_COOLDOWN_MS = 60 * 1000;

const normalizeEmail = (email = "") => email.trim().toLowerCase();

const validatePassword = (password) => {
  if (!password || password.length < 8) {
    return "Password must be at least 8 characters";
  }
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  if (!hasLetter || !hasNumber) {
    return "Password must contain at least 1 letter and 1 number";
  }
  return null;
};

const issueOtp = async ({ email, purpose, ttlMs, cooldownMs }) => {
  const now = Date.now();
  const recentOtp = await otpModel.findOne({
    email,
    purpose,
    verified: false,
    createdAt: { $gte: new Date(now - cooldownMs) }
  });

  if (recentOtp) {
    const elapsedMs = now - new Date(recentOtp.createdAt).getTime();
    const retryAfterSeconds = Math.max(Math.ceil((cooldownMs - elapsedMs) / 1000), 1);
    return { rateLimited: true, retryAfterSeconds };
  }

  await otpModel.deleteMany({ email, purpose, verified: false });

  const otpCode = generateOTP();
  const otpHash = await bcrypt.hash(otpCode, 12);
  const otpDoc = await otpModel.create({
    email,
    otpHash,
    purpose,
    createdAt: new Date(now),
    expiresAt: new Date(now + ttlMs),
    attempts: 0,
    verified: false
  });

  return { otpCode, otpId: otpDoc._id };
};

const issueRegistrationOtp = async (email) => {
  return issueOtp({
    email,
    purpose: "registration",
    ttlMs: REGISTRATION_OTP_TTL_MS,
    cooldownMs: REGISTRATION_OTP_RESEND_COOLDOWN_MS
  });
};

const respondGenericOtp = (res, sendToEmail) => {
  return res.status(200).json({
    message: sendToEmail
      ? "If eligible, an OTP was sent to your email."
      : "If eligible, an OTP was sent to your mobile.",
    otpSentTo: sendToEmail ? "email" : "sms"
  });
};

const isRegisteredMobile = (mobile) => typeof mobile === 'string' && mobile.trim().length >= 8;

// Friend code helpers
const normalizeFriendBase = (name = 'USER') => {
  const cleaned = name.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  return (cleaned || 'USER').slice(0, 12);
};

const generateFriendCode = async (name = 'USER') => {
  const base = normalizeFriendBase(name);
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const code = `${base}${Math.floor(1000 + Math.random() * 9000)}`;
    const exists = await user.exists({ friendCode: code });
    if (!exists) return code;
  }
  return `${base}${Date.now().toString().slice(-4)}`;
};

const ensureFriendCode = async (userDoc) => {
  if (!userDoc) return null;
  if (userDoc.friendCode) return userDoc.friendCode;
  const newCode = await generateFriendCode(userDoc.name || 'USER');
  userDoc.friendCode = newCode;
  await userDoc.save();
  return newCode;
};

export const Signup = async (req, res) => {
  const { name, email, password, mobile } = req.body;
  
  const passwordError = validatePassword(password);
  if (passwordError) {
    return res.status(400).json({ message: passwordError });
  }
  
  try {
    const exisitinguser = await user.findOne({ email });
    if (exisitinguser) {
      return res.status(404).json({ message: "User already exist" });
    }
    const hashpassword = await bcrypt.hash(password, 12);
    const friendCode = await generateFriendCode(name);
    const newuser = await user.create({
      name,
      email,
      password: hashpassword,
      mobile: mobile || '',
      friendCode,
    });
    const token = jwt.sign(
      { email: newuser.email, id: newuser._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );
    
    // Remove password from response
    const userResponse = newuser.toObject();
    delete userResponse.password;
    
    res.status(200).json({ data: userResponse, token });
  } catch (error) {
    console.log(error);
    res.status(500).json("something went wrong..");
    return;
  }
};

export const Login = async (req, res) => {
  const { email, password, otp } = req.body;
  const userAgent = req.headers['user-agent'] || '';
  const ip = req.headers['x-forwarded-for'] || req.connection?.remoteAddress || req.ip || 'Unknown';
  const normalizedLoginEmail = normalizeEmail(email);

  try {
    const exisitinguser = await user.findOne({ email: normalizedLoginEmail });
    if (!exisitinguser) {
      return res.status(404).json({ message: "No account found with this email. Please sign up first." });
    }

    const ispasswordcrct = await bcrypt.compare(password, exisitinguser.password);
    if (!ispasswordcrct) {
      return res.status(400).json({ message: "Invalid password" });
    }

    if (exisitinguser.isVerified === false) {
      return res.status(403).json({
        message: "Account not verified. Please verify with OTP to continue.",
        requiresVerification: true
      });
    }

    // Parse user agent for login tracking
    const parser = new UAParser(userAgent);
    const browserInfo = parser.getBrowser();
    const osInfo = parser.getOS();
    const deviceInfo = parser.getDevice();

    const browser = browserInfo.name || 'Unknown';
    const os = osInfo.name || 'Unknown';
    const deviceType = deviceInfo.type || 'desktop';

    // --- Conditional Authentication Rules ---

    // 1. Mobile devices: Only allowed between 10:00 AM - 1:00 PM IST
    if (deviceType === 'mobile' || deviceType === 'tablet') {
      const now = moment().tz("Asia/Kolkata");
      const currentHour = now.hour();

      if (currentHour < 10 || currentHour >= 13) {
        return res.status(403).json({
          message: "Mobile login is only allowed between 10:00 AM and 1:00 PM IST.",
          requiresTimeWindow: true,
          deviceType
        });
      }
    }

    // 2. Google Chrome: Requires email OTP verification
    if (browser.toLowerCase().includes('chrome') && !browser.toLowerCase().includes('edge')) {
      if (!otp) {
        const otpIssueResult = await issueOtp({
          email: exisitinguser.email,
          purpose: "login",
          ttlMs: LOGIN_OTP_TTL_MS,
          cooldownMs: LOGIN_OTP_RESEND_COOLDOWN_MS
        });

        if (otpIssueResult.rateLimited) {
          return res.status(429).json({
            message: "Please wait before requesting another OTP.",
            retryAfterSeconds: otpIssueResult.retryAfterSeconds
          });
        }

        const otpCode = otpIssueResult.otpCode;

        const otpResult = await sendEmailOTP(exisitinguser.email, otpCode, 'login verification');
        if (otpResult?.success === false) {
          return res.status(500).json({ message: "Failed to send OTP. Please try again." });
        }

        return res.status(200).json({
          message: "OTP sent to your email for verification",
          requiresOTP: true,
          otpSentTo: 'email',
          browser,
          devOtp: process.env.NODE_ENV !== 'production' ? otpCode : undefined
        });
      }

      // Verify OTP
      const latestLoginOtp = await otpModel.findOne({
        email: exisitinguser.email,
        purpose: "login",
        verified: false
      }).sort({ createdAt: -1 });

      if (!latestLoginOtp) {
        return res.status(400).json({ message: "Please request OTP first" });
      }

      if (new Date() > new Date(latestLoginOtp.expiresAt)) {
        await otpModel.deleteOne({ _id: latestLoginOtp._id });
        return res.status(400).json({ message: "OTP has expired. Please request a new one." });
      }

      if (latestLoginOtp.attempts >= LOGIN_OTP_MAX_ATTEMPTS) {
        await otpModel.deleteOne({ _id: latestLoginOtp._id });
        return res.status(400).json({ message: "OTP attempts exceeded. Please request a new one." });
      }

      const isValidOtp = await bcrypt.compare(otp, latestLoginOtp.otpHash || "");
      if (!isValidOtp) {
        latestLoginOtp.attempts += 1;
        await latestLoginOtp.save();
        return res.status(400).json({ message: "Invalid OTP" });
      }

      await otpModel.deleteMany({ email: exisitinguser.email, purpose: "login" });
    }

    // 3. Microsoft browsers (Edge, IE): Direct login (no OTP required)

    // Update last seen and add login history
    exisitinguser.lastSeen = new Date();
    exisitinguser.loginHistory.push({
      browser,
      os,
      device: deviceType,
      ip: typeof ip === 'string' ? ip : ip[0],
      loginAt: new Date()
    });

    // Keep only last 50 login records
    if (exisitinguser.loginHistory.length > 50) {
      exisitinguser.loginHistory = exisitinguser.loginHistory.slice(-50);
    }

    await exisitinguser.save();
    await ensureFriendCode(exisitinguser);

    const token = jwt.sign(
      { email: exisitinguser.email, id: exisitinguser._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Remove password from response
    const userResponse = exisitinguser.toObject();
    delete userResponse.password;

    res.status(200).json({ data: userResponse, token });
  } catch (error) {
    console.error(error);
    res.status(500).json("something went wrong..");
    return;
  }
};

export const registerUser = async (req, res) => {
  const { name, email, password, mobile } = req.body;
  const normalizedEmail = normalizeEmail(email);

  const passwordError = validatePassword(password);
  if (passwordError) {
    return res.status(400).json({ message: passwordError });
  }

  if (!name || !normalizedEmail || !password) {
    return res.status(400).json({ message: "Name, email, and password are required" });
  }

  try {
    const existingUser = await user.findOne({ email: normalizedEmail });
    if (existingUser) {
      if (existingUser.isVerified === false) {
        return res.status(409).json({
          message: "Account already exists but is not verified.",
          requiresVerification: true,
          email: normalizedEmail
        });
      }
      return res.status(409).json({ message: "User already exist" });
    }

    const hashpassword = await bcrypt.hash(password, 12);
    const friendCode = await generateFriendCode(name);
    const newUser = await user.create({
      name,
      email: normalizedEmail,
      password: hashpassword,
      mobile: mobile || "",
      friendCode,
      isVerified: false
    });

    return res.status(201).json({
      message: "Registration successful. Please verify OTP.",
      userId: newUser._id,
      email: newUser.email
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const sendRegistrationOtp = async (req, res) => {
  const { email } = req.body;
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail) {
    return res.status(400).json({ message: "Email is required" });
  }

  try {
    const existingUser = await user.findOne({ email: normalizedEmail });
    if (!existingUser) {
      return res.status(404).json({ message: "No account found with this email. Please sign up first." });
    }

    if (existingUser.isVerified === true) {
      return res.status(400).json({ message: "Account already verified. Please log in." });
    }

    const otpIssueResult = await issueRegistrationOtp(normalizedEmail);
    if (otpIssueResult.rateLimited) {
      return res.status(429).json({
        message: "Please wait before requesting another OTP.",
        retryAfterSeconds: otpIssueResult.retryAfterSeconds
      });
    }

    const { otpCode } = otpIssueResult;

    // Send OTP via email
    const emailResult = await sendEmailOTP(normalizedEmail, otpCode, "registration verification");
    if (emailResult?.success === false && process.env.NODE_ENV === "production") {
      return res.status(500).json({ message: "Failed to send OTP email. Please try again." });
    }

    if (process.env.NODE_ENV !== "production") {
      console.log(`[Registration OTP] ${normalizedEmail}: ${otpCode}`);
    }

    return res.status(200).json({
      message: "OTP sent for registration verification",
      devOtp: process.env.NODE_ENV !== "production" ? otpCode : undefined
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const verifyRegistrationOtp = async (req, res) => {
  const { email, otp } = req.body;
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail || !otp) {
    return res.status(400).json({ message: "Email and OTP are required" });
  }

  try {
    const existingUser = await user.findOne({ email: normalizedEmail });
    if (!existingUser) {
      return res.status(404).json({ message: "No account found with this email." });
    }

    if (existingUser.isVerified === true) {
      return res.status(400).json({ message: "Account already verified. Please log in." });
    }

    const latestOtp = await otpModel.findOne({
      email: normalizedEmail,
      purpose: "registration",
      verified: false
    }).sort({ createdAt: -1 });

    if (!latestOtp) {
      return res.status(400).json({ message: "OTP not found. Please request a new one." });
    }

    if (new Date() > new Date(latestOtp.expiresAt)) {
      await otpModel.deleteOne({ _id: latestOtp._id });
      return res.status(400).json({ message: "OTP has expired. Please request a new one." });
    }

    if (latestOtp.attempts >= REGISTRATION_OTP_MAX_ATTEMPTS) {
      await otpModel.deleteOne({ _id: latestOtp._id });
      return res.status(400).json({ message: "OTP attempts exceeded. Please request a new one." });
    }

    const isValidOtp = await bcrypt.compare(otp, latestOtp.otpHash || "");
    if (!isValidOtp) {
      latestOtp.attempts += 1;
      await latestOtp.save();
      const remainingAttempts = Math.max(REGISTRATION_OTP_MAX_ATTEMPTS - latestOtp.attempts, 0);
      return res.status(400).json({
        message: "Invalid OTP",
        remainingAttempts
      });
    }

    existingUser.isVerified = true;
    await existingUser.save();
    await otpModel.deleteMany({ email: normalizedEmail, purpose: "registration" });
    await ensureFriendCode(existingUser);

    const token = jwt.sign(
      { email: existingUser.email, id: existingUser._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    const userResponse = existingUser.toObject();
    delete userResponse.password;

    return res.status(200).json({
      message: "Verification successful",
      data: userResponse,
      token
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const resendRegistrationOtp = async (req, res) => {
  return sendRegistrationOtp(req, res);
};

export const requestPasswordResetOtp = async (req, res) => {
  const { email } = req.body;
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail) {
    return res.status(400).json({ message: "Email is required" });
  }

  try {
    const userData = await user.findOne({ email: normalizedEmail });
    if (!userData) {
      return res.status(404).json({ message: "No account found with this email" });
    }

    // Daily limit: 1 reset per day
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const lastReset = userData.lastPasswordReset?.date;
    const resetCount = userData.lastPasswordReset?.count || 0;
    if (lastReset && new Date(lastReset) >= today && resetCount >= 1) {
      return res.status(429).json({
        message: "Password reset already requested today. Please try again tomorrow.",
        isWarning: true
      });
    }

    const otpIssueResult = await issueOtp({
      email: normalizedEmail,
      purpose: "password-reset",
      ttlMs: PASSWORD_RESET_OTP_TTL_MS,
      cooldownMs: PASSWORD_RESET_OTP_RESEND_COOLDOWN_MS
    });

    if (otpIssueResult.rateLimited) {
      return res.status(429).json({
        message: "Please wait before requesting another OTP.",
        retryAfterSeconds: otpIssueResult.retryAfterSeconds
      });
    }

    const otpCode = otpIssueResult.otpCode;
    const otpResult = await sendEmailOTP(normalizedEmail, otpCode, "password reset");
    if (otpResult?.success === false) {
      return res.status(500).json({ message: "Failed to send OTP. Please try again." });
    }

    if (process.env.NODE_ENV !== "production") {
      console.log(`[Password Reset OTP] ${normalizedEmail}: ${otpCode}`);
    }

    return res.status(200).json({
      message: "OTP sent for password reset",
      devOtp: process.env.NODE_ENV !== "production" ? otpCode : undefined
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const confirmPasswordResetOtp = async (req, res) => {
  const { email, otp, newPassword } = req.body;
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail || !otp || !newPassword) {
    return res.status(400).json({ message: "Email, OTP, and new password are required" });
  }

  const passwordError = validatePassword(newPassword);
  if (passwordError) {
    return res.status(400).json({ message: passwordError });
  }

  try {
    const userData = await user.findOne({ email: normalizedEmail });
    if (!userData) {
      return res.status(404).json({ message: "No account found with this email" });
    }

    const latestOtp = await otpModel.findOne({
      email: normalizedEmail,
      purpose: "password-reset",
      verified: false
    }).sort({ createdAt: -1 });

    if (!latestOtp) {
      return res.status(400).json({ message: "OTP not found. Please request a new one." });
    }

    if (new Date() > new Date(latestOtp.expiresAt)) {
      await otpModel.deleteOne({ _id: latestOtp._id });
      return res.status(400).json({ message: "OTP has expired. Please request a new one." });
    }

    if (latestOtp.attempts >= PASSWORD_RESET_OTP_MAX_ATTEMPTS) {
      await otpModel.deleteOne({ _id: latestOtp._id });
      return res.status(400).json({ message: "OTP attempts exceeded. Please request a new one." });
    }

    const isValidOtp = await bcrypt.compare(otp, latestOtp.otpHash || "");
    if (!isValidOtp) {
      latestOtp.attempts += 1;
      await latestOtp.save();
      const remainingAttempts = Math.max(PASSWORD_RESET_OTP_MAX_ATTEMPTS - latestOtp.attempts, 0);
      return res.status(400).json({
        message: "Invalid OTP",
        remainingAttempts
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    userData.password = hashedPassword;
    userData.lastPasswordReset = {
      date: new Date(),
      count: 1
    };

    await userData.save();
    await otpModel.deleteMany({ email: normalizedEmail, purpose: "password-reset" });

    return res.status(200).json({ message: "Password reset successful" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const getallusers = async (req, res) => {
  try {
    const alluser = await user.find().select("-password");
    res.status(200).json({ data: alluser });
  } catch (error) {
    res.status(500).json("something went wrong..");
    return;
  }
};

export const getuserbyid = async (req, res) => {
  const { id } = req.params;
  
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid user ID" });
  }
  
  try {
    const userData = await user.findByIdAndUpdate(
      id,
      { $inc: { profileViews: 1 } },
      { new: true }
    ).select("-password");
    
    if (!userData) {
      return res.status(404).json({ message: "User not found" });
    }
    await ensureFriendCode(userData);
    
    res.status(200).json({ data: userData });
  } catch (error) {
    res.status(500).json("something went wrong..");
    return;
  }
};

export const updateprofile = async (req, res) => {
  const { id: _id } = req.params;
  const { name, about, tags, location, website, mobile } = req.body.editForm;
  if (!mongoose.Types.ObjectId.isValid(_id)) {
    return res.status(400).json({ message: "User unavailable" });
  }
  try {
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (about !== undefined) updateData.about = about;
    if (tags !== undefined) updateData.tags = tags;
    if (location !== undefined) updateData.location = location;
    if (website !== undefined) updateData.website = website;
    if (mobile !== undefined) updateData.mobile = mobile;
    
    const updateprofile = await user.findByIdAndUpdate(
      _id,
      { $set: updateData },
      { new: true }
    ).select("-password");
    res.status(200).json({ data: updateprofile });
  } catch (error) {
    console.log(error);
    res.status(500).json("something went wrong..");
    return;
  }
};

// Toggle bookmark for a question
export const toggleBookmark = async (req, res) => {
  const { id: userId } = req.params;
  const { questionId } = req.body;
  
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ message: "Invalid user ID" });
  }
  
  if (!mongoose.Types.ObjectId.isValid(questionId)) {
    return res.status(400).json({ message: "Invalid question ID" });
  }
  
  try {
    const userData = await user.findById(userId);
    
    if (!userData) {
      return res.status(404).json({ message: "User not found" });
    }
    
    const bookmarkIndex = userData.bookmarks.findIndex(
      (b) => b.toString() === questionId
    );
    
    if (bookmarkIndex === -1) {
      // Add bookmark
      userData.bookmarks.push(questionId);
    } else {
      // Remove bookmark
      userData.bookmarks.splice(bookmarkIndex, 1);
    }
    
    await userData.save();
    
    const userResponse = userData.toObject();
    delete userResponse.password;
    
    res.status(200).json({ data: userResponse });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

// Get user's bookmarked questions
export const getBookmarks = async (req, res) => {
  const { id: userId } = req.params;
  
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ message: "Invalid user ID" });
  }
  
  try {
    const userData = await user.findById(userId).populate("bookmarks");
    
    if (!userData) {
      return res.status(404).json({ message: "User not found" });
    }
    
    res.status(200).json({ data: userData.bookmarks });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

// --- FORGOT PASSWORD with Daily Limit ---
export const forgotPassword = async (req, res) => {
  const { email, mobile } = req.body;

  if (!email && !mobile) {
    return res.status(400).json({ message: "Please provide email or mobile number" });
  }

  try {
    const query = email ? { email } : { mobile };
    const userData = await user.findOne(query);

    if (!userData) {
      return res.status(404).json({ message: "No account found with this email/mobile" });
    }

    // Check daily limit
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const lastReset = userData.lastPasswordReset?.date;
    const resetCount = userData.lastPasswordReset?.count || 0;

    if (lastReset && new Date(lastReset) >= today) {
      if (resetCount >= 1) {
        return res.status(429).json({
          message: "Warning: You have already reset your password today. Please try again tomorrow.",
          isWarning: true
        });
      }
    }

    // Generate random password (letters only as per requirement)
    const newPassword = generateRandomPassword(12);
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    userData.password = hashedPassword;
    userData.lastPasswordReset = {
      date: new Date(),
      count: (lastReset && new Date(lastReset) >= today) ? resetCount + 1 : 1
    };

    await userData.save();
    await sendPasswordResetEmail(userData.email, newPassword);

    res.status(200).json({
      message: "A new password has been sent to your registered email address.",
      resetCount: userData.lastPasswordReset.count
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

// --- TRANSFER POINTS ---
export const transferPoints = async (req, res) => {
  const { id: senderId } = req.params;
  const { recipientId, amount } = req.body;

  if (!mongoose.Types.ObjectId.isValid(senderId) || !mongoose.Types.ObjectId.isValid(recipientId)) {
    return res.status(400).json({ message: "Invalid user ID" });
  }

  if (!amount || amount <= 0) {
    return res.status(400).json({ message: "Please provide a valid amount" });
  }

  if (senderId === recipientId) {
    return res.status(400).json({ message: "Cannot transfer points to yourself" });
  }

  try {
    const sender = await user.findById(senderId);
    const recipient = await user.findById(recipientId);

    if (!sender || !recipient) {
      return res.status(404).json({ message: "User not found" });
    }

    if (sender.points <= 10) {
      return res.status(400).json({
        message: "You need more than 10 points to transfer. Your current points: " + sender.points
      });
    }

    if (sender.points < amount) {
      return res.status(400).json({
        message: `Insufficient points. You have ${sender.points} points.`
      });
    }

    const maxTransfer = sender.points - 10;
    if (amount > maxTransfer) {
      return res.status(400).json({
        message: `You can transfer maximum ${maxTransfer} points (must keep at least 10).`
      });
    }

    sender.points -= amount;
    recipient.points += amount;

    await sender.save();
    await recipient.save();

    res.status(200).json({
      message: `Successfully transferred ${amount} points to ${recipient.name}`,
      senderPoints: sender.points,
      recipientPoints: recipient.points
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

// --- LANGUAGE CHANGE with OTP ---
export const initiateLanguageChange = async (req, res) => {
  const { id: userId } = req.params;
  const { language } = req.body;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ message: "Invalid user ID" });
  }

  if (!SUPPORTED_LANGUAGES.includes(language)) {
    return res.status(400).json({
      message: `Unsupported language. Supported: ${SUPPORTED_LANGUAGES.join(', ')}`
    });
  }

  try {
    const userData = await user.findById(userId);

    if (!userData) {
      return res.status(404).json({ message: "User not found" });
    }

    const sendToEmail = language === 'French';
    if (!sendToEmail && !isRegisteredMobile(userData.mobile)) {
      return res.status(400).json({
        message: "Mobile number not registered. Please update your profile to change to this language."
      });
    }

    const now = Date.now();
    const existingOtp = userData.languageOtp || {};
    const lastSentAt = existingOtp.lastSentAt ? new Date(existingOtp.lastSentAt).getTime() : 0;
    const resendCount = existingOtp.resendCount || 0;

    if (resendCount >= LANGUAGE_OTP_MAX_RESENDS) {
      return respondGenericOtp(res);
    }

    if (lastSentAt && now - lastSentAt < LANGUAGE_OTP_RESEND_COOLDOWN_MS) {
      return respondGenericOtp(res);
    }

    const otpCode = generateOTP();
    const otpHash = await bcrypt.hash(otpCode, 12);

    userData.languageOtp = {
      hash: otpHash,
      expiresAt: new Date(now + LANGUAGE_OTP_TTL_MS),
      attempts: 0,
      resendCount: resendCount + 1,
      lastSentAt: new Date(now)
    };

    await userData.save();

    const otpResult = sendToEmail
      ? await sendEmailOTP(userData.email, otpCode, `language change to ${language}`)
      : await sendSMSOTP(userData.mobile, otpCode, `language change to ${language}`);

    if (otpResult?.success === false) {
      userData.languageOtp = {
        hash: null,
        expiresAt: null,
        attempts: 0,
        resendCount,
        lastSentAt: new Date(now)
      };
      await userData.save();
      return res.status(500).json({ message: "Failed to send OTP. Please try again." });
    }

    return res.status(200).json({
      message: sendToEmail
        ? `OTP sent to your email (${userData.email}) for language change to French`
        : "OTP sent to your mobile for language change",
      otpSentTo: sendToEmail ? 'email' : 'sms',
      devOtp: process.env.NODE_ENV !== 'production' ? otpCode : undefined
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

export const confirmLanguageChange = async (req, res) => {
  const { id: userId } = req.params;
  const { otp, language } = req.body;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ message: "Invalid user ID" });
  }

  if (!otp) {
    return res.status(400).json({ message: "OTP is required" });
  }

  if (!SUPPORTED_LANGUAGES.includes(language)) {
    return res.status(400).json({ message: "Unsupported language" });
  }

  try {
    const userData = await user.findById(userId);

    if (!userData) {
      return res.status(400).json({ message: "Invalid or expired OTP." });
    }

    if (!userData.languageOtp || !userData.languageOtp.hash) {
      return res.status(400).json({ message: "Invalid or expired OTP." });
    }

    if (new Date() > new Date(userData.languageOtp.expiresAt)) {
      userData.languageOtp = { hash: null, expiresAt: null, attempts: 0, resendCount: 0, lastSentAt: null };
      await userData.save();
      return res.status(400).json({ message: "Invalid or expired OTP." });
    }

    if (userData.languageOtp.attempts >= LANGUAGE_OTP_MAX_ATTEMPTS) {
      userData.languageOtp = { hash: null, expiresAt: null, attempts: 0, resendCount: 0, lastSentAt: null };
      await userData.save();
      return res.status(400).json({ message: "Invalid or expired OTP." });
    }

    const isValidOtp = await bcrypt.compare(otp, userData.languageOtp.hash || "");
    if (!isValidOtp) {
      userData.languageOtp.attempts = (userData.languageOtp.attempts || 0) + 1;
      if (userData.languageOtp.attempts >= LANGUAGE_OTP_MAX_ATTEMPTS) {
        userData.languageOtp = { hash: null, expiresAt: null, attempts: 0, resendCount: 0, lastSentAt: null };
      }
      await userData.save();
      return res.status(400).json({ message: "Invalid or expired OTP." });
    }

    userData.language = language;
    userData.languageOtp = { hash: null, expiresAt: null, attempts: 0, resendCount: 0, lastSentAt: null };

    await userData.save();

    res.status(200).json({
      message: `Language successfully changed to ${language}`,
      language: userData.language
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

// --- GET LOGIN HISTORY ---
export const getLoginHistory = async (req, res) => {
  const { id: userId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ message: "Invalid user ID" });
  }

  try {
    const userData = await user.findById(userId).select('loginHistory');

    if (!userData) {
      return res.status(404).json({ message: "User not found" });
    }

    const sortedHistory = (userData.loginHistory || []).sort(
      (a, b) => new Date(b.loginAt) - new Date(a.loginAt)
    );

    res.status(200).json({
      data: sortedHistory,
      total: sortedHistory.length
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

// --- CURRENT USER ---
export const getCurrentUser = async (req, res) => {
  const userId = req.userid;

  if (!userId) {
    return res.status(401).json({ message: "Authentication required" });
  }

  try {
    const userData = await user.findById(userId).select("-password");
    if (!userData) {
      return res.status(404).json({ message: "User not found" });
    }

    await ensureFriendCode(userData);

    res.status(200).json({ data: userData });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

// --- FRIENDS BY CODE ---
export const addFriendByCode = async (req, res) => {
  const requesterId = req.userid;
  const { friendCode } = req.body || {};

  if (!requesterId) {
    return res.status(401).json({ message: "Authentication required" });
  }

  if (!friendCode || typeof friendCode !== 'string') {
    return res.status(400).json({ message: "Friend code is required" });
  }

  const normalizedCode = friendCode.trim().toUpperCase();

  try {
    const requester = await user.findById(requesterId);
    if (!requester) {
      return res.status(404).json({ message: "User not found" });
    }

    const target = await user.findOne({ friendCode: normalizedCode });
    if (!target) {
      return res.status(404).json({ message: "Friend code not found" });
    }

    const requesterIdStr = requester._id.toString();
    const targetIdStr = target._id.toString();

    if (requesterIdStr === targetIdStr) {
      return res.status(400).json({ message: "You cannot add yourself" });
    }

    // Check using Friendship model
    const existingFriendship = await Friendship.findOne({
      $or: [
        { requester: requesterId, recipient: targetIdStr },
        { requester: targetIdStr, recipient: requesterId }
      ]
    });

    if (existingFriendship) {
      if (existingFriendship.status === 'accepted') {
        return res.status(400).json({ message: "Already friends" });
      }
      if (existingFriendship.status === 'blocked') {
        return res.status(403).json({ message: "Cannot add this user" });
      }
      // If pending, accept the friendship (instant add by code)
      existingFriendship.status = 'accepted';
      existingFriendship.updatedAt = new Date();
      await existingFriendship.save();
    } else {
      // Create new accepted friendship (instant add by code)
      await Friendship.create({
        requester: requesterId,
        recipient: targetIdStr,
        status: 'accepted'
      });
    }

    // Get updated friend count from Friendship model
    const friendCount = await Friendship.countDocuments({
      $or: [
        { requester: requesterId, status: 'accepted' },
        { recipient: requesterId, status: 'accepted' }
      ]
    });

    res.status(200).json({
      message: `You're now friends with ${target.name}`,
      friendId: targetIdStr,
      friendName: target.name,
      friendCode: normalizedCode,
      friendCount,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

export const getFriendCount = async (req, res) => {
  const requesterId = req.userid;

  if (!requesterId) {
    return res.status(401).json({ message: "Authentication required" });
  }

  try {
    const requester = await user.findById(requesterId).select('friendCode name');
    if (!requester) {
      return res.status(404).json({ message: "User not found" });
    }

    await ensureFriendCode(requester);

    // Count friends from Friendship model
    const friendCount = await Friendship.countDocuments({
      $or: [
        { requester: requesterId, status: 'accepted' },
        { recipient: requesterId, status: 'accepted' }
      ]
    });

    res.status(200).json({
      count: friendCount,
      friendCode: requester.friendCode,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

// --- ADD/REMOVE FRIEND ---
export const addFriend = async (req, res) => {
  const { id: friendId } = req.params;
  const userId = req.userid;

  if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(friendId)) {
    return res.status(400).json({ message: "Invalid user ID" });
  }

  if (userId === friendId) {
    return res.status(400).json({ message: "Cannot add yourself as a friend" });
  }

  try {
    const friendData = await user.findById(friendId);
    if (!friendData) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check using Friendship model
    const existingFriendship = await Friendship.findOne({
      $or: [
        { requester: userId, recipient: friendId },
        { requester: friendId, recipient: userId }
      ]
    });

    if (existingFriendship) {
      if (existingFriendship.status === 'accepted') {
        return res.status(400).json({ message: "Already friends" });
      }
      if (existingFriendship.status === 'pending') {
        // If other user sent request, accept it
        if (existingFriendship.requester.toString() === friendId) {
          existingFriendship.status = 'accepted';
          existingFriendship.updatedAt = new Date();
          await existingFriendship.save();
        }
        return res.status(400).json({ message: "Friend request already pending" });
      }
      if (existingFriendship.status === 'blocked') {
        return res.status(403).json({ message: "Cannot add this user" });
      }
    }

    // Create new friendship (direct add = accepted)
    await Friendship.create({
      requester: userId,
      recipient: friendId,
      status: 'accepted'
    });

    // Get updated friend count
    const friendCount = await Friendship.countDocuments({
      $or: [
        { requester: userId, status: 'accepted' },
        { recipient: userId, status: 'accepted' }
      ]
    });

    res.status(200).json({
      message: `You are now friends with ${friendData.name}`,
      friendCount
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

export const removeFriend = async (req, res) => {
  const { id: friendId } = req.params;
  const userId = req.userid;

  if (!mongoose.Types.ObjectId.isValid(friendId)) {
    return res.status(400).json({ message: "Invalid user ID" });
  }

  try {
    const friendData = await user.findById(friendId);
    if (!friendData) {
      return res.status(404).json({ message: "User not found" });
    }

    // Remove friendship from Friendship model
    const deleted = await Friendship.findOneAndDelete({
      $or: [
        { requester: userId, recipient: friendId, status: 'accepted' },
        { requester: friendId, recipient: userId, status: 'accepted' }
      ]
    });

    if (!deleted) {
      return res.status(404).json({ message: "Friendship not found" });
    }

    // Get updated friend count
    const friendCount = await Friendship.countDocuments({
      $or: [
        { requester: userId, status: 'accepted' },
        { recipient: userId, status: 'accepted' }
      ]
    });

    res.status(200).json({
      message: `Removed ${friendData.name} from friends`,
      friendCount
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong" });
  }
};
