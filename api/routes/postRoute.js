const express = require("express");
const jwt = require("jsonwebtoken");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const Post = require("../models/postModel.js");
const User = require("../models/userModel.js");
const { protect } = require("../middleware/authMiddleware.js");
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require("../config/cloudinary.js");

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_here";

// Optional auth: attempts to decode JWT if present; continues regardless
function authOptional(req, res, next) {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
    } catch (_) {
      // ignore invalid token for optional routes
    }
  }
  next();
}

// Multer storage for image uploads
// Multer storage for image uploads
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "posts",
    allowedFormats: ["jpg", "jpeg", "png"], // v4 uses allowedFormats
    transformation: [{ width: 1000, height: 1000, crop: "limit" }],
  },
});
const upload = multer({ storage });

// POST /api/posts - Create a new post (requires authentication)
router.post("/posts", protect, upload.array("images", 10), async (req, res, next) => {
  try {
    const { content, attachedProgram } = req.body || {};
    if (!content || !String(content).trim()) {
      return res.status(400).json({ message: "Post content is required" });
    }

    // User is guaranteed to be authenticated by protect middleware
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: "Authentication required" });
    }

    let author = "Unknown User";
    let avatar = null;

    // Fetch user info
    try {
      const user = await User.findById(req.user.id).lean();
      if (user) {
        author = `${user.firstName} ${user.lastName}`;
        // Use user's photo if available, else generate avatar from name
        if (user.photo) {
          avatar = `${req.protocol}://${req.get("host")}${user.photo}`;
        } else {
          avatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(author)}`;
        }
      } else {
        // Fallback if user not found
        author = req.user.email || "Unknown User";
        avatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(author)}`;
      }
    } catch (err) {
      console.error("Error fetching user for post creation:", err);
      author = req.user.email || "Unknown User";
      avatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(author)}`;
    }

    // Build image URLs if any files are uploaded
    const images = Array.isArray(req.files)
      ? req.files.map((f) => f.path)
      : [];

    const count = await Post.countDocuments();
    if (count >= 20) {
      return res.status(400).json({ message: "Cannot create more than 20 posts" });
    }

    const newPost = new Post({
      userId: req.user.id,
      author,
      avatar,
      content: String(content).trim(),
      images,
      likes: [],
      comments: [],
      attachedProgram: attachedProgram || null,
    });

    await newPost.save();

    // Return the created post with populated attachedProgram (if any)
    const populated = await Post.findById(newPost._id).populate('attachedProgram').lean();
    return res.status(201).json({
      _id: populated._id,
      userId: populated.userId,
      author: populated.author,
      avatar: populated.avatar,
      content: populated.content,
      images: populated.images,
      createdAt: populated.createdAt,
      likes: 0,
      comments: 0,
      attachedProgram: populated.attachedProgram || null,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/posts/:id - return a single post populated with attachedProgram
router.get("/posts/:id", authOptional, async (req, res, next) => {
  try {
    const { id } = req.params;
    const post = await Post.findById(id).populate('attachedProgram').lean();
    if (!post) return res.status(404).json({ message: "Post not found" });

    let currentUsername = null;
    if (req.user && req.user.id) {
      try {
        const user = await User.findById(req.user.id).lean();
        if (user) currentUsername = `${user.firstName} ${user.lastName}`;
      } catch (_) { }
    }

    return res.json({
      _id: post._id,
      userId: post.userId,
      author: post.author,
      avatar: post.avatar || null,
      content: post.content,
      createdAt: post.createdAt,
      images: Array.isArray(post.images) ? post.images : [],
      likes: Array.isArray(post.likes) ? post.likes : [],
      likesCount: Array.isArray(post.likes) ? post.likes.length : 0,
      userHasLiked: currentUsername ? (Array.isArray(post.likes) ? post.likes.includes(currentUsername) : false) : false,
      comments: Array.isArray(post.comments) ? post.comments : [],
      commentsCount: Array.isArray(post.comments) ? post.comments.length : 0,
      attachedProgram: post.attachedProgram || null,
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/posts/:postId/attach-program - attach an existing program to a post
router.post('/posts/:postId/attach-program', protect, async (req, res, next) => {
  try {
    const { postId } = req.params;
    const { programId } = req.body || {};

    if (!programId) return res.status(400).json({ message: 'programId is required' });

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    post.attachedProgram = programId;
    await post.save();

    const updatedPost = await Post.findById(postId).populate('attachedProgram').lean();
    return res.json(updatedPost);
  } catch (err) {
    next(err);
  }
});

// GET /api/posts
router.get("/posts", authOptional, async (req, res, next) => {
  try {
    let currentUsername = null;
    if (req.user && req.user.id) {
      try {
        const user = await User.findById(req.user.id).lean();
        if (user) {
          currentUsername = `${user.firstName} ${user.lastName}`;
        }
      } catch (err) {
        // ignore error, user not found
      }
    }

    const limit = parseInt(req.query.limit) || 50; // default higher for now
    const skip = parseInt(req.query.skip) || 0;

    const posts = await Post.find().populate('attachedProgram').sort({ createdAt: -1 }).skip(skip).limit(limit).lean();
    return res.json(
      posts.map((p) => ({
        _id: p._id,
        userId: p.userId,
        author: p.author,
        avatar: p.avatar || null,
        content: p.content,
        createdAt: p.createdAt,
        images: Array.isArray(p.images) ? p.images : [],
        likes: Array.isArray(p.likes) ? p.likes : [],
        likesCount: Array.isArray(p.likes) ? p.likes.length : 0,
        userHasLiked: currentUsername ? (Array.isArray(p.likes) ? p.likes.includes(currentUsername) : false) : false,
        comments: Array.isArray(p.comments) ? p.comments : [],
        commentsCount: Array.isArray(p.comments) ? p.comments.length : 0,
        attachedProgram: p.attachedProgram || null,
      }))
    );
  } catch (err) {
    next(err);
  }
});

// GET /api/stats/community - Members, Stories, Photos counts
router.get("/stats/community", async (req, res, next) => {
  try {
    const [usersCount, posts, postsCount] = await Promise.all([
      User.countDocuments(),
      Post.find({}, { images: 1 }).lean(),
      Post.countDocuments(),
    ]);
    const likesCount = posts.reduce((acc, p) => acc + (Array.isArray(p.likes) ? p.likes.length : 0), 0);
    return res.json({ members: usersCount, stories: postsCount, photos: likesCount });
  } catch (err) {
    next(err);
  }
});

// Helper to get username from authenticated user (requires req.user from protect middleware)
async function getUsernameFromUser(req) {
  if (req.user && req.user.id) {
    try {
      const user = await User.findById(req.user.id).lean();
      if (user) {
        return `${user.firstName} ${user.lastName}`;
      }
    } catch (err) {
      console.error("Error fetching user:", err);
    }
  }
  // This shouldn't happen if protect middleware is used, but handle gracefully
  return req.user?.email || "Unknown User";
}

// POST /api/posts/:id/like (requires authentication) - Toggle like/unlike
router.post("/posts/:id/like", protect, async (req, res, next) => {
  try {
    const { id } = req.params;
    const username = await getUsernameFromUser(req);

    const post = await Post.findById(id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    // Initialize likes array if not present
    if (!Array.isArray(post.likes)) {
      post.likes = [];
    }

    // Toggle like: remove if exists, add if not
    const likeIndex = post.likes.indexOf(username);
    if (likeIndex > -1) {
      // Unlike: remove from array
      post.likes.splice(likeIndex, 1);
    } else {
      // Like: add to array
      post.likes.push(username);
    }

    await post.save();

    return res.json({
      likes: post.likes.length,
      userHasLiked: post.likes.includes(username),
      likesList: post.likes
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/posts/:id/comment (requires authentication)
router.post("/posts/:id/comment", protect, upload.array("images", 5), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { text } = req.body || {};
    const username = await getUsernameFromUser(req);

    if ((!text || !String(text).trim()) && (!req.files || req.files.length === 0)) {
      return res.status(400).json({ message: "Comment text or image required" });
    }

    const post = await Post.findById(id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    // Build image URLs if any files are uploaded
    const images = Array.isArray(req.files)
      ? req.files.map((f) => f.path)
      : [];

    const newComment = {
      username,
      text: String(text || "").trim(),
      images
    };
    post.comments.push(newComment);
    await post.save();

    // Return the newly added comment with its _id and createdAt
    const savedComment = post.comments[post.comments.length - 1];

    return res.json({
      comments: post.comments.length,
      newComment: {
        _id: savedComment._id,
        username: savedComment.username,
        text: savedComment.text,
        images: savedComment.images,
        createdAt: savedComment.createdAt
      }
    });
  } catch (err) {
    next(err);
  }
});
// PUT /api/posts/:id (requires authentication) - Update post if owned by user
router.put("/posts/:id", protect, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { content } = req.body || {};

    if (!content || !String(content).trim()) {
      return res.status(400).json({ message: "Post content is required" });
    }

    const post = await Post.findById(id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    // Check if the post belongs to the authenticated user
    if (post.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: "You can only update your own posts" });
    }

    post.content = String(content).trim();
    await post.save();

    return res.json({
      _id: post._id,
      userId: post.userId,
      author: post.author,
      avatar: post.avatar,
      content: post.content,
      createdAt: post.createdAt,
      images: post.images,
      likes: post.likes,
      likesCount: Array.isArray(post.likes) ? post.likes.length : 0,
      comments: post.comments,
      commentsCount: Array.isArray(post.comments) ? post.comments.length : 0,
    });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/posts/:id (requires authentication) - Delete post if owned by user
router.delete("/posts/:id", protect, async (req, res, next) => {
  try {
    const { id } = req.params;
    const post = await Post.findById(id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    // Check if the post belongs to the authenticated user
    if (post.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: "You can only delete your own posts" });
    }

    await Post.findByIdAndDelete(id);
    return res.status(200).json({ message: "Post deleted successfully" });
  } catch (err) {
    next(err);
  }
});

// PUT /api/posts/:postId/comments/:commentId (requires authentication) - Update comment
router.put("/posts/:postId/comments/:commentId", protect, async (req, res, next) => {
  try {
    const { postId, commentId } = req.params;
    const { text } = req.body || {};
    const username = await getUsernameFromUser(req);

    if (!text || !String(text).trim()) {
      return res.status(400).json({ message: "Comment text required" });
    }

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const comment = post.comments.id(commentId);
    if (!comment) return res.status(404).json({ message: "Comment not found" });

    // Check if the comment belongs to the authenticated user
    if (comment.username !== username) {
      return res.status(403).json({ message: "You can only update your own comments" });
    }

    comment.text = String(text).trim();
    await post.save();

    return res.json({
      _id: comment._id,
      username: comment.username,
      text: comment.text,
      createdAt: comment.createdAt,
    });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/posts/:postId/comments/:commentId (requires authentication) - Delete comment
router.delete("/posts/:postId/comments/:commentId", protect, async (req, res, next) => {
  try {
    const { postId, commentId } = req.params;
    const username = await getUsernameFromUser(req);

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const comment = post.comments.id(commentId);
    if (!comment) return res.status(404).json({ message: "Comment not found" });

    // Check if the comment belongs to the authenticated user
    if (comment.username !== username) {
      return res.status(403).json({ message: "You can only delete your own comments" });
    }

    post.comments.pull(commentId);
    await post.save();

    return res.status(200).json({ message: "Comment deleted successfully" });
  } catch (err) {
    next(err);
  }
});

module.exports = router;


