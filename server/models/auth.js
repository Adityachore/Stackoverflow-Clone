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

  // --- New Features ---
  lastPasswordReset: {
    date: { type: Date },
    count: { type: Number, default: 0 }
  },
  mobile: { type: String },
  language: { type: String, default: 'English' },

  // public social space
  friends: [{ type: String }],
  friendRequests: [{ type: String }],

  // user reward and point transfer system
  points: { type: Number, default: 0 },

  // Subscription-based system
  subscription: {
    plan: { type: String, enum: ['free', 'silver', 'gold'], default: 'free' },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    validUntil: { type: Date }
  },

  // Login History Tracking
  loginHistory: [{
    browser: String,
    os: String,
    device: String,
    ip: String,
    loginAt: { type: Date, default: Date.now }
  }],

  // OTP Verification
  otp: {
    code: String,
    expiresAt: Date
  }
});

export default mongoose.model("user", userschema);
