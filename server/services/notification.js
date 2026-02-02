import nodemailer from 'nodemailer';

// Email transporter configuration
// In production, use real SMTP credentials from environment variables
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: false,
    auth: {
        user: process.env.SMTP_USER || 'your-email@gmail.com',
        pass: process.env.SMTP_PASS || 'your-app-password'
    }
});

/**
 * Send email
 * @param {string} to - Recipient email
 * @param {string} subject - Email subject
 * @param {string} html - HTML content
 */
export const sendEmail = async (to, subject, html) => {
    try {
        const mailOptions = {
            from: process.env.SMTP_FROM || '"StackOverflow Clone" <noreply@stackoverflow-clone.com>',
            to,
            subject,
            html
        };

        // In development, log instead of sending
        if (process.env.NODE_ENV !== 'production') {
            console.log('[Email Service] Would send email:');
            console.log('To:', to);
            console.log('Subject:', subject);
            console.log('Content:', html);
            return { success: true, mock: true };
        }

        const info = await transporter.sendMail(mailOptions);
        console.log('[Email Service] Message sent:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('[Email Service] Error:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Send OTP via email
 * @param {string} email - Recipient email
 * @param {string} otp - OTP code
 * @param {string} purpose - Purpose of OTP (e.g., 'language change', 'login verification')
 */
export const sendEmailOTP = async (email, otp, purpose = 'verification') => {
    const subject = `Your OTP for ${purpose} - StackOverflow Clone`;
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #f48024;">StackOverflow Clone</h2>
            <p>Your OTP for <strong>${purpose}</strong> is:</p>
            <div style="background: #f5f5f5; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 8px; margin: 20px 0;">
                ${otp}
            </div>
            <p style="color: #666;">This OTP is valid for 5 minutes. Do not share it with anyone.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="color: #999; font-size: 12px;">If you didn't request this OTP, please ignore this email.</p>
        </div>
    `;
    return sendEmail(email, subject, html);
};

/**
 * Send password reset email with new password
 * @param {string} email - Recipient email
 * @param {string} newPassword - New generated password
 */
export const sendPasswordResetEmail = async (email, newPassword) => {
    const subject = 'Password Reset - StackOverflow Clone';
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #f48024;">StackOverflow Clone</h2>
            <p>Your password has been reset. Here is your new temporary password:</p>
            <div style="background: #f5f5f5; padding: 20px; text-align: center; font-size: 24px; font-weight: bold; margin: 20px 0;">
                ${newPassword}
            </div>
            <p style="color: #d32f2f;"><strong>Important:</strong> Please change your password after logging in.</p>
            <p style="color: #666;">For security reasons, you can only reset your password once per day.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="color: #999; font-size: 12px;">If you didn't request this reset, please contact support immediately.</p>
        </div>
    `;
    return sendEmail(email, subject, html);
};

/**
 * Send subscription invoice email
 * @param {string} email - Recipient email
 * @param {object} subscriptionDetails - Subscription plan details
 */
export const sendSubscriptionInvoice = async (email, subscriptionDetails) => {
    const { plan, cost, validUntil, transactionId } = subscriptionDetails;
    const subject = `Subscription Invoice - ${plan.toUpperCase()} Plan - StackOverflow Clone`;
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #f48024;">StackOverflow Clone</h2>
            <h3>Subscription Invoice</h3>
            <div style="background: #f5f5f5; padding: 20px; margin: 20px 0; border-radius: 8px;">
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 10px 0; border-bottom: 1px solid #ddd;"><strong>Plan</strong></td>
                        <td style="padding: 10px 0; border-bottom: 1px solid #ddd; text-align: right;">${plan.toUpperCase()}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px 0; border-bottom: 1px solid #ddd;"><strong>Amount Paid</strong></td>
                        <td style="padding: 10px 0; border-bottom: 1px solid #ddd; text-align: right;">₹${cost}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px 0; border-bottom: 1px solid #ddd;"><strong>Valid Until</strong></td>
                        <td style="padding: 10px 0; border-bottom: 1px solid #ddd; text-align: right;">${new Date(validUntil).toLocaleDateString()}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px 0;"><strong>Transaction ID</strong></td>
                        <td style="padding: 10px 0; text-align: right; font-family: monospace;">${transactionId}</td>
                    </tr>
                </table>
            </div>
            <p style="color: #388e3c;">Thank you for your subscription! Enjoy unlimited access to premium features.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="color: #999; font-size: 12px;">This is an automated invoice. For any queries, contact support.</p>
        </div>
    `;
    return sendEmail(email, subject, html);
};

/**
 * Send SMS (Mock implementation - integrate with Twilio/MSG91 in production)
 * @param {string} mobile - Mobile number
 * @param {string} message - SMS content
 */
export const sendSMS = async (mobile, message) => {
    // In production, integrate with Twilio, MSG91, or similar service
    // Example Twilio integration:
    // const client = require('twilio')(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);
    // await client.messages.create({ body: message, from: process.env.TWILIO_PHONE, to: mobile });

    console.log('[SMS Service] Would send SMS:');
    console.log('To:', mobile);
    console.log('Message:', message);

    return { success: true, mock: true };
};

/**
 * Send OTP via SMS
 * @param {string} mobile - Mobile number
 * @param {string} otp - OTP code
 * @param {string} purpose - Purpose of OTP
 */
export const sendSMSOTP = async (mobile, otp, purpose = 'verification') => {
    const message = `Your OTP for ${purpose} on StackOverflow Clone is: ${otp}. Valid for 5 minutes. Do not share.`;
    return sendSMS(mobile, message);
};

/**
 * Generate random alphanumeric password (letters only as per requirement)
 * @param {number} length - Password length
 */
export const generateRandomPassword = (length = 12) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    let password = '';
    for (let i = 0; i < length; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
};

/**
 * Generate 6-digit OTP
 */
export const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};
