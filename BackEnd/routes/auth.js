// routes/auth.js
import express from 'express';
import passport from 'passport';
import auth from '../middleware/auth.js';
import { requestResetPassword, resetPassword } from '../controllers/resetPassword.js';
import { register, login, getMe, googleSuccess, logout } from '../controllers/authController.js';

const router = express.Router();

// Route đăng ký tài khoản mới
router.post('/register', register);

// Đăng nhập
router.post('/login', login);

// Reset password
router.post('/request-reset-password', requestResetPassword);
router.post('/reset-password/:token', resetPassword);

// Lấy thông tin user hiện tại
router.get('/me', auth, getMe);

// Google OAuth
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/google/callback',
  (req, res, next) => {
    console.log('=== GOOGLE CALLBACK RECEIVED ===');
    console.log('Query params:', req.query);
    next();
  },
  passport.authenticate('google', {
    failureRedirect: `${process.env.CLIENT_URL || 'http://localhost:3000'}/login?error=google_auth_failed`
  }),
  (req, res, next) => {
    console.log('=== AFTER PASSPORT AUTH ===');
    console.log('req.user:', req.user);
    next();
  },
  googleSuccess
);

// Test route
router.get('/test-redirect', (req, res) => {
  const testUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/auth/google/redirect?token=test123`;
  res.redirect(testUrl);
});

// Logout
router.post('/logout', logout);

export default router;
