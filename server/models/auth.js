import mongoose from "mongoose";

const userschema = mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true },
  about: { type: String, default: "" },
  tags: { type: [String], default: [] },
  joinDate: { type: Date, default: Date.now },
  // Reputation system
  reputation: { type: Number, default: 1 },
  // Profile fields
  avatar: { type: String, default: "" },
  location: { type: String, default: "" },
  website: { type: String, default: "" },
  // Stats
  profileViews: { type: Number, default: 0 },
  lastSeen: { type: Date, default: Date.now },
  // Badges earned by user
  badges: {
    gold: { type: Number, default: 0 },
    silver: { type: Number, default: 0 },
    bronze: { type: Number, default: 0 },
  },
  badgesList: [
    {
      name: String,
      type: { type: String, enum: ["gold", "silver", "bronze"] },
      earnedAt: { type: Date, default: Date.now },
    },
  ],
  // Bookmarked questions
  bookmarks: [{ type: mongoose.Schema.Types.ObjectId, ref: "question" }],
  // Questions and answers count for quick access
  questionsCount: { type: Number, default: 0 },
  answersCount: { type: Number, default: 0 },
});

export default mongoose.model("user", userschema);
