import express from "express";
import { subscribe, verifyPaymentWindow, createOrder, getSubscriptionStatus, checkQuestionLimit } from "../controller/subscription.js";
import auth from "../middleware/auth.js";

const router = express.Router();

router.post("/create-order", auth, verifyPaymentWindow, createOrder);
router.post("/subscribe", auth, verifyPaymentWindow, subscribe);
router.get("/status", auth, getSubscriptionStatus);

export default router;

// Export checkQuestionLimit for use in question routes
export { checkQuestionLimit };
