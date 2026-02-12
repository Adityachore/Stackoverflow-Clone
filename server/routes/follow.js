import express from "express";
import auth from "../middleware/auth.js";
import {
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing,
  getFollowCounts,
  checkFollowStatus,
  getSuggestedUsers
} from "../controller/follow.js";

const router = express.Router();

// Follow/Unfollow
router.post("/:userId", auth, followUser);
router.delete("/:userId", auth, unfollowUser);

// Get followers and following
router.get("/followers/:userId", getFollowers);
router.get("/following/:userId", getFollowing);
router.get("/counts/:userId", getFollowCounts);

// Check follow status (requires auth)
router.get("/status/:userId", auth, checkFollowStatus);

// Suggested users to follow
router.get("/suggested", auth, getSuggestedUsers);

export default router;
