const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const placeController = require("../controllers/placeController.js");
const placeValidation = require("../validation/placeValidation.js");
const { protect, authorizeRoles } = require("../middleware/authMiddleware.js");

// ----------------------
// Multer storage setup
// ----------------------
const uploadsDir = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

// ----------------------
// Helper functions
// ----------------------
function convertNumericFields(body) {
  const fields = ["rooms", "latitude", "longitude", "pricePerNight", "pricePerTable", "chairsPerTable", "rating"];
  fields.forEach(f => { if (body[f]) body[f] = Number(body[f]); });
}

function normalizeCuisine(body) {
  if (body.type === "restaurant" && body.cuisine) {
    body.cuisine = Array.isArray(body.cuisine)
      ? body.cuisine
      : typeof body.cuisine === 'string'
        ? [body.cuisine]
        : [];
  }
}

// ----------------------
// CREATE Place (admin only)
// ----------------------
router.post(
  "/place/create",
  protect,
  authorizeRoles("admin"),
  upload.array("images", 10),
  async (req, res) => {
    try {
      const processedBody = { ...req.body };
      convertNumericFields(processedBody);
      normalizeCuisine(processedBody);

      const { error } = placeValidation.validate(processedBody);
      if (error) return res.status(400).json({ error: error.details[0].message });

      const images = Array.isArray(req.files)
        ? req.files.map(f => `${req.protocol}://${req.get("host")}/uploads/${f.filename}`)
        : [];

      const placeData = { ...processedBody, createdBy: req.user.id, images };
      const place = await placeController.createPlace(placeData);

      res.status(201).json({ success: true, data: place });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
);

// ----------------------
// READ Routes (public)
// ----------------------
router.get("/place", async (req, res) => {
  try {
    const places = await placeController.getAllPlaces();
    res.status(200).json({ success: true, count: places.length, data: places });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

router.get("/place/type/guest_house", async (req, res) => {
  try {
    const guestHouses = await placeController.getAllGuestHouses();
    res.status(200).json({ success: true, count: guestHouses.length, data: guestHouses });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

router.get("/place/type/restaurant", async (req, res) => {
  try {
    const restaurants = await placeController.getAllRestaurants();
    res.status(200).json({ success: true, count: restaurants.length, data: restaurants });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

router.get("/place/governorate/:governorate", async (req, res) => {
  try {
    const places = await placeController.getPlacesByGovernorate(req.params.governorate);
    res.status(200).json({ success: true, count: places.length, data: places });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

router.get("/place/:id", async (req, res) => {
  try {
    const place = await placeController.getPlaceById(req.params.id);
    if (!place) return res.status(404).json({ success: false, message: "Place not found" });
    res.status(200).json({ success: true, data: place });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ----------------------
// READ Routes (admin only)
// ----------------------
router.get("/place/creator/:userId", protect, authorizeRoles("admin"), async (req, res) => {
  try {
    const places = await placeController.getPlacesByCreator(req.params.userId);
    res.status(200).json({ success: true, count: places.length, data: places });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

router.get("/place/creator/:userId/guest_house", protect, authorizeRoles("admin"), async (req, res) => {
  try {
    const guestHouses = await placeController.getGuestHousesByCreator(req.params.userId);
    res.status(200).json({ success: true, count: guestHouses.length, data: guestHouses });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

router.get("/place/creator/:userId/restaurant", protect, authorizeRoles("admin"), async (req, res) => {
  try {
    const restaurants = await placeController.getRestaurantsByCreator(req.params.userId);
    res.status(200).json({ success: true, count: restaurants.length, data: restaurants });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ----------------------
// UPDATE Place (admin only)
// ----------------------
router.put(
  "/place/:id",
  protect,
  authorizeRoles("admin"),
  upload.array("images", 10),
  async (req, res) => {
    try {
      const updatedData = { ...req.body };
      convertNumericFields(updatedData);
      normalizeCuisine(updatedData);

      if (req.files && req.files.length > 0) {
        const newImages = req.files.map(f => `${req.protocol}://${req.get("host")}/uploads/${f.filename}`);
        // Append new images instead of replacing
        const existingPlace = await placeController.getPlaceById(req.params.id);
        updatedData.images = [...(existingPlace?.images || []), ...newImages];
      }

      const place = await placeController.updatePlace(req.params.id, updatedData);
      if (!place) return res.status(404).json({ success: false, message: "Place not found" });

      res.status(200).json({ success: true, message: "Place updated successfully", data: place });
    } catch (err) {
      console.error(err);
      res.status(400).json({ success: false, message: err.message });
    }
  }
);

// ----------------------
// UPDATE Place availability
// ----------------------
router.put("/place/:id/availability", protect, authorizeRoles("admin"), async (req, res) => {
  try {
    const { isAvailable } = req.body;
    if (typeof isAvailable !== 'boolean') {
      return res.status(400).json({ success: false, message: "isAvailable must be a boolean value" });
    }

    const place = await placeController.updatePlace(req.params.id, { isAvailable });
    if (!place) return res.status(404).json({ success: false, message: "Place not found" });

    res.status(200).json({ success: true, message: `Place availability set to ${isAvailable ? 'available' : 'unavailable'}`, data: place });
  } catch (err) {
    console.error(err);
    res.status(400).json({ success: false, message: err.message });
  }
});

// ----------------------
// UPDATE Place operating hours
// ----------------------
router.put("/place/:id/operating-hours", protect, authorizeRoles("admin"), async (req, res) => {
  try {
    const { operatingHours } = req.body;
    if (!operatingHours || typeof operatingHours !== 'object') {
      return res.status(400).json({ success: false, message: "operatingHours must be an object" });
    }

    const place = await placeController.updatePlace(req.params.id, { operatingHours });
    if (!place) return res.status(404).json({ success: false, message: "Place not found" });

    res.status(200).json({ success: true, message: "Operating hours updated successfully", data: place });
  } catch (err) {
    console.error(err);
    res.status(400).json({ success: false, message: err.message });
  }
});

// ----------------------
// DELETE Place
// ----------------------
router.delete("/place/:id", protect, authorizeRoles("admin"), async (req, res) => {
  try {
    const place = await placeController.deletePlace(req.params.id);
    if (!place) return res.status(404).json({ success: false, message: "Place not found" });

    res.status(200).json({ success: true, message: "Place deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ----------------------
// LIKE / DISLIKE Place
// ----------------------
router.post("/place/:id/like", protect, async (req, res) => {
  try {
    const place = await placeController.likePlace(req.params.id, req.user.id);
    res.status(200).json({ success: true, data: place });
  } catch (err) {
    console.error(err);
    res.status(400).json({ success: false, message: err.message });
  }
});

router.post("/place/:id/dislike", protect, async (req, res) => {
  try {
    const place = await placeController.dislikePlace(req.params.id, req.user.id);
    res.status(200).json({ success: true, data: place });
  } catch (err) {
    console.error(err);
    res.status(400).json({ success: false, message: err.message });
  }
});

module.exports = router;
