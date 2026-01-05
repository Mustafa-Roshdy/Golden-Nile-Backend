const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController.js");
const userValidation = require("../validation/userValidation.js");
const { protect } = require("../middleware/authMiddleware.js");
const multer = require("multer");
const path = require("path");
const jwt = require("jsonwebtoken");

// avatar storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, "..", "uploads")),
  filename: (req, file, cb) => cb(null, `avatar_${req.user.id}_${Date.now()}${path.extname(file.originalname)}`),
});
const upload = multer({ storage });

// CREATE user
router.post("/user/create", async (req, res) => {
  const { error } = userValidation.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  try {
    const user = await userController.createUser(req.body);
    res.status(201).json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// READ all users
router.get("/user", async (req, res) => {
  try {
    const users = await userController.getAllUsers();
    res.status(200).json({ success: true, count: users.length, data: users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// READ user by id
router.get("/user/:id", async (req, res) => {
  try {
    const user = await userController.getUserById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    res.status(200).json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// READ user by email
router.get("/user/email/:email", async (req, res) => {
  try {
    const user = await userController.getUserByEmail(req.params.email);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    res.status(200).json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// UPDATE user
router.put("/user/:id", async (req, res) => {
  try {
    const user = await userController.updateUser(req.params.id, req.body);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    res.status(200).json({
      success: true,
      message: "User updated successfully",
      data: user,
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// DELETE user
router.delete("/user/:id", async (req, res) => {
  try {
    const user = await userController.deleteUser(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    res.status(200).json({ success: true, message: "User deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});



// Protected: current user profile
router.get("/user/profile", protect,  async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, message: "Not authorized" });
    }
    let user;
    try {
      user = await userController.getUserById(req.user.id);
    } catch (err) {
      return res.status(400).json({ success: false, message: "Invalid user id" });
    }
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    const u = user.toObject();
    delete u.password;
    if (!u.photo) {
      u.photo = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(u.email || u.firstName || "User")}`;
    }
    res.status(200).json({ success: true, data: u });
  } catch (err) {
    console.error("Error in /user/profile:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// Protected: upload profile photo
router.post("/user/profile/photo", protect, upload.single("photo"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: "No file uploaded" });
    const photoUrl = `/uploads/${req.file.filename}`;
    const updated = await userController.updateUser(req.user.id, { photo: photoUrl });
    res.status(200).json({ success: true, photo: photoUrl, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// CHECK token
router.post("/admin/check", async (req, res) => {
  const { token } = req.body;
  if (!token) {
    return res.status(400).json({ success: false, message: "Token is required" });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "your_jwt_secret_here");
    res.status(200).json({ success: true, data: decoded });
  } catch (err) {
    res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
});

module.exports = router;