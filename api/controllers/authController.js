// controllers/authController.js
const bcrypt = require("bcryptjs");
const User = require("../models/userModel.js");
const { signToken } = require("../middleware/authMiddleware.js");

// REGISTER
async function registerUser(data) {
  // hash password
  const salt = await bcrypt.genSalt(10);
  const hashed = await bcrypt.hash(data.password, salt);
  data.password = hashed;

  // create user
  const user = await User.create(data);

  // create token payload (_id and role and userId)
  const payload = {
    id: user._id,
    userId: user.userId,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    email: user.email,
     gender: user.gender,
  };

  const token = signToken(payload);
  return { user, token };
}

// LOGIN
async function loginUser(email, plainPassword) {
  const user = await User.findOne({ email });
  if (!user) throw new Error("Invalid credentials");

  const isMatch = await bcrypt.compare(plainPassword, user.password);
  if (!isMatch) throw new Error("Invalid credentials");

  const payload = {
    id: user._id,
    userId: user.userId,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    email: user.email,
    gender: user.gender,
  };

  const token = signToken(payload);
  return { user, token };
}

// LOGIN - Dashboard access (owner only)
async function loginDashboard(email, plainPassword) {
  // Find user by email
  const user = await User.findOne({ email });

  if (!user) {
    throw new Error("Invalid credentials");
  }

  // Check if user is owner (only owners can access dashboard)
  if (user.role !== 'owner') {
    throw new Error("Access denied. Dashboard access restricted to owner only.");
  }

  const isMatch = await bcrypt.compare(plainPassword, user.password);
  if (!isMatch) {
    throw new Error("Invalid credentials");
  }

  const payload = {
    id: user._id,
    role: user.role,
    // Include minimal data for security
  };

  const token = signToken(payload);
  return { user: { id: user._id, role: user.role }, token };
}

module.exports = { registerUser, loginUser, loginDashboard };
