const nodemailer = require('nodemailer');

// Initialize email transporter (Gmail)
const emailTransporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_EMAIL,
        pass: process.env.GMAIL_APP_PASSWORD,
    },
});

async function sendEmail(from, to, sub, htmlContent) {
    await emailTransporter.sendMail({
        from: from,
        to: to,
        subject: sub,
        html: htmlContent,
    });
}

module.exports = sendEmail;
