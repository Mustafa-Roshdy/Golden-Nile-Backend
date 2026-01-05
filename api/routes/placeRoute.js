const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const placeController = require("../controllers/placeController.js");
const placeValidation = require("../validation/placeValidation.js");
const { protect, authorizeRoles } = require("../middleware/authMiddleware.js");

// Multer storage for image uploads
const uploadsDir = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, uniqueSuffix + ext);
  },
});
const upload = multer({ storage });

// CREATE Place (admin only)
router.post("/place/create", protect, authorizeRoles("admin"), upload.array("images", 10), async (req, res) => {
  try {
    // Preprocess req.body to convert strings to proper types for validation
    const processedBody = { ...req.body };
    
    // Convert numeric fields
    if (req.body.rooms) processedBody.rooms = Number(req.body.rooms);
    if (req.body.latitude) processedBody.latitude = Number(req.body.latitude);
    if (req.body.longitude) processedBody.longitude = Number(req.body.longitude);
    if (req.body.pricePerNight) processedBody.pricePerNight = Number(req.body.pricePerNight);
    if (req.body.pricePerTable) processedBody.pricePerTable = Number(req.body.pricePerTable);
    if (req.body.chairsPerTable) processedBody.chairsPerTable = Number(req.body.chairsPerTable);
    // if (req.body.rating) processedBody.rating = Number(req.body.rating);
    
    // Convert cuisine array if type is restaurant
    if (req.body.type === "restaurant" && req.body.cuisine) {
      processedBody.cuisine = Array.isArray(req.body.cuisine) 
        ? req.body.cuisine 
        : typeof req.body.cuisine === 'string' 
          ? [req.body.cuisine] 
          : [];
    }
    processedBody.governorate = req.body.governorate;
    const { error } = placeValidation.validate(processedBody);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    // Build image URLs from uploaded files
    const images = Array.isArray(req.files)
      ? req.files.map((f) => `${req.protocol}://${req.get("host")}/uploads/${f.filename}`)
      : [];

    // Add createdBy from authenticated user and images to request body
    const placeData = {
      ...processedBody,
      createdBy: req.user.id,
      images: images
    };

    const place = await placeController.createPlace(placeData);
    res.status(201).json({ success: true, data: place });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// READ all Places (public)
router.get("/place", async (req, res) => {
  try {
    const places = await placeController.getAllPlaces();
    res.status(200).json({ success: true, count: places.length, data: places });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// READ all Guest Houses (public)
router.get("/place/type/guest_house", async (req, res) => {
  try {
    const guestHouses = await placeController.getAllGuestHouses();
    res.status(200).json({ success: true, count: guestHouses.length, data: guestHouses });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// READ all Restaurants (public)
router.get("/place/type/restaurant", async (req, res) => {
  try {
    const restaurants = await placeController.getAllRestaurants();
    res.status(200).json({ success: true, count: restaurants.length, data: restaurants });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// READ places by governorate (public)
router.get("/place/governorate/:governorate", async (req, res) => {
  try {
    const places = await placeController.getPlacesByGovernorate(req.params.governorate);
    res.status(200).json({ success: true, count: places.length, data: places });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// READ places by creator (admin only)
router.get("/place/creator/:userId", protect, authorizeRoles("admin"), async (req, res) => {
  try {
    const places = await placeController.getPlacesByCreator(req.params.userId);
    res.status(200).json({ success: true, count: places.length, data: places });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// READ guest houses by creator (admin only)
router.get("/place/creator/:userId/guest_house", protect, authorizeRoles("admin"), async (req, res) => {
  try {
    const guestHouses = await placeController.getGuestHousesByCreator(req.params.userId);
    res.status(200).json({ success: true, count: guestHouses.length, data: guestHouses });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// READ restaurants by creator (admin only)
router.get("/place/creator/:userId/restaurant", protect, authorizeRoles("admin"), async (req, res) => {
  try {
    const restaurants = await placeController.getRestaurantsByCreator(req.params.userId);
    res.status(200).json({ success: true, count: restaurants.length, data: restaurants });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// READ Place by id (public)
router.get("/place/:id", async (req, res) => {
  try {
    const place = await placeController.getPlaceById(req.params.id);
    if (!place) {
      return res.status(404).json({ success: false, message: "Place not found" });
    }
    res.status(200).json({ success: true, data: place });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// UPDATE Place (admin only)
router.put("/place/:id", protect, authorizeRoles("admin"), upload.array("images", 10), async (req, res) => {
  try {
    // Preprocess req.body to convert strings to proper types
    let updatedData = { ...req.body };
    
    // Convert numeric fields if present
    if (req.body.rooms) updatedData.rooms = Number(req.body.rooms);
    if (req.body.latitude) updatedData.latitude = Number(req.body.latitude);
    if (req.body.longitude) updatedData.longitude = Number(req.body.longitude);
    if (req.body.pricePerNight) updatedData.pricePerNight = Number(req.body.pricePerNight);
    if (req.body.pricePerTable) updatedData.pricePerTable = Number(req.body.pricePerTable);
    if (req.body.chairsPerTable) updatedData.chairsPerTable = Number(req.body.chairsPerTable);
    if (req.body.rating) updatedData.rating = Number(req.body.rating);
    
    // Convert cuisine array if type is restaurant
    if (req.body.type === "restaurant" && req.body.cuisine) {
      updatedData.cuisine = Array.isArray(req.body.cuisine) 
        ? req.body.cuisine 
        : typeof req.body.cuisine === 'string' 
          ? [req.body.cuisine] 
          : [];
    }
    
    // Build image URLs from uploaded files if any
    if (req.files && req.files.length > 0) {
      const images = req.files.map((f) => `${req.protocol}://${req.get("host")}/uploads/${f.filename}`);
      updatedData.images = images;
    }

    const place = await placeController.updatePlace(req.params.id, updatedData);
    if (!place) {
      return res.status(404).json({ success: false, message: "Place not found" });
    }
    res.status(200).json({
      success: true,
      message: "Place updated successfully",
      data: place,
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// UPDATE Place availability (admin only)
router.put("/place/:id/availability", protect, authorizeRoles("admin"), async (req, res) => {
  try {
    const { isAvailable } = req.body;
    
    if (typeof isAvailable !== 'boolean') {
      return res.status(400).json({ 
        success: false, 
        message: "isAvailable must be a boolean value" 
      });
    }

    const place = await placeController.updatePlace(req.params.id, { isAvailable });
    if (!place) {
      return res.status(404).json({ success: false, message: "Place not found" });
    }
    res.status(200).json({
      success: true,
      message: `Place availability set to ${isAvailable ? 'available' : 'unavailable'}`,
      data: place,
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// UPDATE Place operating hours (admin only)
router.put("/place/:id/operating-hours", protect, authorizeRoles("admin"), async (req, res) => {
  try {
    const { operatingHours } = req.body;
    
    if (!operatingHours || typeof operatingHours !== 'object') {
      return res.status(400).json({ 
        success: false, 
        message: "operatingHours must be an object" 
      });
    }

    const place = await placeController.updatePlace(req.params.id, { operatingHours });
    if (!place) {
      return res.status(404).json({ success: false, message: "Place not found" });
    }
    res.status(200).json({
      success: true,
      message: "Operating hours updated successfully",
      data: place,
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// DELETE Place (admin only)
router.delete("/place/:id", protect, authorizeRoles("admin"), async (req, res) => {
  try {
    const place = await placeController.deletePlace(req.params.id);
    if (!place) {
      return res.status(404).json({ success: false, message: "Place not found" });
    }
    res.status(200).json({ success: true, message: "Place deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// LIKE Place (authenticated user)
router.post("/place/:id/like", protect, async (req, res) => {
  try {
    const place = await placeController.likePlace(req.params.id, req.user.id);
    res.status(200).json({ success: true, data: place });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// DISLIKE Place (authenticated user)
router.post("/place/:id/dislike", protect, async (req, res) => {
  try {
    const place = await placeController.dislikePlace(req.params.id, req.user.id);
    res.status(200).json({ success: true, data: place });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});


module.exports = router;