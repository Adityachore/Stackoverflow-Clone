import crypto from 'crypto';

// Razorpay configuration
// In production, use real API keys from environment variables
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || 'rzp_test_xxxxxxxxxx';
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || 'xxxxxxxxxxxxxxxxxx';

// Subscription Plans
export const SUBSCRIPTION_PLANS = {
    free: { limit: 1, cost: 0, name: 'Free' },
    bronze: { limit: 5, cost: 100, name: 'Bronze' },
    silver: { limit: 10, cost: 300, name: 'Silver' },
    gold: { limit: Infinity, cost: 1000, name: 'Gold' }
};

/**
 * Create a Razorpay order
 * In production, this would make an actual API call to Razorpay
 * @param {number} amount - Amount in INR
 * @param {string} userId - User ID for reference
 * @param {string} plan - Plan name
 */
export const createRazorpayOrder = async (amount, userId, plan) => {
    try {
        // In production, use Razorpay SDK:
        // const Razorpay = require('razorpay');
        // const instance = new Razorpay({ key_id: RAZORPAY_KEY_ID, key_secret: RAZORPAY_KEY_SECRET });
        // const order = await instance.orders.create({
        //     amount: amount * 100, // Razorpay expects amount in paise
        //     currency: 'INR',
        //     receipt: `order_${userId}_${Date.now()}`,
        //     notes: { plan, userId }
        // });

        // Mock order for development
        const orderId = `order_${crypto.randomBytes(12).toString('hex')}`;
        console.log(`[Payment Service] Created Razorpay order: ${orderId} for ₹${amount}`);

        return {
            success: true,
            orderId,
            amount: amount * 100, // In paise
            currency: 'INR',
            keyId: RAZORPAY_KEY_ID
        };
    } catch (error) {
        console.error('[Payment Service] Error creating order:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Verify Razorpay payment signature
 * @param {string} orderId - Razorpay order ID
 * @param {string} paymentId - Razorpay payment ID
 * @param {string} signature - Razorpay signature
 */
export const verifyRazorpayPayment = (orderId, paymentId, signature) => {
    try {
        // Generate expected signature
        const expectedSignature = crypto
            .createHmac('sha256', RAZORPAY_KEY_SECRET)
            .update(`${orderId}|${paymentId}`)
            .digest('hex');

        const isValid = expectedSignature === signature;

        if (!isValid) {
            console.log('[Payment Service] Invalid signature');
            return { success: false, error: 'Invalid payment signature' };
        }

        console.log('[Payment Service] Payment verified successfully');
        return { success: true, paymentId };
    } catch (error) {
        console.error('[Payment Service] Error verifying payment:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Process mock payment (for development/testing)
 * @param {string} plan - Plan name
 * @param {string} userId - User ID
 */
export const processMockPayment = async (plan, userId) => {
    const planDetails = SUBSCRIPTION_PLANS[plan];
    if (!planDetails) {
        return { success: false, error: 'Invalid plan' };
    }

    // Simulate payment processing delay
    await new Promise(resolve => setTimeout(resolve, 500));

    const transactionId = `txn_${crypto.randomBytes(12).toString('hex')}`;
    console.log(`[Payment Service] Mock payment processed: ${transactionId} for ${plan} plan (₹${planDetails.cost})`);

    return {
        success: true,
        transactionId,
        plan,
        amount: planDetails.cost,
        timestamp: new Date().toISOString()
    };
};

/**
 * Refund payment (mock implementation)
 * @param {string} transactionId - Transaction to refund
 * @param {number} amount - Amount to refund
 */
export const refundPayment = async (transactionId, amount) => {
    // In production, use Razorpay refund API
    console.log(`[Payment Service] Refund processed for ${transactionId}: ₹${amount}`);
    return {
        success: true,
        refundId: `refund_${crypto.randomBytes(8).toString('hex')}`,
        amount
    };
};

/**
 * Get Razorpay checkout configuration
 * @param {object} order - Order details
 * @param {object} user - User details
 */
export const getRazorpayConfig = (order, user) => {
    return {
        key: RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency || 'INR',
        name: 'StackOverflow Clone',
        description: `${order.plan} Plan Subscription`,
        order_id: order.orderId,
        prefill: {
            name: user.name,
            email: user.email,
            contact: user.mobile || ''
        },
        theme: {
            color: '#f48024'
        }
    };
};
