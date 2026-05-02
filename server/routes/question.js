import express from "express";
import {
  Askquestion,
  deletequestion,
  getallquestion,
  getquestionbyid,
  votequestion,
  acceptAnswer,
  addQuestionComment,
  addAnswerComment,
  aiSearch,
} from "../controller/question.js";
import question from "../models/question.js"; // Import the model for the seeder

const router = express.Router();
import auth from "../middleware/auth.js";
import { checkQuestionLimit } from "../controller/subscription.js";

// Database Seeder Route
router.get("/seed-mock-data", async (req, res) => {
  try {
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
      }
    ];
    await question.insertMany(dummyQuestions);
    res.status(200).json({ message: "Successfully seeded 3 questions into the database!" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/ask", auth, checkQuestionLimit, Askquestion);
router.post("/ai-search", aiSearch);
router.get("/getallquestion", getallquestion);
router.get("/:id", getquestionbyid);
router.delete("/delete/:id", auth, deletequestion);
router.patch("/vote/:id", auth, votequestion);
router.patch("/accept/:id", auth, acceptAnswer);
router.post("/comment/:id", auth, addQuestionComment);
router.post("/answercomment/:id", auth, addAnswerComment);

export default router;
