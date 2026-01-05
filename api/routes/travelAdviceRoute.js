const express = require("express");
const router = express.Router();
const travelAdviceController = require("../controllers/travelAdviceController.js");
const conversationController = require("../controllers/conversationController.js");
const { protect } = require("../middleware/authMiddleware.js");

// POST /travel-advice - create travel advice
router.post("/travel-advice", protect, async (req, res) => {
  try {
    console.log('--- DEBUG START ---');
    console.log('Headers:', JSON.stringify(req.headers, null, 2));
    console.log('Body:', JSON.stringify(req.body, null, 2));
    console.log('User:', req.user);
    console.log('--- DEBUG END ---');

    let { message, conversationId } = req.body;

    if (!message) {
      console.error('Message is missing from request body');
      return res.status(400).json({
        error: 'Message is required',
        receivedBody: req.body,
        contentType: req.headers['content-type']
      });
    }

    // If no conversationId provided, create a new conversation
    if (!conversationId) {
      const conversation = await conversationController.createConversation(req.user.id);
      conversationId = conversation.conversationId;
    }

    const travelAdvice = await travelAdviceController.createTravelAdvice(req.user.id, message, conversationId);
    res.status(201).json({
      success: true,
      data: travelAdvice,
      response: travelAdvice.advice,
      conversationId: conversationId
    });
  } catch (error) {
    console.error('Error in /travel-advice POST:', error);
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

// GET /travel-advice - get travel advice for user
router.get("/travel-advice", protect, async (req, res) => {
  try {
    const travelAdvices = await travelAdviceController.getTravelAdviceByUser(req.user.id);
    res.status(200).json({ success: true, count: travelAdvices.length, data: travelAdvices });
  } catch (error) {
    console.error('Error in /travel-advice GET:', error);
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

module.exports = router;