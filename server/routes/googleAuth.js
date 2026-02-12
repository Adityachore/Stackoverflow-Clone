import express from "express";
import { startGoogleAuth, handleGoogleCallback } from "../controller/googleAuth.js";

const router = express.Router();

router.get("/google", startGoogleAuth);
router.get("/google/callback", handleGoogleCallback);

export default router;
