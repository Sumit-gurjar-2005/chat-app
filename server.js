console.log("✅ server.js file executed");

const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const path = require('path');
const http = require('http');
const socketio = require('socket.io');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const chatRoutes = require('./routes/chat');
const friendRoutes = require('./routes/friend');
const privateChatRoutes = require('./routes/private-chat');

const app = express();
const server = http.createServer(app);        // wrap express in http server
const io = socketio(server);                  // attach socket.io to server

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log("✅ Connected to MongoDB"))
  .catch(err => console.error("❌ MongoDB connection error:", err));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session middleware
const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET || 'secret',
  resave: false,
  saveUninitialized: false
});
app.use(sessionMiddleware);

// Share session with socket.io
io.use((socket, next) => {
  sessionMiddleware(socket.request, {}, next);
});

// Static Files
app.use('/public', express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// Routes
app.use('/', authRoutes);
app.use('/chat', chatRoutes);
app.use('/friend', friendRoutes);
app.use('/private-chat', privateChatRoutes);

// Socket.io Private Chat Handling
io.on('connection', (socket) => {
  console.log('🔌 New socket connected:', socket.id);

  // Join room for private chat
  socket.on('join-private-room', ({ userId, friendId }) => {
    const roomName = [userId, friendId].sort().join('_');
    socket.join(roomName);
    console.log(`✅ ${userId} joined private room: ${roomName}`);
  });

  // Handle private messages
  socket.on('private-message', (msg) => {
    const roomName = [msg.senderId, msg.receiverId].sort().join('_');
    io.to(roomName).emit('private-message', msg);
    console.log(`✉️ Private message from ${msg.senderId} to ${msg.receiverId}`);
  });

  socket.on('disconnect', () => {
    console.log('❌ Socket disconnected:', socket.id);
  });
});

// Start Server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
