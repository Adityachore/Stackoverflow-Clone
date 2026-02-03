import Post from "../models/post.js";
import User from "../models/auth.js";
import mongoose from "mongoose";

export const createPost = async (req, res) => {
    const { description, mediaUrl, mediaType } = req.body;
    const userId = req.userid; // Assuming middleware sets this

    try {
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: "User not found" });

        const friendCount = user.friends.length;

        // Check Posting Limits based on Friends
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Count posts by this user created today
        const postsToday = await Post.countDocuments({
            userId,
            createdAt: { $gte: today }
        });

        let limit = 0;
        if (friendCount === 0) limit = 0;
        else if (friendCount === 1) limit = 1;
        else if (friendCount >= 2 && friendCount < 10) limit = 2;
        else if (friendCount >= 10) limit = Infinity;

        if (postsToday >= limit) {
            return res.status(403).json({
                message: `Posting limit reached. You have ${friendCount} friends and can post ${limit === Infinity ? 'Unlimited' : limit} times per day.`
            });
        }

        const newPost = new Post({
            userId,
            name: user.name,
            description,
            mediaUrl,
            mediaType
        });

        await newPost.save();
        res.status(201).json(newPost);
    } catch (error) {
        res.status(500).json({ message: "Something went wrong" });
    }
};

export const getFeed = async (req, res) => {
    try {
        const posts = await Post.find().sort({ createdAt: -1 });
        res.status(200).json(posts);
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
};

export const likePost = async (req, res) => {
    const { id } = req.params;
    const userId = req.userid;
    try {
        const post = await Post.findById(id);
        if (!post) return res.status(404).json({ message: "Post not found" });

        const index = post.likes.findIndex((id) => id === String(userId));
        if (index === -1) {
            post.likes.push(userId);
        } else {
            post.likes = post.likes.filter((id) => id !== String(userId));
        }
        await Post.findByIdAndUpdate(id, post, { new: true });

        // Reward Logic: +5 points if likes reach 5 (one-time bonus check could be more complex, simplification here)
        if (post.likes.length === 5) {
            const author = await User.findById(post.userId);
            if (author) {
                author.points += 5;
                await author.save();
            }
        }

        res.status(200).json(post);
    } catch (error) {
        res.status(500).json({ message: "Something went wrong" });
    }
}


export const commentPost = async (req, res) => {
    const { id } = req.params;
    const { commentBody } = req.body;
    const userId = req.userid;

    try {
        const post = await Post.findById(id);
        const user = await User.findById(userId);

        if (!post) return res.status(404).json({ message: "Post not found" });

        post.comments.push({
            userId,
            user: user.name,
            comment: commentBody,
            postedOn: new Date()
        });

        await Post.findByIdAndUpdate(id, post, { new: true });
        res.status(200).json(post);
    } catch (error) {
        res.status(500).json({ message: "Something went wrong" });
    }
}

export const sharePost = async (req, res) => {
    const { id } = req.params;
    try {
        const post = await Post.findById(id);
        if (!post) return res.status(404).json({ message: "Post not found" });

        post.sharedCount += 1;
        await Post.findByIdAndUpdate(id, post, { new: true });
        res.status(200).json(post);
    } catch (error) {
        res.status(500).json({ message: "Something went wrong" });
    }
}

export const getAllUsers = async (req, res) => {
    try {
        const users = await User.find().select('name _id avatar about friends');
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
