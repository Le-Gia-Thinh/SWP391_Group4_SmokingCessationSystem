//server.js
require('dotenv').config();   // Load biến môi trường đầu tiên
require('./config/passport'); // Passport dùng process.env.JWT_SECRET

const express = require('express');
const session = require('express-session');
const cors = require('cors');
const passport = require('passport');

const authRoutes = require('./routes/auth');

const app = express();

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: process.env.JWT_SECRET || 'fallback_secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24h
  }
}));

app.use(passport.initialize());
app.use(passport.session());

app.use('/api/auth', authRoutes);

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Auth API đang hoạt động!'
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    message: 'Lỗi server không xác định'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint không tồn tại'
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server đang chạy trên port ${PORT}`);
  console.log(`🔗 Google URL: http://localhost:${PORT}/api/auth/google`);
});
