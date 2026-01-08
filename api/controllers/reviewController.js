const Review = require("../models/reviewModel.js");
const Place = require("../models/placeModel.js");

// Create a review
async function createReview(data) {
  const count = await Review.countDocuments();
  if (count >= 15) {
    throw new Error("Cannot create more than 15 reviews");
  }
  const review = await Review.create(data);

  // Add review to place's reviews array
  await Place.findByIdAndUpdate(data.place, {
    $push: { reviews: review._id }
  });

  return await Review.findById(review._id)
    .populate("user", "firstName lastName email photo")
    .populate("place");
}

// Get reviews for a place
async function getReviewsByPlace(placeId) {
  return await Review.find({ place: placeId })
    .populate("user", "firstName lastName email photo")
    .sort({ createdAt: -1 });
}

// Get reviews by user
async function getReviewsByUser(userId) {
  return await Review.find({ user: userId })
    .populate("place", "name type")
    .sort({ createdAt: -1 });
}

// Get single review
async function getReview(id) {
  return await Review.findById(id)
    .populate("user", "firstName lastName email photo")
    .populate("place", "name type");
}

// Update review
async function updateReview(id, newData) {
  return await Review.findByIdAndUpdate(id, newData, { new: true })
    .populate("user", "firstName lastName email photo")
    .populate("place", "name type");
}

// Delete review
async function deleteReview(id) {
  const review = await Review.findById(id);
  if (!review) throw new Error("Review not found");

  // Remove from place's reviews array
  await Place.findByIdAndUpdate(review.place, {
    $pull: { reviews: id }
  });

  return await Review.findByIdAndDelete(id);
}

// Get all reviews
const getAllReviews = async (req, res) => {
  try {
    const reviews = await Review.find().populate('user', 'firstName lastName email').populate('place', 'name');
    res.json({ success: true, data: reviews });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createReview,
  getReviewsByPlace,
  getReviewsByUser,
  getReview,
  updateReview,
  deleteReview,
  getAllReviews,
};