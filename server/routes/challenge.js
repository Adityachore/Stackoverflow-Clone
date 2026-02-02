import express from "express";
import { getAllChallenges, createChallenge, joinChallenge } from "../controller/challenge.js";
import auth from "../middleware/auth.js";

const router = express.Router();

router.get("/getall", getAllChallenges);
router.post("/create", auth, createChallenge);
router.patch("/join/:id", auth, joinChallenge);

export default router;
