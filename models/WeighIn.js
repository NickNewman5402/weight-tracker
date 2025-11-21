const mongoose = require("mongoose");

const weighInSchema = new mongoose.Schema
(
  {
    userId: 
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    date: 
    {
      type: Date,
      required: true,
    },

    weight: 
    {
      type: Number,
      required: true,
    },

    note: 
    {
      type: String,
      default: "",
      trim: true,
    },
    
  },

  {
    timestamps: true, // createdAt, updatedAt
  }

);

module.exports = mongoose.model("WeighIn", weighInSchema);
