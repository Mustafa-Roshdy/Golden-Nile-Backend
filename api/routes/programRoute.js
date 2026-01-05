const express = require("express");
const router = express.Router();
const programController = require("../controllers/programController.js");
const { protect, authorizeRoles } = require("../middleware/authMiddleware.js");

// CREATE Program (logged-in users only)
router.post("/program/create", protect, async (req, res) => {
  try {
    // ensure program is linked to logged-in user
    const programData = { ...req.body, user: req.user.id };
    const program = await programController.createProgram(programData);
    res.status(201).json({ success: true, data: program });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// READ all Programs (admin only)
router.get("/program", protect, authorizeRoles("admin","supervisor"), async (req, res) => {
  try {
    console.log(req.user);
    const programs = await programController.getAllPrograms();
    
    res.status(200).json({
      success: true,
      count: programs.length,
      data: programs,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// READ Programs by User (logged-in users can see theirs)
router.get("/program/user/:userId", protect, async (req, res) => {
  try {
    const programs = await programController.getProgramsByUser(req.params.userId);
    res.status(200).json({
      success: true,
      count: programs.length,
      data: programs,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// READ Program by id (public)
router.get("/program/:id", async (req, res) => {
  try {
    const program = await programController.getProgramById(req.params.id);
    if (!program) {
      return res.status(404).json({ success: false, message: "Program not found" });
    }
    res.status(200).json({ success: true, data: program });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// UPDATE Program (only logged-in users can update their own programs)
router.put("/program/:id", protect, async (req, res) => {
  try {
    const program = await programController.getProgramById(req.params.id);
    if (!program) {
      return res.status(404).json({ success: false, message: "Program not found" });
    }

    // Check if user owns the program
    if (program.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: "Not authorized to update this program" });
    }

    const updatedProgram = await programController.updateProgram(req.params.id, req.body);
    res.status(200).json({
      success: true,
      message: "Program updated successfully",
      data: updatedProgram,
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// DELETE Program (only logged-in users can delete their own programs)
router.delete("/program/:id",protect, async (req, res) => {
  try {
    // const program = await programController.getProgramById(req.params.id);
    // if (!program) {
    //   return res.status(404).json({ success: false, message: "Program not found" });
    // }

    // // Check if user owns the program
    // if (program.user.toString() !== req.user.id && req.user.role !== 'admin') {
    //   return res.status(403).json({ success: false, message: "Not authorized to delete this program" });
    // }

    await programController.deleteProgram(req.params.id);
    res.status(200).json({ success: true, message: "Program deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
