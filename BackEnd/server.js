require('dotenv').config();   // Load biến môi trường trước hết
require('./config/passport'); // Chạy file config/passport ngay sau, để passport được khởi tạo

const express = require('express');
const session = require('express-session');
const cors = require('cors');
const passport = require('./config/passport');
const authRoutes = require('./routes/auth');




const app = express();

// 1) CORS: bắt buộc phải cho phép credentials (cookie) và origin chạy React (5173 / 3000)
app.use(
  cors({
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  })
);



// 2) Middleware parse body JSON / URL-encoded
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


  // checkFTND
const ftndRoutes = require('./routes/checkFTND');
app.use('/api/ftnd', ftndRoutes);

// quitPlan
const quitPlanRoutes = require("./routes/quitPlan");
app.use("/api/quitplan", quitPlanRoutes);


// 3) Session middleware (phải nằm trước passport.session())
app.use(
  session({
    secret: process.env.JWT_SECRET || 'fallback_secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production', // true khi deploy https
      maxAge: 24 * 60 * 60 * 1000, // 1 ngày (ms)
    },
  })
);

// 4) Khởi tạo Passport và session support
app.use(passport.initialize());
app.use(passport.session());app.use('/api/auth', authRoutes);
// 5) Đăng ký route auth
app.use('/api/auth', authRoutes);

// 6) Middleware log request
app.use((req, res, next) => {
  console.log(`📥 [INCOMING REQUEST] ${req.method} ${req.originalUrl}`);
  next();
});

// 7) Route gốc test
app.get('/', (req, res) => {
  res.json({ success: true, message: 'Auth API đang hoạt động!' });
});

// 8) Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ success: false, message: 'Lỗi server không xác định' });
});

// 9) 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ success: false, message: 'Endpoint không tồn tại' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server đang chạy trên port ${PORT}`);
  console.log(`🔗 Google URL: http://localhost:${PORT}/api/auth/google`);
});



