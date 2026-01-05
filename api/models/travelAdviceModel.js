// models/travelAdviceModel.js (unchanged)
const mongoose = require("mongoose");
const travelAdviceSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  advice: {
    type: String,
    required: true,
  },
  conversationId: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});
module.exports = mongoose.model("TravelAdvice", travelAdviceSchema);