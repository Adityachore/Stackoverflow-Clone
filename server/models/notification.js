import mongoose from "mongoose";

const notificationSchema = mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
    required: true
  },
  type: {
    type: String,
    enum: [
      "friend_request",
      "friend_accepted",
      "like",
      "comment",
      "answer",
      "mention",
      "follow",
      "badge_earned",
      "question_upvote",
      "answer_upvote",
      "answer_accepted"
    ],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  // Reference to related content
  referenceId: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: "referenceModel"
  },
  referenceModel: {
    type: String,
    enum: ["question", "Post", "user", "Challenge", "Comment"]
  },
  // Link to navigate when notification is clicked
  link: {
    type: String,
    default: ""
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes for efficient queries
notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, isRead: 1 });
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 }); // Auto-delete after 30 days

export default mongoose.model("Notification", notificationSchema);
