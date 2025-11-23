// backend/sendEmail.js
const nodemailer = require("nodemailer");

// These names match your .env file:
// EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS, EMAIL_SECURE, EMAIL_FROM
const {
  EMAIL_HOST,
  EMAIL_PORT,
  EMAIL_USER,
  EMAIL_PASS,
  EMAIL_SECURE,
  EMAIL_FROM,
} = process.env;

// Create a reusable transporter object using SMTP
const transporter = nodemailer.createTransport({
  host: EMAIL_HOST,
  port: Number(EMAIL_PORT) || 587,
  secure:
    EMAIL_SECURE === "true" || EMAIL_PORT === "465", // true for 465, false for 587/2525
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS,
  },
});

// Optional: verify connection on startup (log-only, never throw)
transporter.verify(function (error, success) {
  if (error) {
    console.warn(
      "SMTP connection problem (dev):",
      error.message || error.toString()
    );
  } else {
    console.log("SMTP server is ready to take our messages");
  }
});

async function sendEmail({ to, subject, html, text }) {
  const info = await transporter.sendMail({
    from: EMAIL_FROM || '"FormaTrack" <no-reply@formatrack.local>',
    to,
    subject,
    text,
    html,
  });

  console.log("Email sent:", info.messageId);
  return info;
}

module.exports = sendEmail;
