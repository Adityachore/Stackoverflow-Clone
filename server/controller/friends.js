import Friendship from "../models/friendship.js";
import Follow from "../models/follow.js";
import User from "../models/auth.js";
import mongoose from "mongoose";

// Send friend request
export const sendFriendRequest = async (req, res) => {
  const { userId } = req.params;
  const requesterId = req.userid;

  try {
    // Can't send request to yourself
    if (userId === requesterId) {
      return res.status(400).json({ message: "Cannot send friend request to yourself" });
    }

    // Check if recipient exists
    const recipient = await User.findById(userId);
    if (!recipient) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if already friends or request pending (in either direction)
    const existingFriendship = await Friendship.findOne({
      $or: [
        { requester: requesterId, recipient: userId },
        { requester: userId, recipient: requesterId }
      ]
    });

    if (existingFriendship) {
      if (existingFriendship.status === 'accepted') {
        return res.status(400).json({ message: "Already friends with this user" });
      }
      if (existingFriendship.status === 'pending') {
        // If the other user sent us a request, auto-accept it
        if (existingFriendship.requester.toString() === userId) {
          existingFriendship.status = 'accepted';
          existingFriendship.updatedAt = new Date();
          await existingFriendship.save();
          return res.status(200).json({ message: "Friend request accepted", friendship: existingFriendship });
        }
        return res.status(400).json({ message: "Friend request already sent" });
      }
      if (existingFriendship.status === 'blocked') {
        // Check who blocked whom
        if (existingFriendship.blockedBy?.toString() === userId) {
          return res.status(403).json({ message: "Cannot send friend request to this user" });
        }
        return res.status(400).json({ message: "You have blocked this user. Unblock them first." });
      }
    }

    // Create new friend request
    const friendship = new Friendship({
      requester: requesterId,
      recipient: userId,
      status: 'pending'
    });

    await friendship.save();

    // TODO: Send notification to recipient

    res.status(201).json({ message: "Friend request sent", friendship });
  } catch (error) {
    console.error("Send friend request error:", error);
    res.status(500).json({ message: "Something went wrong", error: error.message });
  }
};

// Accept friend request
export const acceptFriendRequest = async (req, res) => {
  const { userId } = req.params; // userId of the requester
  const recipientId = req.userid;

  try {
    const friendship = await Friendship.findOne({
      requester: userId,
      recipient: recipientId,
      status: 'pending'
    });

    if (!friendship) {
      return res.status(404).json({ message: "Friend request not found" });
    }

    friendship.status = 'accepted';
    friendship.updatedAt = new Date();
    await friendship.save();

    // Auto-follow each other (optional - based on requirements)
    await Follow.findOneAndUpdate(
      { follower: recipientId, following: userId },
      { follower: recipientId, following: userId },
      { upsert: true, new: true }
    );
    await Follow.findOneAndUpdate(
      { follower: userId, following: recipientId },
      { follower: userId, following: recipientId },
      { upsert: true, new: true }
    );

    // TODO: Notify requester that request was accepted

    res.status(200).json({ message: "Friend request accepted", friendship });
  } catch (error) {
    console.error("Accept friend request error:", error);
    res.status(500).json({ message: "Something went wrong", error: error.message });
  }
};

// Reject friend request
export const rejectFriendRequest = async (req, res) => {
  const { userId } = req.params; // userId of the requester
  const recipientId = req.userid;

  try {
    const friendship = await Friendship.findOneAndDelete({
      requester: userId,
      recipient: recipientId,
      status: 'pending'
    });

    if (!friendship) {
      return res.status(404).json({ message: "Friend request not found" });
    }

    res.status(200).json({ message: "Friend request rejected" });
  } catch (error) {
    console.error("Reject friend request error:", error);
    res.status(500).json({ message: "Something went wrong", error: error.message });
  }
};

// Remove friend (unfriend)
export const removeFriend = async (req, res) => {
  const { userId } = req.params;
  const currentUserId = req.userid;

  try {
    const friendship = await Friendship.findOneAndDelete({
      $or: [
        { requester: currentUserId, recipient: userId, status: 'accepted' },
        { requester: userId, recipient: currentUserId, status: 'accepted' }
      ]
    });

    if (!friendship) {
      return res.status(404).json({ message: "Friendship not found" });
    }

    // Optionally remove follow relationships
    await Follow.deleteMany({
      $or: [
        { follower: currentUserId, following: userId },
        { follower: userId, following: currentUserId }
      ]
    });

    res.status(200).json({ message: "Friend removed successfully" });
  } catch (error) {
    console.error("Remove friend error:", error);
    res.status(500).json({ message: "Something went wrong", error: error.message });
  }
};

// Get pending friend requests (received)
export const getPendingRequests = async (req, res) => {
  const userId = req.userid;

  try {
    const pendingRequests = await Friendship.find({
      recipient: userId,
      status: 'pending'
    }).populate('requester', 'name email avatar reputation');

    res.status(200).json(pendingRequests);
  } catch (error) {
    console.error("Get pending requests error:", error);
    res.status(500).json({ message: "Something went wrong", error: error.message });
  }
};

// Get sent friend requests (outgoing)
export const getSentRequests = async (req, res) => {
  const userId = req.userid;

  try {
    const sentRequests = await Friendship.find({
      requester: userId,
      status: 'pending'
    }).populate('recipient', 'name email avatar reputation');

    res.status(200).json(sentRequests);
  } catch (error) {
    console.error("Get sent requests error:", error);
    res.status(500).json({ message: "Something went wrong", error: error.message });
  }
};

// Get all friends
export const getFriendsList = async (req, res) => {
  const userId = req.userid;

  try {
    const friendships = await Friendship.find({
      $or: [
        { requester: userId, status: 'accepted' },
        { recipient: userId, status: 'accepted' }
      ]
    })
    .populate('requester', 'name email avatar reputation lastSeen')
    .populate('recipient', 'name email avatar reputation lastSeen');

    // Extract friends (the other user in each friendship)
    const friends = friendships.map(f => {
      if (f.requester._id.toString() === userId) {
        return { ...f.recipient.toObject(), friendshipId: f._id, friendSince: f.updatedAt };
      } else {
        return { ...f.requester.toObject(), friendshipId: f._id, friendSince: f.updatedAt };
      }
    });

    res.status(200).json(friends);
  } catch (error) {
    console.error("Get friends list error:", error);
    res.status(500).json({ message: "Something went wrong", error: error.message });
  }
};

// Block a user
export const blockUser = async (req, res) => {
  const { userId } = req.params;
  const currentUserId = req.userid;

  try {
    if (userId === currentUserId) {
      return res.status(400).json({ message: "Cannot block yourself" });
    }

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check for existing friendship
    let friendship = await Friendship.findOne({
      $or: [
        { requester: currentUserId, recipient: userId },
        { requester: userId, recipient: currentUserId }
      ]
    });

    if (friendship) {
      // Update existing record to blocked
      friendship.status = 'blocked';
      friendship.blockedBy = currentUserId;
      friendship.updatedAt = new Date();
      await friendship.save();
    } else {
      // Create new blocked relationship
      friendship = new Friendship({
        requester: currentUserId,
        recipient: userId,
        status: 'blocked',
        blockedBy: currentUserId
      });
      await friendship.save();
    }

    // Remove follow relationships
    await Follow.deleteMany({
      $or: [
        { follower: currentUserId, following: userId },
        { follower: userId, following: currentUserId }
      ]
    });

    res.status(200).json({ message: "User blocked successfully" });
  } catch (error) {
    console.error("Block user error:", error);
    res.status(500).json({ message: "Something went wrong", error: error.message });
  }
};

// Unblock a user
export const unblockUser = async (req, res) => {
  const { userId } = req.params;
  const currentUserId = req.userid;

  try {
    const friendship = await Friendship.findOneAndDelete({
      $or: [
        { requester: currentUserId, recipient: userId, status: 'blocked', blockedBy: currentUserId },
        { requester: userId, recipient: currentUserId, status: 'blocked', blockedBy: currentUserId }
      ]
    });

    if (!friendship) {
      return res.status(404).json({ message: "Block relationship not found or you didn't block this user" });
    }

    res.status(200).json({ message: "User unblocked successfully" });
  } catch (error) {
    console.error("Unblock user error:", error);
    res.status(500).json({ message: "Something went wrong", error: error.message });
  }
};

// Get blocked users list
export const getBlockedUsers = async (req, res) => {
  const userId = req.userid;

  try {
    const blockedRelationships = await Friendship.find({
      status: 'blocked',
      blockedBy: userId
    })
    .populate('requester', 'name email avatar')
    .populate('recipient', 'name email avatar');

    // Extract blocked users
    const blockedUsers = blockedRelationships.map(f => {
      if (f.requester._id.toString() === userId) {
        return { ...f.recipient.toObject(), blockedAt: f.updatedAt };
      } else {
        return { ...f.requester.toObject(), blockedAt: f.updatedAt };
      }
    });

    res.status(200).json(blockedUsers);
  } catch (error) {
    console.error("Get blocked users error:", error);
    res.status(500).json({ message: "Something went wrong", error: error.message });
  }
};

// Get mutual friends with a user
export const getMutualFriends = async (req, res) => {
  const { userId } = req.params;
  const currentUserId = req.userid;

  try {
    // Get current user's friends
    const currentUserFriendships = await Friendship.find({
      $or: [
        { requester: currentUserId, status: 'accepted' },
        { recipient: currentUserId, status: 'accepted' }
      ]
    });

    const currentUserFriendIds = currentUserFriendships.map(f => {
      return f.requester.toString() === currentUserId 
        ? f.recipient.toString() 
        : f.requester.toString();
    });

    // Get target user's friends
    const targetUserFriendships = await Friendship.find({
      $or: [
        { requester: userId, status: 'accepted' },
        { recipient: userId, status: 'accepted' }
      ]
    });

    const targetUserFriendIds = targetUserFriendships.map(f => {
      return f.requester.toString() === userId 
        ? f.recipient.toString() 
        : f.requester.toString();
    });

    // Find mutual friends
    const mutualFriendIds = currentUserFriendIds.filter(id => 
      targetUserFriendIds.includes(id)
    );

    // Get user details for mutual friends
    const mutualFriends = await User.find({
      _id: { $in: mutualFriendIds }
    }).select('name email avatar reputation');

    res.status(200).json(mutualFriends);
  } catch (error) {
    console.error("Get mutual friends error:", error);
    res.status(500).json({ message: "Something went wrong", error: error.message });
  }
};

// Get friendship status between current user and another user
export const getFriendshipStatus = async (req, res) => {
  const { userId } = req.params;
  const currentUserId = req.userid;

  try {
    if (userId === currentUserId) {
      return res.status(200).json({ status: 'self' });
    }

    const friendship = await Friendship.findOne({
      $or: [
        { requester: currentUserId, recipient: userId },
        { requester: userId, recipient: currentUserId }
      ]
    });

    if (!friendship) {
      return res.status(200).json({ status: 'none' });
    }

    let response = {
      status: friendship.status,
      friendshipId: friendship._id
    };

    if (friendship.status === 'pending') {
      response.direction = friendship.requester.toString() === currentUserId ? 'outgoing' : 'incoming';
    }

    if (friendship.status === 'blocked') {
      response.blockedBy = friendship.blockedBy?.toString() === currentUserId ? 'me' : 'them';
    }

    res.status(200).json(response);
  } catch (error) {
    console.error("Get friendship status error:", error);
    res.status(500).json({ message: "Something went wrong", error: error.message });
  }
};
