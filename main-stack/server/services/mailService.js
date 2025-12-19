const nodemailer = require('nodemailer');
const fs = require('fs');

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

async function sendEmailWithAttachment(from, to, sub, htmlContent, attachmentPath, attachmentFilename) {
    await emailTransporter.sendMail({
        from: from,
        to: to,
        subject: sub,
        html: htmlContent,
        attachments: [
            {
                filename: attachmentFilename,
                path: attachmentPath,
            },
        ],
    });
}

// Export both functions
module.exports = sendEmail;
module.exports.sendEmailWithAttachment = sendEmailWithAttachment;
