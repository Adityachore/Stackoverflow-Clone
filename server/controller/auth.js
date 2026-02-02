import mongoose from "mongoose";
import user from "../models/auth.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { UAParser } from "ua-parser-js";
import moment from "moment-timezone";

export const Signup = async (req, res) => {
  const { name, email, password } = req.body;

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
  const userAgentString = req.headers['user-agent'];
  const parser = new UAParser(userAgentString);
  const result = parser.getResult();
  const browserName = result.browser.name;
  const osName = result.os.name;
  const deviceType = result.device.type; // 'mobile', 'tablet', undefined (desktop)

  try {
    const exisitinguser = await user.findOne({ email });
    if (!exisitinguser) {
      return res.status(404).json({ message: "No account found with this email. Please sign up first." });
    }

    const ispasswordcrct = await bcrypt.compare(
      password,
      exisitinguser.password
    );
    if (!ispasswordcrct) {
      return res.status(400).json({ message: "Invalid password" });
    }

    // --- Conditional Auth Logic ---
    const now = moment().tz("Asia/Kolkata");

    // 1. Mobile Restriction (10 AM - 1 PM IST)
    if (deviceType === 'mobile' || deviceType === 'tablet') {
      const currentHour = now.hour();
      if (currentHour < 10 || currentHour >= 13) {
        return res.status(403).json({ message: "Mobile logins are only allowed between 10:00 AM and 1:00 PM IST." });
      }
    }

    // 2. Google Chrome -> OTP Required
    // If otp is provided, verify it. If not, generate and send it.
    if (browserName === 'Chrome' && !otp) {
      // Generate OTP
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      exisitinguser.otp = {
        code,
        expiresAt: moment().add(5, 'minutes').toDate()
      };
      await exisitinguser.save();

      console.log(`[Mock SMS/Email] OTP for Chrome Login (${email}): ${code}`);

      return res.status(200).json({
        message: "OTP required for Chrome login.",
        requiresOtp: true
      });
    }

    if (browserName === 'Chrome' && otp) {
      if (!exisitinguser.otp || exisitinguser.otp.code !== otp || new Date() > exisitinguser.otp.expiresAt) {
        return res.status(400).json({ message: "Invalid or expired OTP" });
      }
      // OTC verified, clear it
      exisitinguser.otp = undefined;
    }

    // 3. Microsoft Browser -> Direct allowed (implied by falling through)

    // Update login history
    exisitinguser.loginHistory.push({
      browser: browserName,
      os: osName,
      device: deviceType || 'desktop',
      ip: req.ip,
      loginAt: new Date()
    });

    // Update last seen
    exisitinguser.lastSeen = new Date();
    await exisitinguser.save();

    const token = jwt.sign(
      { email: exisitinguser.email, id: exisitinguser._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Remove password from response
    const userResponse = exisitinguser.toObject();
    delete userResponse.password;
    delete userResponse.otp;
    delete userResponse.loginHistory; // Don't send full history on login return, maybe too large

    res.status(200).json({ data: userResponse, token });
  } catch (error) {
    console.log(error);
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

export const forgotPassword = async (req, res) => {
  const { email, mobile } = req.body;
  try {
    const existingUser = await user.findOne({
      $or: [{ email: email }, { mobile: mobile }]
    });

    if (!existingUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check Daily Limit
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let resetData = existingUser.lastPasswordReset || { count: 0, date: null };

    if (resetData.date) {
      const resetDate = new Date(resetData.date);
      resetDate.setHours(0, 0, 0, 0);

      if (resetDate.getTime() === today.getTime()) {
        if (resetData.count >= 1) {
          return res.status(400).json({
            message: "Warning: Password reset limit reached. You can only reset your password once per day."
          });
        }
      } else {
        // New day, reset count
        resetData.count = 0;
      }
    } else {
      resetData.count = 0;
    }

    // Generate Random Password (Upper + Lower case only)
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let newPassword = "";
    for (let i = 0; i < 10; i++) {
      newPassword += charset.charAt(Math.floor(Math.random() * charset.length));
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    existingUser.password = hashedPassword;
    existingUser.lastPasswordReset = {
      date: new Date(),
      count: resetData.count + 1
    };

    await existingUser.save();

    // Mock Sending Email/SMS
    console.log(`[Mock Service] Password Reset for ${existingUser.email}. New Password: ${newPassword}`);

    res.status(200).json({ message: "Password reset successful. Check your email/phone." });

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

export const transferPoints = async (req, res) => {
  const { id: senderId } = req.params; // or req.userid if self
  const { recipientId, amount } = req.body;

  if (amount <= 0) return res.status(400).json({ message: "Invalid amount" });

  try {
    const sender = await user.findById(senderId);
    const recipient = await user.findById(recipientId);

    if (!sender || !recipient) return res.status(404).json({ message: "User not found" });

    if (sender.points <= 10) {
      return res.status(400).json({ message: "You must have more than 10 points to transfer." });
    }

    if (sender.points < amount) {
      return res.status(400).json({ message: "Insufficient points." });
    }

    sender.points -= amount;
    recipient.points += Number(amount); // Ensure number

    await sender.save();
    await recipient.save();

    res.status(200).json({ message: "Points transferred successfully", balance: sender.points });

  } catch (error) {
    res.status(500).json({ message: "Something went wrong" });
  }
};

export const initiateLanguageChange = async (req, res) => {
  const { id } = req.params;
  const { language } = req.body;

  try {
    const userDoc = await user.findById(id);
    if (!userDoc) return res.status(404).json({ message: "User not found" });

    // Generate OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    userDoc.otp = {
      code,
      expiresAt: moment().add(5, 'minutes').toDate()
    };

    await userDoc.save();

    if (language === 'French') {
      console.log(`[Mock Email] OTP for Language Change (French) to ${userDoc.email}: ${code}`);
      res.status(200).json({ message: `OTP sent to email (Required for ${language}).` });
    } else {
      console.log(`[Mock SMS] OTP for Language Change (${language}) to ${userDoc.mobile || 'Registered Mobile'}: ${code}`);
      res.status(200).json({ message: "OTP sent to mobile." });
    }

  } catch (error) {
    res.status(500).json({ message: "Something went wrong" });
  }
};

export const confirmLanguageChange = async (req, res) => {
  const { id } = req.params;
  const { otp, language } = req.body;

  try {
    const userDoc = await user.findById(id);
    if (!userDoc) return res.status(404).json({ message: "User not found" });

    if (!userDoc.otp || userDoc.otp.code !== otp || new Date() > userDoc.otp.expiresAt) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    userDoc.language = language;
    userDoc.otp = undefined; // Clear OTP

    await userDoc.save();

    res.status(200).json({ message: `Language successfully changed to ${language}` });

  } catch (error) {
    res.status(500).json({ message: "Something went wrong" });
  }
};
