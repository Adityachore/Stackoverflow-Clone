import mongoose from "mongoose";
import dotenv from "dotenv";
import Question from "./models/question.js";

dotenv.config();

const dummyQuestions = [
  {
    questiontitle: "How to properly center a div using Tailwind CSS?",
    questionbody: "I am building a React application and I'm using Tailwind CSS for styling. I've tried using margin auto but it doesn't seem to work for vertical centering. What is the standard and most robust way to center a div both horizontally and vertically using Tailwind?",
    questiontags: ["css", "tailwind", "react", "html"],
    userposted: "Alex Developer",
    userid: "661234567890123456789012",
    upvote: ["1", "2", "3", "4", "5"],
    downvote: [],
    noofanswer: 2,
    views: 142,
    askedon: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
  },
  {
    questiontitle: "What is the difference between useEffect and useLayoutEffect?",
    questionbody: "I read the React documentation but I'm still a bit confused about when I should specifically use useLayoutEffect instead of useEffect. Can someone provide a real-world example where useLayoutEffect is absolutely necessary?",
    questiontags: ["react", "javascript", "hooks"],
    userposted: "Sarah Codes",
    userid: "661234567890123456789013",
    upvote: ["1", "2", "3", "4", "5", "6", "7", "8"],
    downvote: ["9"],
    noofanswer: 3,
    views: 890,
    askedon: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) // 5 days ago
  },
  {
    questiontitle: "Getting CORS error when connecting Next.js to Express API",
    questionbody: "I have my Next.js frontend deployed on Vercel and my Express backend deployed on Render. When I try to make a login request, I get 'Blocked by CORS policy: No Access-Control-Allow-Origin header is present'. I already added the cors package to express. What am I missing?",
    questiontags: ["cors", "express", "nextjs", "deployment"],
    userposted: "DevAditya",
    userid: "661234567890123456789014",
    upvote: ["1", "2", "3"],
    downvote: [],
    noofanswer: 0,
    views: 45,
    askedon: new Date() // Today
  },
  {
    questiontitle: "How to handle Stripe webhooks in Node.js safely?",
    questionbody: "I'm integrating payments and I need to listen to Stripe webhooks to update user subscription status. How do I verify the webhook signature properly in an Express route? I'm getting a raw body error right now.",
    questiontags: ["nodejs", "stripe", "webhooks", "express"],
    userposted: "FinTech Guru",
    userid: "661234567890123456789015",
    upvote: ["1", "2"],
    downvote: ["3", "4"],
    noofanswer: 1,
    views: 210,
    askedon: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) // 10 days ago
  }
];

const seedDB = async () => {
  try {
    const URL = process.env.MONGODB_URL || process.env.MONGODB_URI || process.env.CONNECTION_URL;
    if (!URL) {
      console.log("Error: MongoDB URL is not set in .env (tried MONGODB_URL, MONGODB_URI, CONNECTION_URL)");
      process.exit(1);
    }
    
    await mongoose.connect(URL);
    console.log("Connected to MongoDB...");

    // Insert dummy data
    console.log("Adding top questions...");
    await Question.insertMany(dummyQuestions);
    
    console.log("✅ Successfully added mock questions to your database!");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding database:", error);
    process.exit(1);
  }
};

seedDB();
