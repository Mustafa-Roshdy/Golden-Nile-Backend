const TripPlan = require("../models/tripPlanSchema.js");

// CREATE TripPlan
async function createTripPlan(data) {
  return await TripPlan.create(data);
}

// GET all TripPlans
async function getAllTripPlans() {
  return await TripPlan.find().populate("user");
}

// GET TripPlans by user
async function getTripPlansByUser(userId) {
  return await TripPlan.find({ user: userId }).populate("user");
}

// GET TripPlan by id
async function getTripPlanById(id) {
  return await TripPlan.findById(id).populate("user");
}

// UPDATE TripPlan
async function updateTripPlan(id, newData) {
  return await TripPlan.findByIdAndUpdate(id, newData, { new: true });
}

// DELETE TripPlan
async function deleteTripPlan(id) {
  return await TripPlan.findByIdAndDelete(id);
}

module.exports = {
  createTripPlan,
  getAllTripPlans,
  getTripPlansByUser,
  getTripPlanById,
  updateTripPlan,
  deleteTripPlan,
};
