import express from "express";
import auth from "../middleware/auth.js";
import {
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  removeFriend,
  getPendingRequests,
  getSentRequests,
  getFriendsList,
  blockUser,
  unblockUser,
  getBlockedUsers,
  getMutualFriends,
  getFriendshipStatus
} from "../controller/friends.js";

const router = express.Router();

// Friend Requests
router.post("/request/:userId", auth, sendFriendRequest);
router.put("/accept/:userId", auth, acceptFriendRequest);
router.put("/reject/:userId", auth, rejectFriendRequest);
router.delete("/remove/:userId", auth, removeFriend);
router.get("/requests/pending", auth, getPendingRequests);
router.get("/requests/sent", auth, getSentRequests);
router.get("/list", auth, getFriendsList);

// Block System
router.post("/block/:userId", auth, blockUser);
router.delete("/unblock/:userId", auth, unblockUser);
router.get("/blocked", auth, getBlockedUsers);

// Mutual Friends
router.get("/mutual/:userId", auth, getMutualFriends);

// Friendship Status
router.get("/status/:userId", auth, getFriendshipStatus);

export default router;
