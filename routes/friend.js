const express = require('express');
const router = express.Router();
const User = require('../models/User');

// ✅ Send friend request
router.post('/send', async (req, res) => {
  const { fromId, toId } = req.body;

  try {
    const fromUser = await User.findById(fromId);
    const toUser = await User.findById(toId);

    if (!fromUser || !toUser) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    if (!toUser.friendRequests.includes(fromUser._id)) {
      toUser.friendRequests.push(fromUser._id);
      await toUser.save();
    }

    if (!fromUser.sentRequests.includes(toUser._id)) {
      fromUser.sentRequests.push(toUser._id);
      await fromUser.save();
    }

    res.json({ success: true, message: 'Friend request sent.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ✅ Accept friend request
router.post('/accept', async (req, res) => {
  const { userId, requesterId } = req.body;

  try {
    const user = await User.findById(userId);
    const requester = await User.findById(requesterId);

    if (!user || !requester) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    if (!user.friends.includes(requester._id)) {
      user.friends.push(requester._id);
    }

    if (!requester.friends.includes(user._id)) {
      requester.friends.push(user._id);
    }

    user.friendRequests = user.friendRequests.filter(id => id.toString() !== requesterId);
    requester.sentRequests = requester.sentRequests.filter(id => id.toString() !== userId);

    await user.save();
    await requester.save();

    res.json({ success: true, message: 'Friend request accepted.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ✅ Reject friend request
router.post('/reject', async (req, res) => {
  const { userId, requesterId } = req.body;

  try {
    const user = await User.findById(userId);
    const requester = await User.findById(requesterId);

    if (!user || !requester) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    user.friendRequests = user.friendRequests.filter(id => id.toString() !== requesterId);
    requester.sentRequests = requester.sentRequests.filter(id => id.toString() !== userId);

    await user.save();
    await requester.save();

    res.json({ success: true, message: 'Friend request rejected.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ✅ Cancel sent request
router.post('/cancel', async (req, res) => {
  const { fromId, toId } = req.body;

  try {
    const fromUser = await User.findById(fromId);
    const toUser = await User.findById(toId);

    if (!fromUser || !toUser) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    fromUser.sentRequests = fromUser.sentRequests.filter(id => id.toString() !== toId);
    toUser.friendRequests = toUser.friendRequests.filter(id => id.toString() !== fromId);

    await fromUser.save();
    await toUser.save();

    res.json({ success: true, message: 'Friend request cancelled.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;