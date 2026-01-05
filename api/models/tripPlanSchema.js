const mongoose = require("mongoose");

const tripPlanSchema = new mongoose.Schema({
  destination: {
    type: String,
    required: true,
  },

  budget: {
    type: Number,
    required: false,
  },

  duration: {
    type: Number,
    required: false,
  },

  interesting: {
    type: String,
    required: false,
  },

  date: {
    type: Date,
    required: false,
  },

  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "User",
  },
});

module.exports = mongoose.model("TripPlan", tripPlanSchema);
