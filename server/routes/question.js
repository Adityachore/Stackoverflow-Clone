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

const router = express.Router();
import auth from "../middleware/auth.js";
import { checkQuestionLimit } from "../controller/subscription.js";

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
