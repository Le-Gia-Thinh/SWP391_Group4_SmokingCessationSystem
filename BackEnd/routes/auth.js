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


// Google OAuth callback
router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: `${process.env.CLIENT_URL}/login?error=google_auth_failed` }),
  googleSuccess
);

// Route logout
router.post('/logout', logout);

module.exports = router;