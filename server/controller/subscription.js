import User from "../models/auth.js";
import moment from "moment-timezone";

// Constants
const SUBSCRIPTION_PLANS = {
    free: { limit: 1, cost: 0 },
    bronze: { limit: 5, cost: 100 },
    silver: { limit: 10, cost: 300 },
    gold: { limit: Infinity, cost: 1000 }
};

export const verifyPaymentWindow = (req, res, next) => {
    const now = moment().tz("Asia/Kolkata");
    const currentHour = now.hour();

    // 10:00 AM to 11:00 AM IST
    if (currentHour === 10) {
        next();
    } else {
        return res.status(403).json({
            message: "Payments are only allowed between 10:00 AM and 11:00 AM IST."
        });
    }
};

export const subscribe = async (req, res) => {
    const { plan } = req.body;
    const userId = req.userid;

    if (!['bronze', 'silver', 'gold'].includes(plan)) {
        return res.status(400).json({ message: "Invalid plan selected" });
    }

    try {
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: "User not found" });

        // MOCK PAYMENT PROCESSING
        // In real app, integrate Stripe/Razorpay here
        console.log(`[Mock Payment] Processing ₹${SUBSCRIPTION_PLANS[plan].cost} for user ${userId}`);

        // Success
        user.subscription = {
            plan,
            status: 'active',
            validUntil: moment().add(30, 'days').toDate()
        };

        await user.save();

        // Mock Invoice Email
        console.log(`[Mock Email] Sending invoice to ${user.email} for ${plan} plan.`);

        res.status(200).json({
            message: `Successfully subscribed to ${plan} plan. Valid for 30 days.`,
            subscription: user.subscription
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const checkQuestionLimit = async (req, res, next) => {
    const userId = req.userid;
    try {
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: "User not found" });

        const plan = user.subscription.plan || 'free';
        const limit = SUBSCRIPTION_PLANS[plan].limit;

        // If unlimited, skip check
        if (limit === Infinity) return next();

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // We typically would count actual questions in the DB, 
        // but for efficiency we can assume questionsCount tracks total.
        // Wait, questionsCount is total. We need *daily* count.
        // We need to query the Question model for questions asked today by this user.
        // Since we don't have cyclic dependency issues if we dynamically import or pass model, 
        // but easier just to import Question model.

        // Dynamic import to avoid potential circular dependency if any (though unlikely here)
        const Question = (await import("../models/question.js")).default;

        const questionsToday = await Question.countDocuments({
            userid: userId, // schema uses userid
            askedon: { $gte: today }
        });

        if (questionsToday >= limit) {
            return res.status(403).json({
                message: `Daily question limit reached for ${plan} plan (${limit}/day). Upgrade to increase limit.`
            });
        }

        next();

    } catch (error) {
        res.status(500).json({ message: "Error checking subscription limits" });
    }
};
