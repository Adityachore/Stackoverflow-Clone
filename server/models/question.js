import mongoose from "mongoose";

// Comment sub-schema for both questions and answers
const commentSchema = mongoose.Schema({
  body: { type: String, required: true, maxlength: 600 },
  userid: { type: String, required: true },
  username: { type: String, required: true },
  upvotes: { type: [String], default: [] },
  createdAt: { type: Date, default: Date.now },
});

const questionschema = mongoose.Schema(
  {
    questiontitle: { type: String, required: true, minlength: 15 },
    questionbody: { type: String, required: true, minlength: 20 },
    questiontags: { type: [String], required: true },
    noofanswer: { type: Number, default: 0 },
    upvote: { type: [String], default: [] },
    downvote: { type: [String], default: [] },
    userposted: { type: String },
    userid: { type: String },
    askedon: { type: Date, default: Date.now },
    // View count
    views: { type: Number, default: 0 },
    // Accepted answer ID
    acceptedAnswerId: { type: mongoose.Schema.Types.ObjectId, default: null },
    // Comments on question
    comments: [commentSchema],
    answer: [
      {
        answerbody: String,
        useranswered: String,
        userid: String,
        answeredon: { type: Date, default: Date.now },
        upvote: { type: [String], default: [] },
        downvote: { type: [String], default: [] },
        // Comments on answer
        comments: [commentSchema],
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model("question", questionschema);
