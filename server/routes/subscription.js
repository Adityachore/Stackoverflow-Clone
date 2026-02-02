import express from "express";
import { subscribe, verifyPaymentWindow } from "../controller/subscription.js";
import auth from "../middleware/auth.js";

const router = express.Router();

router.post("/subscribe", auth, verifyPaymentWindow, subscribe);

export default router;
