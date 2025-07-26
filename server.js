console.log("server file executed");

const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const sharedSession = require('express-socket.io-session');
const path = require('path');
const http = require('http');
const socketio = require('socket.io');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const chatRoutes = require('./routes/chat');
const Message = require('./models/Message');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

// ✅ Session middleware
const sessionMiddleware = session({
  secret: 'supersecretkey',
  resave: false,
  saveUninitialized: true
});

app.use(sessionMiddleware);
io.use(sharedSession(sessionMiddleware, { autoSave: true }));

// ✅ MongoDB
mongoose.connect(process.env.MONGODB_URI, {

  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log('MongoDB Connected'))
  .catch(err => console.error('Mongo Error:', err));

// ✅ Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// ✅ Routes
app.use('/', authRoutes);
app.use('/chat', chatRoutes);

// ✅ Socket.io chat handling
io.on('connection', (socket) => {
  const session = socket.handshake.session;
  const username = session?.user?.username || 'Anonymous';

  console.log("🟢 Socket connected as:", username);

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

      // ✅ Broadcast message to all clients
      io.emit('chatMessage', {
        username: newMsg.username,
        message: newMsg.message,
        media: newMsg.media
      });
    } catch (err) {
      console.error("❌ Error saving message:", err);
    }
  });

  socket.on('disconnect', () => {
    console.log('🔴 User disconnected');
  });
});

const friendRoutes = require('./routes/friend');
app.use('/friend', friendRoutes);


// ✅ Start Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
