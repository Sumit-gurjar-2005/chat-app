// routes/auth.js
const express = require('express');
const router = express.Router();
const User = require('../models/User.js');

// Landing page
router.get('/', (req, res) => {
  res.sendFile('views/index.html', { root: '.' });
});

// Signup form
router.get('/signup', (req, res) => {
  res.sendFile('views/signup.html', { root: '.' });
});

// Login form
router.get('/login', (req, res) => {
  res.sendFile('views/login.html', { root: '.' });
});

// Signup submit
router.post('/signup', async (req, res) => {
  const { username, password } = req.body;
  try {
    const existing = await User.findOne({ username });
    if (existing) return res.send('User already exists. <a href="/signup">Try again</a>');

    const newUser = new User({ username, password });
    await newUser.save();
    req.session.user = newUser;
    res.redirect('/login');
  } catch (err) {
    res.status(500).send('Signup failed. ' + err.message);
  }
});

// Login submit
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username });
    if (!user) return res.send('Invalid username. <a href="/login">Try again</a>');

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.send('Wrong password. <a href="/login">Try again</a>');

    req.session.user = user;
    req.session.userId = user._id;

    
    res.redirect('/dashboard');
  } catch (err) {
    res.status(500).send('Login failed. ' + err.message);
  }
});

module.exports = router;