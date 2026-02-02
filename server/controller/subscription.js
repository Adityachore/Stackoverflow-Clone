import User from "../models/auth.js";
import moment from "moment-timezone";
import { SUBSCRIPTION_PLANS, createRazorpayOrder, verifyRazorpayPayment, processMockPayment } from "../services/payment.js";
import { sendSubscriptionInvoice } from "../services/notification.js";

export const verifyPaymentWindow = (req, res, next) => {
    const now = moment().tz("Asia/Kolkata");
    const currentHour = now.hour();

    // 10:00 AM to 11:00 AM IST
    if (currentHour === 10) {
        next();
    } else {
        return res.status(403).json({
            message: "Payments are only allowed between 10:00 AM and 11:00 AM IST.",
            currentTime: now.format('hh:mm A'),
            allowedWindow: "10:00 AM - 11:00 AM IST"
        });
    }
};

// Create order for payment
export const createOrder = async (req, res) => {
    const { plan } = req.body;
    const userId = req.userid;

    if (!['bronze', 'silver', 'gold'].includes(plan)) {
        return res.status(400).json({ message: "Invalid plan selected" });
    }

    try {
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: "User not found" });

        const planDetails = SUBSCRIPTION_PLANS[plan];
        const order = await createRazorpayOrder(planDetails.cost, userId, plan);

        if (!order.success) {
            return res.status(500).json({ message: "Failed to create order" });
        }

        res.status(200).json({
            orderId: order.orderId,
            amount: order.amount,
            currency: order.currency,
            keyId: order.keyId,
            plan,
            planDetails
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Verify payment and activate subscription
export const subscribe = async (req, res) => {
    const { plan, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const userId = req.userid;

    if (!['bronze', 'silver', 'gold'].includes(plan)) {
        return res.status(400).json({ message: "Invalid plan selected" });
    }

    try {
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: "User not found" });

        let paymentResult;

        // If payment details provided, verify with Razorpay
        if (razorpay_order_id && razorpay_payment_id && razorpay_signature) {
            paymentResult = verifyRazorpayPayment(razorpay_order_id, razorpay_payment_id, razorpay_signature);
            if (!paymentResult.success) {
                return res.status(400).json({ message: "Payment verification failed" });
            }
            paymentResult.transactionId = razorpay_payment_id;
        } else {
            // Mock payment for development
            paymentResult = await processMockPayment(plan, userId);
            if (!paymentResult.success) {
                return res.status(400).json({ message: "Payment processing failed" });
            }
        }

        const planDetails = SUBSCRIPTION_PLANS[plan];
        const validUntil = moment().add(30, 'days').toDate();

        // Update subscription
        user.subscription = {
            plan,
            status: 'active',
            validUntil,
            lastTransactionId: paymentResult.transactionId
        };

        await user.save();

        // Send invoice email
        await sendSubscriptionInvoice(user.email, {
            plan,
            cost: planDetails.cost,
            validUntil,
            transactionId: paymentResult.transactionId
        });

        res.status(200).json({
            message: `Successfully subscribed to ${plan} plan. Valid for 30 days.`,
            subscription: user.subscription,
            invoice: {
                plan,
                amount: planDetails.cost,
                validUntil,
                transactionId: paymentResult.transactionId
            }
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get current subscription status
export const getSubscriptionStatus = async (req, res) => {
    const userId = req.userid;

    try {
        const user = await User.findById(userId).select('subscription email name');
        if (!user) return res.status(404).json({ message: "User not found" });

        const subscription = user.subscription || { plan: 'free', status: 'active' };
        const planDetails = SUBSCRIPTION_PLANS[subscription.plan];

        // Check if subscription has expired
        if (subscription.validUntil && new Date() > new Date(subscription.validUntil)) {
            subscription.status = 'inactive';
            subscription.plan = 'free';
            user.subscription = subscription;
            await user.save();
        }

        res.status(200).json({
            subscription,
            planDetails,
            questionLimit: planDetails.limit === Infinity ? 'Unlimited' : planDetails.limit
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

        const plan = user.subscription?.plan || 'free';
        const limit = SUBSCRIPTION_PLANS[plan]?.limit || 1;

        // If unlimited, skip check
        if (limit === Infinity) return next();

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const Question = (await import("../models/question.js")).default;

        const questionsToday = await Question.countDocuments({
            userid: userId,
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
