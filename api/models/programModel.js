const mongoose = require("mongoose");

const activitySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  image: {
    type: String,
    required: false,
  },
  latitude: {
    type: String,
    required: false,
  },
  longitude: {
    type: String,
    required: false,
  },
  startTime: {
    type: String,
    required: true,
  },
  endTime: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ["attraction", "guest_house", "restaurant"],
    required: false,
  },
  placeId: {
    type: String,
    required: false,
  },
});

const programSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "User",
  },
  destination: {
    type: String,
    required: true,
  },
  budget: {
    type: Number,
    required: false,
  },
  checkInDate: {
    type: String,
    required: true,
  },
  checkOutDate: {
    type: String,
    required: true,
  },
  interests: {
    type: [String],
    required: false,
  },
  activities: [activitySchema],
  estimatedBudget: {
    accommodation: {
      type: Number,
      required: false,
    },
    food: {
      type: Number,
      required: false,
    },
    attractions: {
      type: Number,
      required: false,
    },
    total: {
      type: Number,
      required: false,
    },
  },
  suggestedGuestHouses: [{
    id: String,
    name: String,
    price: Number,
  }],
}, {
  timestamps: true,
});

module.exports = mongoose.model("Program", programSchema);
