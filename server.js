console.log("server file executed");
require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const sharedSession = require('express-socket.io-session');
const path = require('path');
const http = require('http');
const socketio = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

// ✅ Routes and Models
const authRoutes = require('./routes/auth');
const chatRoutes = require('./routes/chat');
const privateChatRoutes = require('./routes/private-chat');
const friendRoutes = require('./routes/friend');
const Message = require('./models/Message');
const User = require('./models/User');
const PrivateMessage = require('./models/PrivateMessage'); // ✅ Added for private chat

// ✅ Session Middleware
const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET || 'supersecretkey',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 1 day
  }
});

app.use(sessionMiddleware);
io.use(sharedSession(sessionMiddleware, { autoSave: true }));

// ✅ MongoDB Connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.error('❌ Mongo Error:', err));

// ✅ Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// ✅ Routes
app.use('/', authRoutes);
app.use('/chat', chatRoutes);
app.use('/private-chat', privateChatRoutes);
app.use('/friend', friendRoutes);
app.use('/auth', authRoutes);

// ✅ Auth Middleware
function isAuthenticated(req, res, next) {
  if (req.session && req.session.user) return next();
  return res.redirect('/login');
}

// ✅ Views
app.get('/dashboard', isAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'dashboard.html'));
});

app.get('/friends', isAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'friends.html'));
});

app.get('/private-chat/:friendUsername', isAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'private-chat.html'));
});

// ✅ API Routes
app.get('/get-current-user', async (req, res) => {
  if (!req.session.user || !req.session.user._id) {
    return res.status(401).json({ error: "Not logged in" });
  }
  try {
    const user = await User.findById(req.session.user._id);
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch user" });
  }
});

app.get('/users', async (req, res) => {
  const users = await User.find({}, "_id username");
  res.json(users);
});

app.get('/users/:id', async (req, res) => {
  const user = await User.findById(req.params.id, "_id username");
  res.json(user);
});

// ✅ In-memory online user tracking
const onlineUsers = new Map(); // userId -> socketId

// ✅ Socket.io Handling
io.on('connection', (socket) => {
  const session = socket.handshake.session;
  const userId = session?.user?._id;
  const username = session?.user?.username || 'Anonymous';

  console.log("🟢 Socket connected as:", username);

  // Track connected user
  if (userId) {
    onlineUsers.set(userId, socket.id);
  }

  // Public chat
  socket.on('chatMessage', async ({ message, media }) => {
    if (!message && !media) return;

    try {
      const newMsg = new Message({
        username,
        message,
        media,
        timestamp: new Date()
      });

      await newMsg.save();

      io.emit('chatMessage', {
        username: newMsg.username,
        message: newMsg.message,
        media: newMsg.media
      });
    } catch (err) {
      console.error("❌ Error saving message:", err);
    }
  });

  // Private chat
  socket.on('joinPrivateRoom', ({ sender, receiver }) => {
    const room = [sender, receiver].sort().join('-');
    socket.join(room);
  });

  socket.on('privateMessage', async ({ sender, receiver, message, media }) => {
    const room = [sender, receiver].sort().join('-');

    try {
      const privateMsg = new PrivateMessage({
        sender,
        receiver,
        message,
        media,
        timestamp: new Date()
      });

      await privateMsg.save();

      // Deliver to receiver if online
      const receiverSocketId = onlineUsers.get(receiver);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('privateMessage', {
          sender,
          message,
          media,
          timestamp: privateMsg.timestamp
        });
      }

      // Send back to sender as confirmation
      socket.emit('privateMessage', {
        sender,
        message,
        media,
        timestamp: privateMsg.timestamp
      });

    } catch (err) {
      console.error("❌ Error saving private message:", err);
    }
  });

  socket.on('disconnect', () => {
    console.log('🔴 User disconnected');
    if (userId) {
      onlineUsers.delete(userId);
    }
  });
});

// ✅ Start Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
