const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Send friend request
router.post('/send', async (req, res) => {
  const { fromId, toId } = req.body;

  try {
    const fromUser = await User.findById(fromId);
    const toUser = await User.findById(toId);

    if (!toUser.friendRequests.includes(fromId)) {
      toUser.friendRequests.push(fromId);
      await toUser.save();
    }

    if (!fromUser.sentRequests.includes(toId)) {
      fromUser.sentRequests.push(toId);
      await fromUser.save();
    }

    res.json({ success: true, message: 'Friend request sent.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Accept friend request
router.post('/accept', async (req, res) => {
  const { userId, requesterId } = req.body;

  try {
    const user = await User.findById(userId);
    const requester = await User.findById(requesterId);

    user.friends.push(requesterId);
    requester.friends.push(userId);

    user.friendRequests = user.friendRequests.filter(id => id != requesterId);
    requester.sentRequests = requester.sentRequests.filter(id => id != userId);

    await user.save();
    await requester.save();

    res.json({ success: true, message: 'Friend request accepted.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Reject friend request
router.post('/reject', async (req, res) => {
  const { userId, requesterId } = req.body;

  try {
    const user = await User.findById(userId);
    const requester = await User.findById(requesterId);

    user.friendRequests = user.friendRequests.filter(id => id != requesterId);
    requester.sentRequests = requester.sentRequests.filter(id => id != userId);

    await user.save();
    await requester.save();

    res.json({ success: true, message: 'Friend request rejected.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Cancel sent friend request
router.post('/cancel', async (req, res) => {
  const { fromId, toId } = req.body;

  try {
    const fromUser = await User.findById(fromId);
    const toUser = await User.findById(toId);

    fromUser.sentRequests = fromUser.sentRequests.filter(id => id != toId);
    toUser.friendRequests = toUser.friendRequests.filter(id => id != fromId);

    await fromUser.save();
    await toUser.save();

    res.json({ success: true, message: 'Friend request cancelled.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
