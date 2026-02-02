import mongoose from "mongoose";
import user from "../models/auth.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

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
  const { email, password } = req.body;
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
    
    res.status(200).json({ data: userResponse, token });
  } catch (error) {
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
