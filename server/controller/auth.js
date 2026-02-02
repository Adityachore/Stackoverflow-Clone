import mongoose from "mongoose";
import user from "../models/auth.js";
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

export const Signup = async (req, res) => {
  const { name, email, password, mobile } = req.body;
  
  // Validate password strength
  if (!password || password.length < 8) {
    return res.status(400).json({ message: "Password must be at least 8 characters" });
  }
  
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  
  if (!hasLetter || !hasNumber) {
    return res.status(400).json({ message: "Password must contain at least 1 letter and 1 number" });
  }
  
  try {
    const exisitinguser = await user.findOne({ email });
    if (exisitinguser) {
      return res.status(404).json({ message: "User already exist" });
    }
    const hashpassword = await bcrypt.hash(password, 12);
    const newuser = await user.create({
      name,
      email,
      password: hashpassword,
      mobile: mobile || '',
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

  try {
    const exisitinguser = await user.findOne({ email });
    if (!exisitinguser) {
      return res.status(404).json({ message: "No account found with this email. Please sign up first." });
    }

    const ispasswordcrct = await bcrypt.compare(password, exisitinguser.password);
    if (!ispasswordcrct) {
      return res.status(400).json({ message: "Invalid password" });
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
        // Generate and send OTP
        const otpCode = generateOTP();
        exisitinguser.otp = {
          code: otpCode,
          expiresAt: new Date(Date.now() + 5 * 60 * 1000) // 5 minutes
        };
        await exisitinguser.save();

        await sendEmailOTP(exisitinguser.email, otpCode, 'login verification');

        return res.status(200).json({
          message: "OTP sent to your email for verification",
          requiresOTP: true,
          otpSentTo: 'email',
          browser
        });
      }

      // Verify OTP
      if (!exisitinguser.otp || !exisitinguser.otp.code) {
        return res.status(400).json({ message: "Please request OTP first" });
      }

      if (new Date() > new Date(exisitinguser.otp.expiresAt)) {
        return res.status(400).json({ message: "OTP has expired. Please request a new one." });
      }

      if (exisitinguser.otp.code !== otp) {
        return res.status(400).json({ message: "Invalid OTP" });
      }

      // Clear OTP after successful verification
      exisitinguser.otp = { code: null, expiresAt: null };
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
    
    res.status(200).json({ data: userData });
  } catch (error) {
    res.status(500).json("something went wrong..");
    return;
  }
};

export const updateprofile = async (req, res) => {
  const { id: _id } = req.params;
  const { name, about, tags, location, website } = req.body.editForm;
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

    const otpCode = generateOTP();
    userData.otp = {
      code: otpCode,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000)
    };

    await userData.save();

    if (language === 'French') {
      await sendEmailOTP(userData.email, otpCode, `language change to ${language}`);
      res.status(200).json({
        message: `OTP sent to your email (${userData.email}) for language change to French`,
        otpSentTo: 'email'
      });
    } else {
      if (!userData.mobile) {
        return res.status(400).json({
          message: "Mobile number not registered. Please update your profile to change to this language."
        });
      }
      await sendSMSOTP(userData.mobile, otpCode, `language change to ${language}`);
      res.status(200).json({
        message: `OTP sent to your mobile for language change`,
        otpSentTo: 'sms'
      });
    }

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
      return res.status(404).json({ message: "User not found" });
    }

    if (!userData.otp || !userData.otp.code) {
      return res.status(400).json({ message: "Please request OTP first" });
    }

    if (new Date() > new Date(userData.otp.expiresAt)) {
      return res.status(400).json({ message: "OTP has expired. Please request a new one." });
    }

    if (userData.otp.code !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    userData.language = language;
    userData.otp = { code: null, expiresAt: null };

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

// --- ADD/REMOVE FRIEND ---
export const addFriend = async (req, res) => {
  const { id: userId } = req.params;
  const { friendId } = req.body;

  if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(friendId)) {
    return res.status(400).json({ message: "Invalid user ID" });
  }

  if (userId === friendId) {
    return res.status(400).json({ message: "Cannot add yourself as a friend" });
  }

  try {
    const userData = await user.findById(userId);
    const friendData = await user.findById(friendId);

    if (!userData || !friendData) {
      return res.status(404).json({ message: "User not found" });
    }

    if (userData.friends.includes(friendId)) {
      return res.status(400).json({ message: "Already friends" });
    }

    userData.friends.push(friendId);
    friendData.friends.push(userId);

    await userData.save();
    await friendData.save();

    res.status(200).json({
      message: `You are now friends with ${friendData.name}`,
      friendCount: userData.friends.length
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

export const removeFriend = async (req, res) => {
  const { id: userId } = req.params;
  const { friendId } = req.body;

  if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(friendId)) {
    return res.status(400).json({ message: "Invalid user ID" });
  }

  try {
    const userData = await user.findById(userId);
    const friendData = await user.findById(friendId);

    if (!userData || !friendData) {
      return res.status(404).json({ message: "User not found" });
    }

    userData.friends = userData.friends.filter(f => f !== friendId);
    friendData.friends = friendData.friends.filter(f => f !== userId);

    await userData.save();
    await friendData.save();

    res.status(200).json({
      message: `Removed ${friendData.name} from friends`,
      friendCount: userData.friends.length
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong" });
  }
};
