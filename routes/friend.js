




// routes/friend.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');


router.get('/test', (req, res) => {
  res.send('Friend route working!');
});


// Send friend request
router.post('/send-request', async (req, res) => {
  const { receiverId } = req.body;
  const senderId = req.session.userId;

  if (!senderId) return res.status(401).json({ message: 'Unauthorized' });

  try {
    const sender = await User.findById(senderId);
    const receiver = await User.findById(receiverId);

    if (!sender || !receiver) return res.status(404).json({ message: 'User not found' });

    if (
      sender.sentRequests.includes(receiverId) ||
      sender.friends.includes(receiverId)
    ) {
      return res.status(400).json({ message: 'Already sent or already friends' });
    }

    sender.sentRequests.push(receiverId);
    receiver.friendRequests.push(senderId);

    await sender.save();
    await receiver.save();

    res.status(200).json({ message: 'Friend request sent' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Cancel friend request
router.post('/cancel-request', async (req, res) => {
  const { receiverId } = req.body;
  const senderId = req.session.userId;

  if (!senderId) return res.status(401).json({ message: 'Unauthorized' });

  try {
    await User.findByIdAndUpdate(senderId, {
      $pull: { sentRequests: receiverId }
    });
    await User.findByIdAndUpdate(receiverId, {
      $pull: { friendRequests: senderId }
    });

    res.status(200).json({ message: 'Friend request cancelled' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Accept friend request
router.post('/accept-request', async (req, res) => {
  const { senderId } = req.body;
  const receiverId = req.session.userId;

  if (!receiverId) return res.status(401).json({ message: 'Unauthorized' });

  try {
    await User.findByIdAndUpdate(receiverId, {
      $pull: { friendRequests: senderId },
      $push: { friends: senderId }
    });
    await User.findByIdAndUpdate(senderId, {
      $pull: { sentRequests: receiverId },
      $push: { friends: receiverId }
    });

    res.status(200).json({ message: 'Friend request accepted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Reject friend request
router.post('/reject-request', async (req, res) => {
  const { senderId } = req.body;
  const receiverId = req.session.userId;

  if (!receiverId) return res.status(401).json({ message: 'Unauthorized' });

  try {
    await User.findByIdAndUpdate(receiverId, {
      $pull: { friendRequests: senderId }
    });
    await User.findByIdAndUpdate(senderId, {
      $pull: { sentRequests: receiverId }
    });

    res.status(200).json({ message: 'Friend request rejected' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
