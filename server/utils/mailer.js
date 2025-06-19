const nodemailer = require("nodemailer");
require("dotenv").config(); // Load environment variables from .env file

//@ Create a transporter to send emails using SMTP (email server)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT, 10), // Convert SMTP port to number (like 587)
  secure: false, // Use STARTTLS instead of SSL (secure: false means STARTTLS)
  auth: {
    user: process.env.SMTP_USER, // Email account username
    pass: process.env.SMTP_PASS, // Email account password
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

    //@ Log the email message ID in the console
    console.log("Email sent:", info.messageId);
    return { success: true, messageId: info.messageId }; // Return success status
  } catch (error) {
    //@ Show error in console if email sending fails
    console.error(" Failed to send email:", error.message);
    //@ Throw an error so the calling function knows it failed
    throw new Error("Failed to send email.");
  }
}
//@ Export the sendEmail function so it can be used in other files
module.exports = { sendEmail };
