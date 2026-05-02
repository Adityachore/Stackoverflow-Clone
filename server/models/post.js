import mongoose from "mongoose";

const postSchema = mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },
    name: { type: String, required: true },
    description: { type: String, required: true },
    mediaUrl: { type: String, default: "" }, // For images/videos
    mediaType: { type: String, default: "" }, // 'image' or 'video'
    likes: { type: [String], default: [] },
    comments: [
        {
            userId: String,
            user: String,
            comment: String,
            postedOn: { type: Date, default: Date.now }
        }
    ],
    sharedCount: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Post", postSchema);
