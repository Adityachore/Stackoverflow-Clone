import mongoose from "mongoose";

const tagSchema = mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    maxlength: 35
  },
  displayName: {
    type: String,
    required: true,
    maxlength: 35
  },
  description: {
    type: String,
    default: "",
    maxlength: 500
  },
  // Extended wiki-style description
  wiki: {
    type: String,
    default: ""
  },
  // Tag category for grouping
  category: {
    type: String,
    enum: [
      "language",
      "framework",
      "library",
      "tool",
      "database",
      "concept",
      "platform",
      "other"
    ],
    default: "other"
  },
  // Related/synonym tags
  synonyms: [{
    type: String,
    lowercase: true
  }],
  relatedTags: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Tag"
  }],
  // Usage statistics
  questionCount: {
    type: Number,
    default: 0
  },
  articleCount: {
    type: Number,
    default: 0
  },
  followerCount: {
    type: Number,
    default: 0
  },
  // Users following this tag
  followers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "user"
  }],
  // Tag experts (top contributors)
  topContributors: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
    score: { type: Number, default: 0 }
  }],
  // External links (documentation, official site)
  externalLinks: [{
    title: String,
    url: String
  }],
  // Tag icon/logo URL
  iconUrl: {
    type: String,
    default: ""
  },
  // Moderation
  isApproved: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user"
  },
  // Trending score (updated periodically)
  trendingScore: {
    type: Number,
    default: 0
  },
  // Questions asked in last 7 days
  weeklyQuestions: {
    type: Number,
    default: 0
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
tagSchema.index({ name: 1 });
tagSchema.index({ questionCount: -1 });
tagSchema.index({ trendingScore: -1 });
tagSchema.index({ category: 1 });
tagSchema.index({ synonyms: 1 });
tagSchema.index({ followers: 1 });

// Update timestamp on save
tagSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Static method to increment question count
tagSchema.statics.incrementQuestionCount = async function(tagNames) {
  await this.updateMany(
    { name: { $in: tagNames.map(t => t.toLowerCase()) } },
    { $inc: { questionCount: 1, weeklyQuestions: 1 } }
  );
};

// Static method to decrement question count
tagSchema.statics.decrementQuestionCount = async function(tagNames) {
  await this.updateMany(
    { name: { $in: tagNames.map(t => t.toLowerCase()) } },
    { $inc: { questionCount: -1 } }
  );
};

export default mongoose.model("Tag", tagSchema);
