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
    askedon: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
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
    askedon: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
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
    askedon: new Date()
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
    askedon: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)
  },
  {
    questiontitle: "Why does my Next.js app crash on build with 'document is not defined'?",
    questionbody: "Everything works perfectly in development when I run npm run dev. But when I try to run npm run build, it crashes saying ReferenceError: document is not defined. I'm using a third-party slider library if that matters.",
    questiontags: ["nextjs", "react", "ssr", "javascript"],
    userposted: "NextJS Newbie",
    userid: "661234567890123456789016",
    upvote: ["1", "2", "3", "4"],
    downvote: [],
    noofanswer: 2,
    views: 315,
    askedon: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
  },
  {
    questiontitle: "Best way to manage global state in React 2024?",
    questionbody: "I'm starting a new React project and I'm debating between Redux Toolkit, Zustand, Jotai, or just using React Context. The app will be relatively complex with a lot of frequent state updates. What is the current industry standard or best practice?",
    questiontags: ["react", "redux", "zustand", "state-management"],
    userposted: "State Manager",
    userid: "661234567890123456789017",
    upvote: ["1", "2", "3", "4", "5", "6"],
    downvote: ["1", "2"],
    noofanswer: 5,
    views: 1024,
    askedon: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000)
  },
  {
    questiontitle: "How to fix MongoDB 'connection pool exhausted' error?",
    questionbody: "My Node.js backend using Mongoose keeps crashing after running for a few hours. The logs say 'MongoTimeoutError: Server selection timed out after 30000 ms' and it mentions the connection pool might be exhausted. How do I fix this?",
    questiontags: ["mongodb", "mongoose", "nodejs", "database"],
    userposted: "Backend Bob",
    userid: "661234567890123456789018",
    upvote: ["1", "2", "3"],
    downvote: [],
    noofanswer: 1,
    views: 89,
    askedon: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
  },
  {
    questiontitle: "Understanding Python decorators with arguments",
    questionbody: "I know how to write a simple Python decorator without arguments, but when I try to pass an argument to the decorator itself (like @retry(times=3)), my brain melts. Can someone explain the three-level nested function structure?",
    questiontags: ["python", "decorators", "functions"],
    userposted: "Py Learner",
    userid: "661234567890123456789019",
    upvote: ["1", "2", "3", "4", "5", "6", "7"],
    downvote: [],
    noofanswer: 3,
    views: 450,
    askedon: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  },
  {
    questiontitle: "Docker container immediately exits after starting",
    questionbody: "I built a Docker image for my Node app using a standard Dockerfile. It builds successfully, but when I run docker run, the container starts and then immediately exits with code 0. It works fine locally outside of Docker.",
    questiontags: ["docker", "nodejs", "containers", "deployment"],
    userposted: "DevOps Dan",
    userid: "661234567890123456789020",
    upvote: ["1", "2"],
    downvote: ["1"],
    noofanswer: 2,
    views: 220,
    askedon: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000)
  },
  {
    questiontitle: "What exactly is a memory leak in JavaScript?",
    questionbody: "I hear people talking about memory leaks in React and JavaScript. Since JS is garbage collected, how can memory actually leak? What are the most common patterns that cause this and how do I profile it in Chrome DevTools?",
    questiontags: ["javascript", "memory-management", "debugging", "react"],
    userposted: "JS Guru",
    userid: "661234567890123456789021",
    upvote: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"],
    downvote: [],
    noofanswer: 4,
    views: 1500,
    askedon: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000)
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
