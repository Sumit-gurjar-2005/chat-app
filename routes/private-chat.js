//console.log("hi");

const express = require('express');
const router = express.Router();
const PrivateMessage = require('../models/PrivateMessage');
const User = require('../models/User');

// Send private message
router.post('/send', async (req, res) => {
  try {
    const { senderId, receiverId, text, media } = req.body;

    const newMessage = new PrivateMessage({
      sender: senderId,
      receiver: receiverId,
      text,
      media: media || ''
    });

    await newMessage.save();

    res.status(200).json({ success: true, message: 'Message sent' });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to send message' });
  }
});

// Fetch chat between two users
router.get('/chat/:user1/:user2', async (req, res) => {
  try {
    const { user1, user2 } = req.params;

    const messages = await PrivateMessage.find({
      $or: [
        { sender: user1, receiver: user2 },
        { sender: user2, receiver: user1 }
      ]
    }).sort({ timestamp: 1 });

    res.status(200).json({ success: true, messages });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch messages' });
  }
});

module.exports = router;