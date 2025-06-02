// routes/auth.js
const express = require('express');
const passport = require('passport');
const { register, login, getMe, googleSuccess } = require('../controllers/authController');
const auth = require('../middleware/auth');

const router = express.Router();

// Local Auth Routes
router.post('/register', register);
router.post('/login', login);
router.get('/me', auth, getMe);

// Google OAuth Routes
router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: `${process.env.CLIENT_URL}/login?error=google_auth_failed` }),
  googleSuccess
);

module.exports = router;