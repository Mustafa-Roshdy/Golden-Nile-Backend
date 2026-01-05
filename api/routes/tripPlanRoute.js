const express = require("express");
const router = express.Router();
const tripPlanController = require("../controllers/tripPlanController.js");
const tripPlanValidation = require("../validation/tripPlanValidation.js");
const { protect, authorizeRoles } = require("../middleware/authMiddleware.js");

// CREATE TripPlan (logged-in users only)
router.post("/tripplan/create", protect, async (req, res) => {
  const { error } = tripPlanValidation.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  try {
    // ensure trip plan is linked to logged-in user
    const tripPlanData = { ...req.body, user: req.user.id };
    const tripPlan = await tripPlanController.createTripPlan(tripPlanData);
    res.status(201).json({ success: true, data: tripPlan });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// READ all TripPlans (public)
router.get("/tripplan", async (req, res) => {
  try {
    const tripPlans = await tripPlanController.getAllTripPlans();
    res.status(200).json({
      success: true,
      count: tripPlans.length,
      data: tripPlans,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// READ TripPlans by user (logged-in users can see theirs)
router.get("/tripplan/user/:userId", protect, async (req, res) => {
  try {
    const tripPlans = await tripPlanController.getTripPlansByUser(req.params.userId);
    res.status(200).json({
      success: true,
      count: tripPlans.length,
      data: tripPlans,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// READ TripPlan by id (public)
router.get("/tripplan/:id", async (req, res) => {
  try {
    const tripPlan = await tripPlanController.getTripPlanById(req.params.id);
    if (!tripPlan) {
      return res.status(404).json({ success: false, message: "TripPlan not found" });
    }
    res.status(200).json({ success: true, data: tripPlan });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// UPDATE TripPlan (only logged-in users)
router.put("/tripplan/:id", protect, async (req, res) => {
  try {
    const tripPlan = await tripPlanController.updateTripPlan(req.params.id, req.body);
    if (!tripPlan) {
      return res.status(404).json({ success: false, message: "TripPlan not found" });
    }
    res.status(200).json({
      success: true,
      message: "TripPlan updated successfully",
      data: tripPlan,
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// DELETE TripPlan (admin only)
router.delete("/tripplan/:id", protect, authorizeRoles("admin"), async (req, res) => {
  try {
    const tripPlan = await tripPlanController.deleteTripPlan(req.params.id);
    if (!tripPlan) {
      return res.status(404).json({ success: false, message: "TripPlan not found" });
    }
    res.status(200).json({ success: true, message: "TripPlan deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
