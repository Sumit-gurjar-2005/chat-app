console.log("server file executed");
require('dotenv').config();


const express = require('express');
const app = express();

function isAuthenticated(req, res, next) {
  if (req.session && req.session.user) {
    return next();
  } else {
    return res.redirect('/login');
  }
}




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
const privateChatRoutes = require('./routes/private-chat');

//const privateChatRoutes = require('./routes/private-chat');
console.log("privateChatRoutes:", privateChatRoutes); // Test print

app.use('/private-chat', privateChatRoutes);



const friendRoutes=require('./routes/friend');





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

//console.log("privateChatRoutes",privateChatRoutes);
app.use('/private-chat', privateChatRoutes);

//console.log('friendRoutes is:',friendRoutes);
app.use('/friend', friendRoutes);


// ✅ Dashboard route
app.get('/dashboard', (req, res) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }
  res.sendFile(path.join(__dirname, 'views', 'dashboard.html'));
});

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

  socket.on('joinPrivateRoom', ({ sender, receiver }) => {
  const room = [sender, receiver].sort().join('-');
  socket.join(room);
});

socket.on('privateMessage', ({ sender, receiver, message }) => {
  const room = [sender, receiver].sort().join('-');
  io.to(room).emit('privateMessage', { sender, message });
});



});

//const friendRoutes = require('./routes/friend');



app.get('/friends', (req, res) => {
  if (!req.session.userId) return res.redirect('/login');
  res.sendFile(__dirname + '/views/friends.html');
});

app.get('/get-current-user', async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: "Not logged in" });
  const user = await User.findById(req.session.userId);
  res.json(user);
});

app.get('/users', async (req, res) => {
  const users = await User.find({}, "_id username");
  res.json(users);
});

app.get('/users/:id', async (req, res) => {
  const user = await User.findById(req.params.id, "_id username");
  res.json(user);
});

app.get('/private-chat/:friendUsername', isAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'private-chat.html'));
});


// ✅ Start Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
