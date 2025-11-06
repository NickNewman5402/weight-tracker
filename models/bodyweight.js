const mongoose = require('mongoose');

const BodyweightSchema = new mongoose.Schema(
  {
    userId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date:     { type: Date, required: true, default: Date.now },
    weightLbs:{ type: Number, required: true, min: 1, max: 1000 },
    note:     { type: String, trim: true, maxlength: 200 }
  },
  {
    timestamps: true,
    collection: 'bodyweights' // forces lowercase, stable collection name
  }
);

// (optional) speed common queries
BodyweightSchema.index({ userId: 1, date: -1 });

module.exports = mongoose.model('Bodyweight', BodyweightSchema);
