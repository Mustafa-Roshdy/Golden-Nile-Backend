const mongoose = require("mongoose");

const placeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },

  type: {
    type: String,
    enum: ["guest_house", "restaurant"], // type of place can be restaurant or guest_house
    required: true,
  },

  address: {
    type: String,
    required: true,
  },

  latitude: {
    type: Number,
    required: true,
  },

  longitude: {
    type: Number,
    required: true,
  },

  images: {
    type: [String],
    default: [], // Array of image URLs
  },

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  }, 

  governorate: {
    type: String,
    required: true,
    enum: ['aswan', 'luxor']
  },
  
  description: {
    type: String,
    required: false,
  },

  // if place is Guest House
  rooms: {
    type: Number,
    required: function () {
      return this.type === "guest_house";
    },
  },

  breakfast: {
    type: Boolean,
    default: false,
  },

  wifi: {
    type: Boolean,
    default: false,
  },

  airConditioning: {
    type: Boolean,
    default: false,
  },

  pricePerNight: {
    type: Number,
    required: function () {
      return this.type === "guest_house";
    },
  },

  // if place is Restaurant = Array of cuisines
  cuisine: {
    type: [String],
    required: function () {
      return this.type === "restaurant";
    },
  },

  pricePerTable: {
    type: Number,
    required: function () {
      return this.type === "restaurant";
    },
  },

  chairsPerTable: {
    type: Number,
    required: function () {
      return this.type === "restaurant";
    },
  },

  // Place availability
  isAvailable: {
    type: Boolean,
    default: true,
  },

  // Operating hours (for restaurants)
  // operatingHours: {
  //   monday: {
  //     open: { type: String, default: "09:00" },
  //     close: { type: String, default: "22:00" },
  //     isOpen: { type: Boolean, default: true },
  //   },
  //   tuesday: {
  //     open: { type: String, default: "09:00" },
  //     close: { type: String, default: "22:00" },
  //     isOpen: { type: Boolean, default: true },
  //   },
  //   wednesday: {
  //     open: { type: String, default: "09:00" },
  //     close: { type: String, default: "22:00" },
  //     isOpen: { type: Boolean, default: true },
  //   },
  //   thursday: {
  //     open: { type: String, default: "09:00" },
  //     close: { type: String, default: "22:00" },
  //     isOpen: { type: Boolean, default: true },
  //   },
  //   friday: {
  //     open: { type: String, default: "09:00" },
  //     close: { type: String, default: "22:00" },
  //     isOpen: { type: Boolean, default: true },
  //   },
  //   saturday: {
  //     open: { type: String, default: "09:00" },
  //     close: { type: String, default: "22:00" },
  //     isOpen: { type: Boolean, default: true },
  //   },
  //   sunday: {
  //     open: { type: String, default: "09:00" },
  //     close: { type: String, default: "22:00" },
  //     isOpen: { type: Boolean, default: true },
  //   },
  // },

  likes: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: "User",
    default: [],
  },

  dislikes: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: "User",
    default: [],
  },

  reviews: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Review",
  }],

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Virtual for rating
placeSchema.virtual('rating').get(function() {
  const total = this.likes.length + this.dislikes.length;
  if (total === 0) return 0;
  return (this.likes.length * 5) / total;
});

// Ensure virtual fields are serialized
placeSchema.set('toJSON', { virtuals: true });
placeSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model("Place", placeSchema);