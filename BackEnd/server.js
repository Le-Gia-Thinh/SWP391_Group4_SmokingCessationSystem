require('dotenv').config();   // Load biến môi trường trước hết
require('./config/passport'); // Chạy file config/passport ngay sau, để passport được khởi tạo

const express = require('express');
const session = require('express-session');
const cors = require('cors');
const passport = require('./config/passport');
const authRoutes = require('./routes/auth');
const roleRoutes = require('./routes/roleTestRoutes');
const habitLogRoutes = require('./routes/habitLogRoutes');
const smokingSummaryRoutes = require('./routes/smokingSummaryRoutes');
const communityRoutes = require('./routes/community');

const adminRoutes = require('./routes/admin');
const appointmentRoutes = require('./routes/appointment');
const scheduleRoutes = require('./routes/schedule');
const coachRoutes = require('./routes/coach');
const memberRoutes = require('./routes/member');
const userRoutes = require("./routes/user"); 
const userScoreRoutes = require("./routes/userScore");

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

//Check FTND
const ftndRoutes = require('./routes/ftnd');
app.use('/api/ftnd', ftndRoutes);

// quitPlan
const quitPlanRoutes = require("./routes/quitPlan");
app.use("/api/quitplan", quitPlanRoutes);

// hien muc do nghien
const customerRoutes = require("./routes/customer");
app.use("/api/customer", customerRoutes);

// ranking
app.use("/api/user-score", require("./routes/userScore"));

// Update user score
const { auth } = require("./middleware/auth");
app.use("/api/user-score", userScoreRoutes);

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
app.use(passport.session());
// 5) Đăng ký route auth
app.use('/api/auth', authRoutes);
// 5.1) Route phân quyền
app.use('/api/role', roleRoutes);
// 5.2) Route admin
app.use('/api/admin', adminRoutes);
// 5.3) Route appointment
app.use('/api/appointment', appointmentRoutes);
// 5.4) Route schedule
app.use('/api/schedule', scheduleRoutes);
// 5.5) Route coach
app.use('/api/coach', coachRoutes);
// 5.6) Route member
app.use('/api/member', memberRoutes);

// Community Post & Comment
app.use('/api/community', require('./routes/community'));
app.use('/api/comment', require('./routes/comment'));

//xử lý phần submit từ plan
app.use('/api/habit-log', habitLogRoutes);

//xử lí lưu số điếu hằng ngày của users
app.use('/api/smoking-summary', smokingSummaryRoutes);
//xu li profile of member
app.use('/api/user', userRoutes);

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
})

// 9) 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ success: false, message: 'Endpoint không tồn tại' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server đang chạy trên port ${PORT}`);
  console.log(`🔗 Google URL: http://localhost:${PORT}/api/auth/google`);
});



