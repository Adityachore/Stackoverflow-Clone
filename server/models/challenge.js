import mongoose from "mongoose";

const challengeSchema = mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    difficulty: { type: String, required: true }, // Easy, Medium, Hard
    reward: { type: String, required: true },
    daysLeft: { type: Number, required: true },
    participants: { type: [String], default: [] }, // Array of user IDs
    progress: { type: Number, default: 0 },
    createdOn: { type: Date, default: Date.now },
});

export default mongoose.model("Challenge", challengeSchema);
