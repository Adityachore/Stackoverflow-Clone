import express from "express";
import { createPost, getFeed, likePost, commentPost, sharePost, getAllUsers } from "../controller/social.js";
import auth from "../middleware/auth.js";

const router = express.Router();

router.post("/post", auth, createPost);
router.get("/feed", getFeed);
router.get("/users/all", getAllUsers);
router.patch("/post/:id/like", auth, likePost);
router.patch("/post/:id/comment", auth, commentPost);
router.patch("/post/:id/share", auth, sharePost);

export default router;
