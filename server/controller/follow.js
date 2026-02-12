import Follow from "../models/follow.js";
import Friendship from "../models/friendship.js";
import User from "../models/auth.js";
import mongoose from "mongoose";

// Follow a user
export const followUser = async (req, res) => {
  const { userId } = req.params;
  const followerId = req.userid;

  try {
    // Can't follow yourself
    if (userId === followerId) {
      return res.status(400).json({ message: "Cannot follow yourself" });
    }

    // Check if user exists
    const userToFollow = await User.findById(userId);
    if (!userToFollow) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if blocked
    const blocked = await Friendship.findOne({
      $or: [
        { requester: followerId, recipient: userId, status: 'blocked' },
        { requester: userId, recipient: followerId, status: 'blocked' }
      ]
    });

    if (blocked) {
      return res.status(403).json({ message: "Cannot follow this user" });
    }

    // Check if already following
    const existingFollow = await Follow.findOne({
      follower: followerId,
      following: userId
    });

    if (existingFollow) {
      return res.status(400).json({ message: "Already following this user" });
    }

    // Create follow relationship
    const follow = new Follow({
      follower: followerId,
      following: userId
    });

    await follow.save();

    // TODO: Send notification to the followed user

    res.status(201).json({ message: "Successfully followed user", follow });
  } catch (error) {
    console.error("Follow user error:", error);
    res.status(500).json({ message: "Something went wrong", error: error.message });
  }
};

// Unfollow a user
export const unfollowUser = async (req, res) => {
  const { userId } = req.params;
  const followerId = req.userid;

  try {
    const follow = await Follow.findOneAndDelete({
      follower: followerId,
      following: userId
    });

    if (!follow) {
      return res.status(404).json({ message: "Not following this user" });
    }

    res.status(200).json({ message: "Successfully unfollowed user" });
  } catch (error) {
    console.error("Unfollow user error:", error);
    res.status(500).json({ message: "Something went wrong", error: error.message });
  }
};

// Get user's followers
export const getFollowers = async (req, res) => {
  const { userId } = req.params;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  try {
    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const followers = await Follow.find({ following: userId })
      .populate('follower', 'name email avatar reputation lastSeen')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Follow.countDocuments({ following: userId });

    // If current user is logged in, check if they follow each follower
    const currentUserId = req.userid;
    let followersWithStatus = followers.map(f => f.follower.toObject());

    if (currentUserId) {
      const currentUserFollowing = await Follow.find({
        follower: currentUserId,
        following: { $in: followersWithStatus.map(f => f._id) }
      });

      const followingIds = currentUserFollowing.map(f => f.following.toString());

      followersWithStatus = followersWithStatus.map(f => ({
        ...f,
        isFollowing: followingIds.includes(f._id.toString())
      }));
    }

    res.status(200).json({
      followers: followersWithStatus,
      pagination: {
        current: page,
        total: Math.ceil(total / limit),
        count: total
      }
    });
  } catch (error) {
    console.error("Get followers error:", error);
    res.status(500).json({ message: "Something went wrong", error: error.message });
  }
};

// Get who user follows
export const getFollowing = async (req, res) => {
  const { userId } = req.params;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  try {
    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const following = await Follow.find({ follower: userId })
      .populate('following', 'name email avatar reputation lastSeen')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Follow.countDocuments({ follower: userId });

    // If current user is logged in, check if they follow each user
    const currentUserId = req.userid;
    let followingWithStatus = following.map(f => f.following.toObject());

    if (currentUserId) {
      const currentUserFollowing = await Follow.find({
        follower: currentUserId,
        following: { $in: followingWithStatus.map(f => f._id) }
      });

      const followingIds = currentUserFollowing.map(f => f.following.toString());

      followingWithStatus = followingWithStatus.map(f => ({
        ...f,
        isFollowing: followingIds.includes(f._id.toString())
      }));
    }

    res.status(200).json({
      following: followingWithStatus,
      pagination: {
        current: page,
        total: Math.ceil(total / limit),
        count: total
      }
    });
  } catch (error) {
    console.error("Get following error:", error);
    res.status(500).json({ message: "Something went wrong", error: error.message });
  }
};

// Get follow counts for a user
export const getFollowCounts = async (req, res) => {
  const { userId } = req.params;

  try {
    const followersCount = await Follow.countDocuments({ following: userId });
    const followingCount = await Follow.countDocuments({ follower: userId });

    res.status(200).json({
      followers: followersCount,
      following: followingCount
    });
  } catch (error) {
    console.error("Get follow counts error:", error);
    res.status(500).json({ message: "Something went wrong", error: error.message });
  }
};

// Check if current user follows a specific user
export const checkFollowStatus = async (req, res) => {
  const { userId } = req.params;
  const currentUserId = req.userid;

  try {
    if (userId === currentUserId) {
      return res.status(200).json({ isFollowing: false, isFollowedBy: false, isSelf: true });
    }

    const [isFollowing, isFollowedBy] = await Promise.all([
      Follow.findOne({ follower: currentUserId, following: userId }),
      Follow.findOne({ follower: userId, following: currentUserId })
    ]);

    res.status(200).json({
      isFollowing: !!isFollowing,
      isFollowedBy: !!isFollowedBy,
      isMutual: !!isFollowing && !!isFollowedBy
    });
  } catch (error) {
    console.error("Check follow status error:", error);
    res.status(500).json({ message: "Something went wrong", error: error.message });
  }
};

// Get suggested users to follow
export const getSuggestedUsers = async (req, res) => {
  const currentUserId = req.userid;
  const limit = parseInt(req.query.limit) || 10;

  try {
    // Get users the current user already follows
    const following = await Follow.find({ follower: currentUserId }).select('following');
    const followingIds = following.map(f => f.following.toString());

    // Get blocked users
    const blocked = await Friendship.find({
      $or: [
        { requester: currentUserId, status: 'blocked' },
        { recipient: currentUserId, status: 'blocked' }
      ]
    });

    const blockedIds = blocked.map(b => {
      return b.requester.toString() === currentUserId 
        ? b.recipient.toString() 
        : b.requester.toString();
    });

    // Exclude current user, users already followed, and blocked users
    const excludeIds = [currentUserId, ...followingIds, ...blockedIds];

    // Get suggested users based on:
    // 1. Users with high reputation
    // 2. Recently active users
    const suggestedUsers = await User.find({
      _id: { $nin: excludeIds }
    })
    .select('name email avatar reputation lastSeen questionsCount answersCount')
    .sort({ reputation: -1, lastSeen: -1 })
    .limit(limit);

    res.status(200).json(suggestedUsers);
  } catch (error) {
    console.error("Get suggested users error:", error);
    res.status(500).json({ message: "Something went wrong", error: error.message });
  }
};
