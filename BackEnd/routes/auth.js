// routes/auth.js
const express = require('express');
const passport = require('passport');
const auth = require('../middleware/auth');
const { register, login, getMe, googleSuccess, logout } = require('../controllers/authController');

const router = express.Router();

// Route đăng ký tài khoản mới
router.post('/register', register);

// Đăng nhập (POST) - nhận JSON {email, password} từ frontend
router.post('/login', login);

// Route GET /login: chỉ dùng để test form login nhanh (chỉ phục vụ mục đích test)
router.get('/login', (req, res) => {
  res.send(`
    <h2>Login Test Form</h2>
    <form method="POST" action="/api/auth/login">
      <label>Email:</label><br/>
      <input type="email" name="email" required/><br/><br/>
      <label>Password:</label><br/>
      <input type="password" name="password" required/><br/><br/>
      <button type="submit">Login</button>
    </form>
  `);
});

// Route lấy thông tin user hiện tại (cần token)
router.get('/me', auth, getMe);

// Google OAuth - bắt đầu xác thực Google
router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

// Google OAuth callback - SỬA LẠI TEMPLATE STRING
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

// Route test redirect - THÊM ROUTE NÀY
router.get('/test-redirect', (req, res) => {
  console.log('Testing redirect...');
  const testUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/auth/google/redirect?token=test123`;
  console.log('Test redirect URL:', testUrl);
  res.redirect(testUrl);
});

// Route logout
router.post('/logout', logout);

module.exports = router;