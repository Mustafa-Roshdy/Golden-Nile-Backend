const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema(
  {
    username: { type: String, required: true },
    text: { type: String, required: true },
    images: { type: [String], default: [] },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

const postSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    author: { type: String, required: true },
    avatar: { type: String, default: null },
    content: { type: String, required: true },
    images: { type: [String], default: [] },
    likes: { type: [String], default: [] },
    comments: { type: [commentSchema], default: [] },
    attachedProgram: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Program',
      default: null
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Post", postSchema);


