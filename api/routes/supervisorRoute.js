const express = require('express');
const router = express.Router();
const Booking = require('../models/bookingModel.js');
const jwt = require("jsonwebtoken");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const Post = require("../models/postModel.js");
const User = require("../models/userModel.js");
const { protect } = require("../middleware/authMiddleware.js");
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require("../config/cloudinary.js");

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
    folder: "supervisor_posts",
    allowedFormats: ["jpg", "jpeg", "png"], // v4 uses allowedFormats
    transformation: [{ width: 1000, height: 1000, crop: "limit" }],
  },
});
const upload = multer({ storage });

// Import controller functions
const {
  createUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser
} = require('../controllers/userController');

const {
  createPlace,
  getAllPlaces,
  getPlaceById,
  updatePlace,
  deletePlace
} = require('../controllers/placeController');

const {

  createBooking,
  getAllBookings,
  updateBooking,
  deleteBooking
} = require('../controllers/bookingController');

const {
  createTripPlan,
  getAllTripPlans,
  getTripPlanById,
  updateTripPlan,
  deleteTripPlan
} = require('../controllers/tripPlanController');

const {
  createContact,
  deleteContact
} = require('../controllers/contactController');


const {
  createProgram,
  getAllPrograms,
  getProgramById,
  updateProgram,
  deleteProgram
} = require('../controllers/programController');

const {
  getAttractions,
  getAttractionById,
  createAttraction,
  updateAttraction,
  deleteAttraction
} = require('../controllers/attractionController');

const {
  createConversation,
  getAllConversations,
  deleteConversation
} = require('../controllers/conversationController');

const {
  createFakePayment,
  getAllPayments,
  deletePayment
} = require('../controllers/paymentController');

const {
  createTravelAdvice,
  getTravelAdviceByUser,
  getAllTravelAdvice,
  deleteTravelAdvice
} = require('../controllers/travelAdviceController');

const {
  createReview,
  getReviewsByPlace,
  getReviewsByUser,
  getReview,
  updateReview,
  deleteReview,
  getAllReviews
} = require('../controllers/reviewController');

// Posts routes
router.get('/users', async (req, res) => {
  try {
    const users = await getAllUsers();
    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
router.get('/users/:id', getUserById);
router.post('/users', async (req, res) => {
  try {
    const result = await createUser(req.body);
    req.app.get("io").emit("usersCreated");
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});
router.put('/users/:id', updateUser);
router.delete('/users/:id', async (req, res) => {
  try {
    await deleteUser(req.params.id);
    req.app.get("io").emit("usersDeleted", { id: req.params.id });
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Places routes
router.get('/places', async (req, res) => {
  try {
    const places = await getAllPlaces();
    res.json({ success: true, data: places });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
router.get('/places/:id', getPlaceById);
router.post('/places', async (req, res) => {
  try {
    const result = await createPlace(req.body);
    req.app.get("io").emit("placesCreated");
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});
router.put('/places/:id', updatePlace);
router.delete('/places/:id', async (req, res) => {
  try {
    await deletePlace(req.params.id);
    req.app.get("io").emit("placesDeleted", { id: req.params.id });
    res.json({ success: true, message: 'Place deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Booking routes
router.get('/bookings', async (req, res) => {
  try {
    const bookings = await getAllBookings();
    res.json({ success: true, data: bookings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
router.post('/bookings', async (req, res) => {
  try {
    const result = await createBooking(req.body);
    req.app.get("io").emit("bookingsCreated");
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});
router.put('/bookings/:id', updateBooking);
router.delete('/bookings/:id', async (req, res) => {
  try {
    await deleteBooking(req.params.id);
    req.app.get("io").emit("bookingsDeleted", { id: req.params.id });
    res.json({ success: true, message: 'Booking deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Trip Plan routes
// router.get('/tripplan', async (req, res) => {
//   try {
//     const tripPlans = await getAllTripPlans();
//     res.status(200).json({
//       success: true,
//       count: tripPlans.length,
//       data: tripPlans,
//     });
//   } catch (err) {
//     res.status(500).json({ success: false, message: err.message });
//   }
// });
router.get('/tripplan', getAllTripPlans);
router.get('/trip-plans/:id', getTripPlanById);
router.post('/trip-plans', createTripPlan);
router.put('/trip-plans/:id', updateTripPlan);
router.delete('/trip-plans/:id', async (req, res) => {
  try {
    await deleteTripPlan(req.params.id);
    req.app.get("io").emit("tripPlansDeleted", { id: req.params.id });
    res.json({ success: true, message: 'Trip plan deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Contact routes

router.post('/contacts', createContact);

router.delete('/contacts/:id', async (req, res) => {
  try {
    await deleteContact(req.params.id);
    req.app.get("io").emit("contactsDeleted", { id: req.params.id });
    res.json({ success: true, message: 'Contact deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Programs routes
router.get('/program/dashboard', async (req, res) => {
  try {
    const programs = await getAllPrograms();
    res.status(200).json({
      success: true,
      count: programs.length,
      data: programs,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: err.message });
  }
});
router.get('/programs/:id', getProgramById);
router.post('/programs', async (req, res) => {
  try {
    const result = await createProgram(req.body);
    req.app.get("io").emit("programsCreated");
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});
router.put('/programs/:id', updateProgram);
router.delete('/programs/:id', async (req, res) => {
  try {
    await deleteProgram(req.params.id);
    req.app.get("io").emit("programsDeleted", { id: req.params.id });
    res.json({ success: true, message: 'Program deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Attractions routes
router.get('/attractions', async (req, res) => {
  try {
    const attractions = await getAttractions(req.query);
    res.json({ success: true, data: attractions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
router.delete('/attractions/:id', async (req, res) => {
  try {
    await deleteAttraction(req.params.id);
    req.app.get("io").emit("attractionsDeleted", { id: req.params.id });
    res.json({ success: true, message: 'Attraction deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});


// Conversations routes
router.get('/conversations', async (req, res) => {
  try {
    const conversations = await getAllConversations();
    res.json({ success: true, data: conversations });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
router.post('/conversations', async (req, res) => {
  try {
    const conversation = await createConversation(req.body.userId);
    res.status(201).json({ success: true, data: conversation });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});
router.delete('/conversations/:id', async (req, res) => {
  try {
    await deleteConversation(req.params.id);
    req.app.get("io").emit("conversationsDeleted", { id: req.params.id });
    res.json({ success: true, message: 'Conversation deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Payments routes
router.get('/payments', async (req, res) => {
  try {
    const payments = await getAllPayments();
    res.json({ success: true, data: payments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
router.post('/payments', async (req, res) => {
  try {
    const result = await createFakePayment(req.body, req.body.userId);
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});
router.delete('/payments/:id', async (req, res) => {
  try {
    await deletePayment(req.params.id);
    req.app.get("io").emit("paymentsDeleted", { id: req.params.id });
    res.json({ success: true, message: 'Payment deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Travel Advice routes
router.get('/travel-advices', async (req, res) => {
  try {
    const travelAdvices = await getAllTravelAdvice();
    res.json({ success: true, data: travelAdvices });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
router.post('/travel-advices', async (req, res) => {
  try {
    const advice = await createTravelAdvice(req.body.userId, req.body.message, req.body.conversationId);
    res.status(201).json({ success: true, data: advice });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});
router.delete('/travel-advices/:id', async (req, res) => {
  try {
    await deleteTravelAdvice(req.params.id);
    req.app.get("io").emit("travelAdvicesDeleted", { id: req.params.id });
    res.json({ success: true, message: 'Travel advice deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Reviews routes
router.get('/reviews', async (req, res) => {
  try {
    const reviews = await getAllReviews();
    res.json({ success: true, data: reviews });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
router.get('/reviews/:id', async (req, res) => {
  try {
    const review = await getReview(req.params.id);
    res.json({ success: true, data: review });
  } catch (error) {
    res.status(404).json({ success: false, message: error.message });
  }
});
router.post('/reviews', async (req, res) => {
  try {
    const review = await createReview(req.body);
    res.status(201).json({ success: true, data: review });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});
router.put('/reviews/:id', async (req, res) => {
  try {
    const review = await updateReview(req.params.id, req.body);
    res.json({ success: true, data: review });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});
router.delete('/reviews/:id', async (req, res) => {
  try {
    await deleteReview(req.params.id);
    req.app.get("io").emit("reviewsDeleted", { id: req.params.id });
    res.json({ success: true, message: 'Review deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Posts routes
router.get('/posts', async (req, res) => {
  try {
    const posts = await Post.find().populate('userId', 'firstName lastName email').populate('attachedProgram');
    res.json({ success: true, data: posts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
router.get('/posts/:id', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).populate('userId', 'firstName lastName email').populate('attachedProgram');
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });
    res.json({ success: true, data: post });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
router.post('/posts', async (req, res) => {
  try {
    const post = new Post(req.body);
    await post.save();
    res.status(201).json({ success: true, data: post });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});
router.put('/posts/:id', async (req, res) => {
  try {
    const post = await Post.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });
    res.json({ success: true, data: post });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});
router.delete('/posts/:id', async (req, res) => {
  try {
    const post = await Post.findByIdAndDelete(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });
    res.json({ success: true, message: 'Post deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/supervisor/posts - Create a new post (requires authentication)
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

    req.app.get("io").emit("postsCreated");

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

// GET /api/supervisor/posts/:id - return a single post populated with attachedProgram
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

// POST /api/supervisor/posts/:postId/attach-program - attach an existing program to a post
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

// GET /api/supervisor/posts
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

// GET /api/supervisor/stats/community - Members, Stories, Photos counts
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

// POST /api/supervisor/posts/:id/like (requires authentication) - Toggle like/unlike
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

// POST /api/supervisor/posts/:id/comment (requires authentication)
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
// PUT /api/supervisor/posts/:id (requires authentication) - Update post if owned by user
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

// DELETE /api/supervisor/posts/:id (requires authentication) - Delete post if owned by user
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

// PUT /api/supervisor/posts/:postId/comments/:commentId (requires authentication) - Update comment
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

// DELETE /api/supervisor/posts/:postId/comments/:commentId (requires authentication) - Delete comment
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
