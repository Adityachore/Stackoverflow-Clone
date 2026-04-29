import mongoose from "mongoose";

const articleSchema = mongoose.Schema({
  title: {
    type: String,
    required: true,
    minlength: 10,
    maxlength: 200
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true
  },
  content: {
    type: String,
    required: true,
    minlength: 100
  },
  summary: {
    type: String,
    maxlength: 500
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
    required: true
  },
  authorName: {
    type: String,
    required: true
  },
  // Cover image
  coverImage: {
    type: String,
    default: ""
  },
  // Tags/Categories
  tags: {
    type: [String],
    default: []
  },
  category: {
    type: String,
    enum: [
      "tutorial",
      "guide",
      "news",
      "opinion",
      "review",
      "career",
      "tips",
      "other"
    ],
    default: "other"
  },
  // Engagement metrics
  views: {
    type: Number,
    default: 0
  },
  likes: {
    type: [String],
    default: []
  },
  bookmarks: {
    type: [String],
    default: []
  },
  // Comments on article
  comments: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
    userName: String,
    userAvatar: String,
    content: { type: String, required: true, maxlength: 1000 },
    likes: { type: [String], default: [] },
    createdAt: { type: Date, default: Date.now },
    isEdited: { type: Boolean, default: false }
  }],
  // Reading time in minutes (calculated)
  readingTime: {
    type: Number,
    default: 1
  },
  // Publication status
  status: {
    type: String,
    enum: ["draft", "published", "archived"],
    default: "draft"
  },
  publishedAt: {
    type: Date
  },
  // SEO fields
  metaDescription: {
    type: String,
    maxlength: 160
  },
  // Related questions from Q&A
  relatedQuestions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "question"
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Generate slug from title before saving
articleSchema.pre('save', function(next) {
  if (this.isModified('title') || !this.slug) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') + '-' + Date.now().toString(36);
  }
  
  // Calculate reading time (average 200 words per minute)
  if (this.isModified('content')) {
    const wordCount = this.content.split(/\s+/).length;
    this.readingTime = Math.ceil(wordCount / 200);
  }
  
  next();
});

// Indexes for efficient queries
articleSchema.index({ slug: 1 });
articleSchema.index({ author: 1, status: 1 });
articleSchema.index({ tags: 1 });
articleSchema.index({ category: 1, status: 1 });
articleSchema.index({ publishedAt: -1 });
articleSchema.index({ views: -1 });
articleSchema.index({ createdAt: -1 });

export default mongoose.model("Article", articleSchema);
