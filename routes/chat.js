// routes/chat.js
const express = require('express');
const router = express.Router();
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const Message = require('../models/Message');


// Middleware to check login
function isAuthenticated(req, res, next) {
  if (req.session && req.session.user) {
    return next();
  } else {
    return res.redirect('/login');
  }
}

// Chat page (after login)
router.get('/', isAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, '../views/chat.html'));
});

// Ensure uploads folder exists
const uploadDir = path.join(__dirname, '../public/uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer config for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + file.originalname;
    cb(null, uniqueName);
  }
});
const upload = multer({ storage });

// Upload route
router.post('/upload', upload.single('media'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const filePath = '/uploads/' + req.file.filename;
  res.json({ filePath });
});

// ✅ NEW: Fetch all messages from MongoDB
router.get('/messages', async (req, res) => {
  try {
    const messages = await Message.find().sort({ timestamp: 1 }); // Oldest first
    res.json(messages);
  } catch (err) {
    console.error('Failed to load messages:', err);
    res.status(500).json({ error: 'Could not load messages' });
  }
});

module.exports = router;