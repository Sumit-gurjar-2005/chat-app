// models/Message.js
const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  username: {
    type: String,
    default: "Anonymous"
  },
  message: {
    type: String,
    default: ""
  },
  media: {
    type: String, // path to image/video
    default: null
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Message', messageSchema);