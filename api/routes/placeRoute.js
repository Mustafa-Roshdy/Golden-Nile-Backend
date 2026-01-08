const express = require("express");
const router = express.Router();
const multer = require("multer");
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require("../config/cloudinary.js"); // your Cloudinary config
const placeController = require("../controllers/placeController.js");
const placeValidation = require("../validation/placeValidation.js");
const { protect, authorizeRoles } = require("../middleware/authMiddleware.js");

// ----------------------
// Configure Cloudinary Storage
// ----------------------
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "places",
    allowed_formats: ["jpg", "jpeg", "png"],
    transformation: [{ width: 1000, height: 800, crop: "limit" }],
  },
});

const upload = multer({ storage });

// ----------------------
// CREATE Place (admin only)
// ----------------------
router.post(
  "/place/create",
  protect,
  authorizeRoles("admin"),
  upload.array("images", 10),
  async (req, res) => {
    console.log("Starting place creation");
    console.log("req.body:", req.body);

    try {
      // Pre-process body to handle FormData array inconsistencies
      const rawBody = { ...req.body };

      // Handle cuisine parsing if it's a string (FormData often sends arrays as multiple keys or one string)
      if (rawBody.cuisine) {
        if (typeof rawBody.cuisine === 'string') {
          // If it mimics an array string like "['Italian', 'Mexican']" or just "Italian"
          rawBody.cuisine = rawBody.cuisine.includes(',')
            ? rawBody.cuisine.split(',').map(c => c.trim())
            : [rawBody.cuisine.trim()];
        }
      }

      // Convert numeric fields if they are strings (Joi does this too, but helper for safety)
      const numericFields = ["rooms", "latitude", "longitude", "pricePerNight", "pricePerTable", "chairsPerTable", "rating"];
      numericFields.forEach(field => {
        if (rawBody[field] && typeof rawBody[field] === 'string') {
          const val = Number(rawBody[field]);
          if (!isNaN(val)) rawBody[field] = val;
        }
      });

      // Validate with Joi which returns the clean object with conversions
      const { error, value } = placeValidation.validate(rawBody, { stripUnknown: true });

      if (error) {
        console.log("Validation error:", error.details[0].message);
        return res.status(400).json({ success: false, message: error.details[0].message });
      }

      console.log("Validation passed. Validated Value:", value);

      // Cloudinary image URLs
      const images = req.files ? req.files.map((file) => file.path) : [];

      const placeData = {
        ...value,
        createdBy: req.user.id,
        images,
      };

      // Validate createdBy
      if (!req.user || !req.user.id) {
        throw new Error('User not authenticated');
      }

      const place = await placeController.createPlace(placeData);
      console.log("Place created successfully:", place);
      res.status(201).json({ success: true, data: place });
    } catch (err) {
      console.error("Error in place creation:", err);
      // Check for Mongoose validation errors or manually thrown errors
      if (err.name === 'ValidationError' || (err.message && err.message.includes('must be'))) {
        return res.status(400).json({ success: false, message: err.message });
      }
      res.status(500).json({ success: false, message: err.message || "Internal Server Error" });
    }
  }
);

// ----------------------
// READ all Places (public)
// ----------------------
router.get("/place", async (req, res) => {
  try {
    const places = await placeController.getAllPlaces();
    res.status(200).json({ success: true, count: places.length, data: places });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ----------------------
// READ by type
// ----------------------
router.get("/place/type/guest_house", async (req, res) => {
  try {
    const guestHouses = await placeController.getAllGuestHouses();
    res.status(200).json({ success: true, count: guestHouses.length, data: guestHouses });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get("/place/type/restaurant", async (req, res) => {
  try {
    const restaurants = await placeController.getAllRestaurants();
    res.status(200).json({ success: true, count: restaurants.length, data: restaurants });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ----------------------
// READ by governorate
// ----------------------
router.get("/place/governorate/:governorate", async (req, res) => {
  try {
    const places = await placeController.getPlacesByGovernorate(req.params.governorate);
    res.status(200).json({ success: true, count: places.length, data: places });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ----------------------
// READ by creator (admin only)
// ----------------------
router.get("/place/creator/:userId", protect, authorizeRoles("admin"), async (req, res) => {
  try {
    const places = await placeController.getPlacesByCreator(req.params.userId);
    res.status(200).json({ success: true, count: places.length, data: places });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get(
  "/place/creator/:userId/guest_house",
  protect,
  authorizeRoles("admin"),
  async (req, res) => {
    try {
      const guestHouses = await placeController.getGuestHousesByCreator(req.params.userId);
      res.status(200).json({ success: true, count: guestHouses.length, data: guestHouses });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
);

router.get(
  "/place/creator/:userId/restaurant",
  protect,
  authorizeRoles("admin"),
  async (req, res) => {
    try {
      const restaurants = await placeController.getRestaurantsByCreator(req.params.userId);
      res.status(200).json({ success: true, count: restaurants.length, data: restaurants });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
);

// ----------------------
// READ Place by ID
// ----------------------
router.get("/place/:id", async (req, res) => {
  try {
    const place = await placeController.getPlaceById(req.params.id);
    if (!place) return res.status(404).json({ success: false, message: "Place not found" });
    res.status(200).json({ success: true, data: place });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
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
      let updatedData = { ...req.body };

      ["rooms", "latitude", "longitude", "pricePerNight", "pricePerTable", "chairsPerTable", "rating"].forEach(
        (field) => {
          if (req.body[field]) updatedData[field] = Number(req.body[field]);
        }
      );

      if (req.body.type === "restaurant" && req.body.cuisine) {
        updatedData.cuisine = Array.isArray(req.body.cuisine)
          ? req.body.cuisine
          : typeof req.body.cuisine === "string"
            ? [req.body.cuisine]
            : [];
      }

      // Cloudinary image URLs
      if (req.files && req.files.length > 0) {
        updatedData.images = req.files.map((file) => file.path);
      }

      const place = await placeController.updatePlace(req.params.id, updatedData);
      if (!place) return res.status(404).json({ success: false, message: "Place not found" });

      res.status(200).json({ success: true, message: "Place updated successfully", data: place });
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  }
);

// ----------------------
// UPDATE availability
// ----------------------
router.put("/place/:id/availability", protect, authorizeRoles("admin"), async (req, res) => {
  try {
    const { isAvailable } = req.body;
    if (typeof isAvailable !== "boolean")
      return res.status(400).json({ success: false, message: "isAvailable must be a boolean" });

    const place = await placeController.updatePlace(req.params.id, { isAvailable });
    if (!place) return res.status(404).json({ success: false, message: "Place not found" });

    res.status(200).json({
      success: true,
      message: `Place availability set to ${isAvailable ? "available" : "unavailable"}`,
      data: place,
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// ----------------------
// UPDATE operating hours
// ----------------------
router.put("/place/:id/operating-hours", protect, authorizeRoles("admin"), async (req, res) => {
  try {
    const { operatingHours } = req.body;
    if (!operatingHours || typeof operatingHours !== "object")
      return res.status(400).json({ success: false, message: "operatingHours must be an object" });

    const place = await placeController.updatePlace(req.params.id, { operatingHours });
    if (!place) return res.status(404).json({ success: false, message: "Place not found" });

    res.status(200).json({ success: true, message: "Operating hours updated successfully", data: place });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// ----------------------
// DELETE Place (admin only)
// ----------------------
router.delete("/place/:id", protect, authorizeRoles("admin"), async (req, res) => {
  try {
    const place = await placeController.deletePlace(req.params.id);
    if (!place) return res.status(404).json({ success: false, message: "Place not found" });
    res.status(200).json({ success: true, message: "Place deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ----------------------
// LIKE / DISLIKE (authenticated users)
// ----------------------
router.post("/place/:id/like", protect, async (req, res) => {
  try {
    const place = await placeController.likePlace(req.params.id, req.user.id);
    res.status(200).json({ success: true, data: place });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.post("/place/:id/dislike", protect, async (req, res) => {
  try {
    const place = await placeController.dislikePlace(req.params.id, req.user.id);
    res.status(200).json({ success: true, data: place });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

module.exports = router;
