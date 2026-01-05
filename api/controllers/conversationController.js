const Conversation = require("../models/conversationModel.js");
const crypto = require("crypto");

// Create conversation ID
async function createConversation(userId) {
  try {
    // Generate a unique conversation ID locally
    const conversationId = `conv_${crypto.randomUUID()}`;

    // Save to database
    const conversation = await Conversation.create({
      user: userId,
      conversationId
    });

    return conversation;
  } catch (error) {
    console.error('Error creating conversation:', error);
    throw error;
  }
}

// Get all conversations
const getAllConversations = async (req, res) => {
  try {
    const conversations = await Conversation.find().populate('user', 'firstName lastName email');
    res.json({ success: true, data: conversations });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete conversation
const deleteConversation = async (req, res) => {
  try {
    const conversation = await Conversation.findByIdAndDelete(req.params.id);
    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }
    res.json({ success: true, message: 'Conversation deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createConversation,
  getAllConversations,
  deleteConversation,
};