const nodemailer = require('nodemailer');
const twilio = require('twilio');

// Initialize email transporter (Gmail)
const emailTransporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_EMAIL,
        pass: process.env.GMAIL_APP_PASSWORD,
    },
});

// Initialize Twilio client
const twilioClient = process.env.TWILIO_ACCOUNT_SID
    ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
    : null;

// Generate random 6-digit OTP
function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// Send OTP via email
async function sendOTPEmail(email, otp, firstName = 'User') {
    try {
        const subject = 'Your RetailIQ Password Reset OTP';
        const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px;">
          <h2 style="color: #333; text-align: center;">Password Reset Request</h2>
          <p style="color: #666; font-size: 14px;">Hi ${firstName},</p>
          <p style="color: #666; font-size: 14px;">
            You requested to reset your password. Use the OTP below to verify your identity.
          </p>
          <div style="background-color: #fff; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
            <h1 style="color: #007bff; letter-spacing: 5px; margin: 0;">${otp}</h1>
          </div>
          <p style="color: #666; font-size: 14px;">
            This OTP will expire in <strong>10 minutes</strong>. If you did not request this, please ignore this email.
          </p>
          <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;" />
          <p style="color: #999; font-size: 12px; text-align: center;">
            RetailIQ - Smart Retail Analytics Platform
          </p>
        </div>
      </div>
    `;

        await emailTransporter.sendMail({
            from: process.env.GMAIL_EMAIL,
            to: email,
            subject,
            html: htmlContent,
        });

        return { success: true, message: 'OTP sent to email' };
    } catch (error) {
        console.error('Email send error:', error);
        throw new Error('Failed to send OTP via email');
    }
}

// Send OTP via SMS (Twilio)
async function sendOTPSMS(phone, otp) {
    if (!twilioClient) {
        throw new Error('Twilio not configured');
    }

    try {
        await twilioClient.messages.create({
            body: `Your RetailIQ password reset OTP is: ${otp}\n\nThis code will expire in 10 minutes. Do not share it with anyone.`,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: `+91 ${phone}`,
        });

        return { success: true, message: 'OTP sent to phone' };
    } catch (error) {
        console.error('SMS send error:', error);
        throw new Error('Failed to send OTP via SMS');
    }
}

// Check if OTP is still valid (10 minutes validity)
function isOTPValid(otpGeneratedAt) {
    if (!otpGeneratedAt) return false;
    const now = new Date();
    const generatedTime = new Date(otpGeneratedAt);
    const diffMinutes = (now - generatedTime) / (1000 * 60);
    return diffMinutes < 10; // OTP valid for 10 minutes
}

module.exports = {
    generateOTP,
    sendOTPEmail,
    sendOTPSMS,
    isOTPValid,
};
