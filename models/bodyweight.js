// models/bodyweight.js
const mongoose = require('mongoose');

const BodyWeightSchema = new mongoose.Schema(
  {
    UserId: { type: Number, required: true, index: true },
    // store as Date; we’ll normalize to midnight UTC so range queries are clean
    date:   { type: Date, required: true, index: true },
    weight: { type: Number, required: true },
    notes:  { type: String, default: '' }
  },
  { timestamps: true }
);

// unique per day per user
BodyWeightSchema.index({ UserId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('BodyWeights', BodyWeightSchema);
