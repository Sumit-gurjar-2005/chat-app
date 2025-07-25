//
console.log("server file executed");

// server.js
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
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

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log('MongoDB Connected'))
  .catch(err => console.error('Mongo Error:', err));

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));


app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

app.use(session({
  secret: 'supersecretkey',
  resave: false,
  saveUninitialized: true
}));

// Routes
app.use('/', authRoutes);
app.use('/chat', chatRoutes);

// Socket.io for real-time chat
io.on('connection', socket => {
  console.log('🟢 User connected');



  socket.on('chatMessage', async ({ username, message, media }) => {
    const newMsg = new Message({ username, message, media });
    await newMsg.save();

    io.emit('chatMessage', newMsg);
  });

  socket.on('disconnect', () => {
    console.log('🔴 User disconnected');
  });
});

// Start Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));

//app.listen(PORT, () => {
  //console.log(`🚀 Server running at http://localhost:${PORT}`);
//});