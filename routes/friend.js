// routes/friend.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Send friend request
router.post('/send-request', async (req, res) => {
  const { receiverId } = req.body;
  const senderId = req.session.userId;

  if (!senderId) return res.status(401).json({ message: 'Unauthorized' });

  const sender = await User.findById(senderId);
  const receiver = await User.findById(receiverId);

  if (!sender || !receiver) return res.status(404).json({ message: 'User not found' });

  if (
    receiver.friendRequests.includes(senderId) ||
    sender.sentRequests.includes(receiverId)
  ) {
    return res.status(400).json({ message: 'Request already sent' });
  }

  receiver.friendRequests.push(senderId);
  sender.sentRequests.push(receiverId);

  await receiver.save();
  await sender.save();

  res.json({ message: 'Friend request sent' });
});

// Cancel request
router.post('/cancel-request', async (req, res) => {
  const { receiverId } = req.body;
  const senderId = req.session.userId;

  const sender = await User.findById(senderId);
  const receiver = await User.findById(receiverId);

  receiver.friendRequests = receiver.friendRequests.filter(id => id != senderId);
  sender.sentRequests = sender.sentRequests.filter(id => id != receiverId);

  await receiver.save();
  await sender.save();

  res.json({ message: 'Request cancelled' });
});

// Accept request
router.post('/accept-request', async (req, res) => {
  const { senderId } = req.body;
  const receiverId = req.session.userId;

  const sender = await User.findById(senderId);
  const receiver = await User.findById(receiverId);

  receiver.friendRequests = receiver.friendRequests.filter(id => id != senderId);
  sender.sentRequests = sender.sentRequests.filter(id => id != receiverId);

  receiver.friends.push(senderId);
  sender.friends.push(receiverId);

  await receiver.save();
  await sender.save();

  res.json({ message: 'Friend request accepted' });
});

// Reject request
router.post('/reject-request', async (req, res) => {
  const { senderId } = req.body;
  const receiverId = req.session.userId;

  const sender = await User.findById(senderId);
  const receiver = await User.findById(receiverId);

  receiver.friendRequests = receiver.friendRequests.filter(id => id != senderId);
  sender.sentRequests = sender.sentRequests.filter(id => id != receiverId);

  await receiver.save();
  await sender.save();

  res.json({ message: 'Friend request rejected' });
});

module.exports = router;
