//server.js
require('dotenv').config();   // Load biến môi trường từ file .env (phải đầu tiên)
require('./config/passport'); // Khởi tạo Passport, cần JWT_SECRET từ env

const express = require('express');
const session = require('express-session');
const cors = require('cors');
const passport = require('passport');

const authRoutes = require('./routes/auth');

const app = express();

// CORS middleware cho phép frontend (CLIENT_URL) truy cập API, cho phép gửi cookie
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));

// Middleware parse body JSON và urlencoded (form data)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session middleware cấu hình
app.use(session({
  secret: process.env.JWT_SECRET || 'fallback_secret', // khóa bí mật cho session
  resave: false,                                       // không lưu session nếu không thay đổi
  saveUninitialized: false,                            // không lưu session khi chưa thiết lập
  cookie: {
    secure: process.env.NODE_ENV === 'production',      // chỉ gửi cookie qua HTTPS khi production
    maxAge: 24 * 60 * 60 * 1000                           // cookie sống 24 giờ
  }
}));

// Khởi tạo Passport và session để xác thực
app.use(passport.initialize());
app.use(passport.session());


// Middleware debug log request mỗi khi có request đến server
app.use((req, res, next) => {
  console.log(`📥 [INCOMING REQUEST] ${req.method} ${req.originalUrl}`);
  next();
});

// Đăng ký route cho auth
app.use('/api/auth', authRoutes);

// Route gốc test server
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Auth API đang hoạt động!'
  });
});

// Xử lý lỗi không bắt được (global error handler)
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    message: 'Lỗi server không xác định'
  });
});

// Xử lý các route không tồn tại (404 handler)
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
