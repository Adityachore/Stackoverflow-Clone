import mongoose from "mongoose";

// Individual message schema
const messageSchema = mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
    required: true
  },
  content: {
    type: String,
    required: true,
    maxlength: 5000
  },
  messageType: {
    type: String,
    enum: ["text", "image", "file", "code"],
    default: "text"
  },
  // For code snippets
  codeLanguage: {
    type: String,
    default: ""
  },
  // For file/image attachments
  attachmentUrl: {
    type: String,
    default: ""
  },
  attachmentName: {
    type: String,
    default: ""
  },
  isEdited: {
    type: Boolean,
    default: false
  },
  editedAt: {
    type: Date
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  readBy: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
    readAt: { type: Date, default: Date.now }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Conversation/Chat room schema
const conversationSchema = mongoose.Schema({
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
    required: true
  }],
  isGroup: {
    type: Boolean,
    default: false
  },
  // For group chats
  groupName: {
    type: String,
    default: ""
  },
  groupAvatar: {
    type: String,
    default: ""
  },
  groupAdmin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user"
  },
  messages: [messageSchema],
  lastMessage: {
    content: String,
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
    createdAt: { type: Date }
  },
  // Unread count per participant
  unreadCount: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
    count: { type: Number, default: 0 }
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes for efficient queries
conversationSchema.index({ participants: 1 });
conversationSchema.index({ updatedAt: -1 });
conversationSchema.index({ "lastMessage.createdAt": -1 });

// Update updatedAt on save
conversationSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export const Message = mongoose.model("Message", messageSchema);
export const Conversation = mongoose.model("Conversation", conversationSchema);
export default Conversation;
