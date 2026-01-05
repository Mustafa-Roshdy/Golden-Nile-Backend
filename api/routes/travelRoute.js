const express = require("express");
const router = express.Router();
const travelController = require("../controllers/travelController.js");

// POST /api/travel/search
router.post("/travel/search", async (req, res) => {
  const { budget, destination, checkin, checkout, interests } = req.body;

  if (!budget || !destination || !checkin || !checkout || !interests) {
    return res.status(400).json({ error: 'budget, destination, checkin, checkout, interests are required' });
  }

  try {
    const result = await travelController.searchTrip(budget, destination, checkin, checkout, interests);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error('Error in travel search:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;