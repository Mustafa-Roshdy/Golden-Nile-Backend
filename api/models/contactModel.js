const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ["me", "other"],
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

const contactSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  contactUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  userUnreadCount: {
    type: Number,
    default: 0,
  },
  contactUserUnreadCount: {
    type: Number,
    default: 0,
  },
  messages: [messageSchema],
}, { timestamps: true });

// Ensure unique contact between two users
contactSchema.index({ user: 1, contactUser: 1 }, { unique: true });

module.exports = mongoose.model("Contact", contactSchema);