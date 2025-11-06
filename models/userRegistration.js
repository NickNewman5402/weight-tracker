const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName:  { type: String, required: true, trim: true },
    login:     { type: String, required: true, unique: true, lowercase: true, trim: true },
    email:     { type: String, required: true, unique: true, lowercase: true, trim: true },
    password:  { type: String, required: true }, // bcrypt hash
    emailVerified: { type: Boolean, default: false }
  },
  { timestamps: true, collection: 'Users' }
);

module.exports = mongoose.model('User', UserSchema);
