const Place = require("../models/placeModel.js");

// CREATE Place
async function createPlace(data) {
  console.log("Data received in createPlace:", JSON.stringify(data, null, 2));
  try {
    const count = await Place.countDocuments();
    console.log("Current place count:", count);
    if (count >= 10) {
      throw new Error("Cannot create more than 10 places");
    }
    console.log("Attempting to create place...");
    const place = await Place.create(data);
    console.log("Place created successfully:", place._id);
    console.log("Attempting to populate and return place...");
    const populatedPlace = await Place.findById(place._id).populate("createdBy").populate({
      path: "reviews",
      populate: { path: "user", select: "firstName lastName email photo" }
    });
    console.log("Place populated successfully");
    return populatedPlace;
  } catch (error) {
    console.log("Error in createPlace:", error);
    throw error;
  }
}

// GET all Places
async function getAllPlaces() {
  return await Place.find().populate("createdBy").populate({
    path: "reviews",
    populate: { path: "user", select: "firstName lastName email photo" }
  });
}

// GET Place by id
async function getPlaceById(id) {
  return await Place.findById(id).populate("createdBy").populate({
    path: "reviews",
    populate: { path: "user", select: "firstName lastName email photo" }
  });
}

// UPDATE Place
async function updatePlace(id, newData) {
  return await Place.findByIdAndUpdate(id, newData, { new: true }).populate("createdBy").populate({
    path: "reviews",
    populate: { path: "user", select: "firstName lastName email photo" }
  });
}

// DELETE Place
async function deletePlace(id) {
  return await Place.findByIdAndDelete(id);
}

// GET places by creator (admin)
async function getPlacesByCreator(userId) {
  return await Place.find({ createdBy: userId }).populate("createdBy").populate({
    path: "reviews",
    populate: { path: "user", select: "firstName lastName email photo" }
  });
}

// GET guest houses by creator (admin)
async function getGuestHousesByCreator(userId) {
  return await Place.find({ createdBy: userId, type: "guest_house" }).populate("createdBy").populate({
    path: "reviews",
    populate: { path: "user", select: "firstName lastName email photo" }
  });
}

// GET restaurants by creator (admin)
async function getRestaurantsByCreator(userId) {
  return await Place.find({ createdBy: userId, type: "restaurant" }).populate("createdBy").populate({
    path: "reviews",
    populate: { path: "user", select: "firstName lastName email photo" }
  });
}

// GET all guest houses (public)
async function getAllGuestHouses() {
  return await Place.find({ type: "guest_house" }).populate("createdBy").populate({
    path: "reviews",
    populate: { path: "user", select: "firstName lastName email photo" }
  });
}

// GET all restaurants (public)
async function getAllRestaurants() {
  return await Place.find({ type: "restaurant" }).populate("createdBy").populate({
    path: "reviews",
    populate: { path: "user", select: "firstName lastName email photo" }
  });
}

// GET places by governorate (public)
async function getPlacesByGovernorate(governorate) {
  return await Place.find({ governorate }).populate("createdBy").populate({
    path: "reviews",
    populate: { path: "user", select: "firstName lastName email photo" }
  });
}

// LIKE Place
async function likePlace(id, userId) {
  const place = await Place.findById(id);
  if (!place) throw new Error("Place not found");

  const userIdStr = userId.toString();

  // Remove from dislikes if present
  place.dislikes = place.dislikes.filter(id => id.toString() !== userIdStr);

  // Toggle like
  const likeIndex = place.likes.findIndex(id => id.toString() === userIdStr);
  if (likeIndex > -1) {
    place.likes.splice(likeIndex, 1);
  } else {
    place.likes.push(userId);
  }

  await place.save();
  return await Place.findById(id).populate("createdBy").populate({
    path: "reviews",
    populate: { path: "user", select: "firstName lastName email photo" }
  });
}

// DISLIKE Place
async function dislikePlace(id, userId) {
  const place = await Place.findById(id);
  if (!place) throw new Error("Place not found");

  const userIdStr = userId.toString();

  // Remove from likes if present
  place.likes = place.likes.filter(id => id.toString() !== userIdStr);

  // Toggle dislike
  const dislikeIndex = place.dislikes.findIndex(id => id.toString() === userIdStr);
  if (dislikeIndex > -1) {
    place.dislikes.splice(dislikeIndex, 1);
  } else {
    place.dislikes.push(userId);
  }

  await place.save();
  return await Place.findById(id).populate("createdBy").populate({
    path: "reviews",
    populate: { path: "user", select: "firstName lastName email photo" }
  });
}

module.exports = {
  createPlace,
  getAllPlaces,
  getPlaceById,
  updatePlace,
  deletePlace,
  getPlacesByCreator,
  getGuestHousesByCreator,
  getRestaurantsByCreator,
  getAllGuestHouses,
  getAllRestaurants,
  getPlacesByGovernorate,
  likePlace,
  dislikePlace,
};