// routes/private-chat.js
const express = require('express');
const router = express.Router();
const PrivateMessage = require('../models/PrivateMessage');
const User = require('../models/User');

// Get chat history with a friend
router.get('/chat/:friendId', async (req, res) => {
  const currentUser = req.session.userId;
  const friendId = req.params.friendId;

  if (!currentUser) return res.status(401).json({ error: 'Unauthorized' });

  const messages = await PrivateMessage.find({
    $or: [
      { from: currentUser, to: friendId },
      { from: friendId, to: currentUser }
    ]
  }).sort({ createdAt: 1 });

  res.json(messages);
});

// Send a new private message
router.post('/chat/:friendId', async (req, res) => {
  const from = req.session.userId;
  const to = req.params.friendId;
  const { content } = req.body;

  if (!from || !to || !content) return res.status(400).json({ error: 'Missing fields' });

  const newMessage = new PrivateMessage({ from, to, content });
  await newMessage.save();

  res.json({ success: true, message: 'Message sent' });
});

module.exports = router;
