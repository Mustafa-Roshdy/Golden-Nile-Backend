// routes/authRoute.js
const express = require("express");
const router = express.Router();
const { registerUser, loginUser, loginDashboard } = require("../controllers/authController.js");
const userValid = require("../validation/userValidation.js");
const Joi = require("joi");
const User=require('../models/userModel.js')

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

// REGISTER
router.post("/auth/register", async (req, res) => {
  const { error } = userValid.validate(req.body);
  if (error) return res.status(400).json({ success: false, message: error.details[0].message });

  try {
    const { user, token } = await registerUser(req.body);
    // hide password before sending
    const u = user.toObject();
    delete u.password;
    res.status(201).json({ success: true, data: u, token });
  } catch (err) {
    // handle duplicate email/userId errors
    if (err.code === 11000) {
      return res.status(400).json({ success: false, message: "Duplicate field value entered" });
    }
    res.status(500).json({ success: false, message: err.message });
  }
});

// LOGIN
router.post("/auth/login", async (req, res) => {
  const { error } = loginSchema.validate(req.body);
  if (error) return res.status(400).json({ success: false, message: error.details[0].message });
  
  try {
    const { user, token } = await loginUser(req.body.email, req.body.password);
    const u = user.toObject();
    delete u.password;
    res.status(200).json({ success: true, data: u, token });
  } catch (err) {
    res.status(401).json({ success: false, message: err.message });
  }
});

// DASHBOARD LOGIN (owner only)
router.post("/admin", async (req, res) => {
  const { error } = loginSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message
    });
  }

  try {
    // نجيب اليوزر الأول ونتأكد إنه موجود
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    //  شرط الـ role هنا
    if (user.role !== "supervisor") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Supervisors only."
      });
    }

    // لو role صح → نكمّل تسجيل الدخول
    const { user: loggedUser, token } = await loginUser(req.body.email, req.body.password);
    const u = loggedUser.toObject();
    delete u.password;
    
    return res.status(200).json({
      success: true,
      data: u,
      token
    });

  } catch (err) {
    return res.status(401).json({
      success: false,
      message: err.message
    });
  }
});

module.exports = router;
