const express = require("express");
const router = express.Router();
const reviewController = require("../controllers/reviewController.js");
const { protect } = require("../middleware/authMiddleware.js");

// ==========================
// CREATE REVIEW
// ==========================
router.post("/review", protect, async (req, res) => {
  try {
    const { place, message } = req.body;
    if (!place || !message) {
      return res.status(400).json({ success: false, message: "Place and message are required" });
    }

    const reviewData = {
      place,
      user: req.user.id,
      message,
    };

    const review = await reviewController.createReview(reviewData);
    res.status(201).json({ success: true, data: review });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ==========================
// GET REVIEWS BY PLACE
// ==========================
router.get("/review/place/:placeId", async (req, res) => {
  try {
    const reviews = await reviewController.getReviewsByPlace(req.params.placeId);
    res.status(200).json({ success: true, count: reviews.length, data: reviews });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ==========================
// GET REVIEWS BY USER
// ==========================
router.get("/review/user/:userId", protect, async (req, res) => {
  try {
    const reviews = await reviewController.getReviewsByUser(req.params.userId);
    res.status(200).json({ success: true, count: reviews.length, data: reviews });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ==========================
// GET SINGLE REVIEW
// ==========================
router.get("/review/:id", async (req, res) => {
  try {
    const review = await reviewController.getReview(req.params.id);
    if (!review) {
      return res.status(404).json({ success: false, message: "Review not found" });
    }

    res.status(200).json({ success: true, data: review });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ==========================
// UPDATE REVIEW
// ==========================
router.put("/review/:id", protect, async (req, res) => {
  try {
    const review = await reviewController.getReview(req.params.id);
    if (!review) {
      return res.status(404).json({ success: false, message: "Review not found" });
    }

    // Check if user owns the review
    if (review.user._id.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ success: false, message: "Message is required" });
    }

    const updatedReview = await reviewController.updateReview(req.params.id, { message });
    res.status(200).json({ success: true, data: updatedReview });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ==========================
// DELETE REVIEW
// ==========================
router.delete("/review/:id", protect, async (req, res) => {
  try {
    const review = await reviewController.getReview(req.params.id);
    if (!review) {
      return res.status(404).json({ success: false, message: "Review not found" });
    }

    // Check if user owns the review
    if (review.user._id.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    await reviewController.deleteReview(req.params.id);
    res.status(200).json({ success: true, message: "Review deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;