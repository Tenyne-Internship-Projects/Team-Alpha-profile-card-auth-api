// utils/mailer.js
const nodemailer = require("nodemailer");
require("dotenv").config();
// Create transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT, 10), // 587
  secure: false, // TLS (false means STARTTLS)
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/**
 * Send a plain email
 * @param {string} to "jaafarsallau2001@gmail.com"
 * @param {string} subject "how are you buddy"
 * @param {string} html - "this is your verification"
 */
async function sendEmail(to, subject, html) {
  try {
    const info = await transporter.sendMail({
      from: `"${process.env.SMTP_SENDER_NAME}" <${process.env.SMTP_ADMIN_EMAIL}>`,
      to,
      subject,
      html,
    });

    console.log("Email sent:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(" Failed to send email:", error.message);
    throw new Error("Failed to send email.");
  }
}

module.exports = { sendEmail };
