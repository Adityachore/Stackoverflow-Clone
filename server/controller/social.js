import Post from "../models/post.js";
import User from "../models/auth.js";
import Friendship from "../models/friendship.js";
import mongoose from "mongoose";

export const createPost = async (req, res) => {
    const { description, mediaUrl, mediaType } = req.body;
    const userId = req.userid; // Assuming middleware sets this

    try {
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: "User not found" });

        // Count friends from Friendship model
        const friendCount = await Friendship.countDocuments({
            $or: [
                { requester: userId, status: 'accepted' },
                { recipient: userId, status: 'accepted' }
            ]
        });

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
    const userId = req.userid;
    
    try {
        // If user is logged in, show only posts from accepted friends + own posts
        if (userId) {
            // Get accepted friends
            const friendships = await Friendship.find({
                $or: [
                    { requester: userId, status: 'accepted' },
                    { recipient: userId, status: 'accepted' }
                ]
            });

            // Extract friend IDs
            const friendIds = friendships.map(f => {
                return f.requester.toString() === userId 
                    ? f.recipient.toString() 
                    : f.requester.toString();
            });

            // Include own userId to see own posts
            const allowedUserIds = [userId, ...friendIds];

            const posts = await Post.find({ userId: { $in: allowedUserIds } })
                .sort({ createdAt: -1 });
            
            return res.status(200).json(posts);
        }

        // If not logged in, return empty (no posts visible)
        res.status(200).json([]);
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
        const users = await User.find().select('name _id avatar about reputation');
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Upload media (base64 encoded image/video)
export const uploadMedia = async (req, res) => {
    const { mediaData, mediaType } = req.body;
    const userId = req.userid;

    try {
        if (!mediaData) {
            return res.status(400).json({ message: "No media data provided" });
        }

        // Validate media type
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm'];
        if (mediaType && !allowedTypes.some(t => mediaType.includes(t.split('/')[1]))) {
            return res.status(400).json({ message: "Invalid media type" });
        }

        // For base64 uploads, just return the data URL
        // In production, you'd upload to cloud storage (S3, Cloudinary, etc.)
        res.status(200).json({ 
            mediaUrl: mediaData,
            mediaType: mediaType || 'image'
        });
    } catch (error) {
        console.error("Upload error:", error);
        res.status(500).json({ message: "Failed to upload media" });
    }
};
