const express = require("express");
const router = express.Router();
const conversationController = require("../controllers/conversationController.js");
const { protect } = require("../middleware/authMiddleware.js");

// POST /conversation/id - create conversation ID
router.post("/conversation/id", protect, async (req, res) => {
  try {
    const conversation = await conversationController.createConversation(req.user.id);
    res.status(201).json({ success: true, data: { conversationId: conversation.conversationId } });
  } catch (error) {
    console.error('Error in /conversation/id POST:', error);
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

module.exports = router;