// backend/models/user.js
const mongoose = require("mongoose");
const crypto = require("crypto");
const Schema = mongoose.Schema;

const UserSchema = new Schema({
  userId:    { type: Number },
  firstName: { type: String, required: true },
  lastName:  { type: String, required: true },
  login:     { type: String, required: true, unique: true },
  email:     { type: String, required: true, unique: true, lowercase: true },
  password:  { type: String, required: true },

  // --- EMAIL VERIFICATION ---
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationToken: String,
  verificationTokenExpires: Date,

  // --- PASSWORD RESET ---
  passwordResetToken: String,
  passwordResetExpires: Date
});

// Create email verification token
UserSchema.methods.createEmailVerificationToken = function () {
  const rawToken = crypto.randomBytes(32).toString("hex");

  this.verificationToken = crypto
    .createHash("sha256")
    .update(rawToken)
    .digest("hex");

  this.verificationTokenExpires = Date.now() + 24 * 60 * 60 * 1000; // 24h

  return rawToken; // This is what you send in the email link
};

// Create password reset token
UserSchema.methods.createPasswordResetToken = function () {
  const rawToken = crypto.randomBytes(32).toString("hex");

  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(rawToken)
    .digest("hex");

  this.passwordResetExpires = Date.now() + 60 * 60 * 1000; // 1 hour

  return rawToken;
};

module.exports = mongoose.model("Users", UserSchema, "Users");
