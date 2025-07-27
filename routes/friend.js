// routes/friend.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const mongoose = require('mongoose');

const FriendRequest = mongoose.model('FriendRequest', new mongoose.Schema({
  from: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  to: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: String // pending, accepted, rejected
}));

// Send friend request
router.post('/send-request', async (req, res) => {
  const from = req.session.userId;
  const to = req.body.to;

  const alreadyExists = await FriendRequest.findOne({ from, to });
  if (alreadyExists) return res.status(400).json({ message: 'Request already sent' });

  const newRequest = new FriendRequest({ from, to, status: 'pending' });
  await newRequest.save();
  res.json({ message: 'Friend request sent' });
});

// Cancel friend request
router.post('/cancel-request', async (req, res) => {
  const from = req.session.userId;
  const to = req.body.to;

  await FriendRequest.findOneAndDelete({ from, to, status: 'pending' });
  res.json({ message: 'Request canceled' });
});

// Accept friend request
router.post('/accept-request', async (req, res) => {
  const to = req.session.userId;
  const from = req.body.from;

  await FriendRequest.findOneAndUpdate({ from, to, status: 'pending' }, { status: 'accepted' });
  res.json({ message: 'Friend request accepted' });
});

// Reject friend request
router.post('/reject-request', async (req, res) => {
  const to = req.session.userId;
  const from = req.body.from;

  await FriendRequest.findOneAndUpdate({ from, to, status: 'pending' }, { status: 'rejected' });
  res.json({ message: 'Friend request rejected' });
});

// ✅ All data for current user
router.get('/all', async (req, res) => {
  const currentUser = req.session.userId;
  if (!currentUser) return res.status(401).json({ message: 'Unauthorized' });

  const allUsers = await User.find({ _id: { $ne: currentUser } });

  const sent = await FriendRequest.find({ from: currentUser, status: 'pending' }).populate('to');
  const received = await FriendRequest.find({ to: currentUser, status: 'pending' }).populate('from');
  const friends = await FriendRequest.find({
    $or: [{ from: currentUser }, { to: currentUser }],
    status: 'accepted'
  }).populate('from to');

  const sentRequests = sent.map(req => req.to);
  const receivedRequests = received.map(req => req.from);
  const friendsList = friends.map(req =>
    String(req.from._id) === currentUser ? req.to : req.from
  );

  res.json({
    allUsers,
    sentRequests,
    receivedRequests,
    friends: friendsList
  });
});

module.exports = router;
