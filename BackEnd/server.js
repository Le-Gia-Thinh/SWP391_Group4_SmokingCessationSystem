require('dotenv').config();   // Load biến môi trường trước hết
require('./config/passport');    // Khởi tạo passport ngay sau

const express = require('express');
const session = require('express-session');
const cors = require('cors');
const passport = require('./config/passport');

// Routes
const authRoutes = require('./routes/auth');
const roleRoutes = require('./routes/roleTestRoutes');
const habitLogRoutes = require('./routes/habitLogRoutes');
const smokingSummaryRoutes = require('./routes/smokingSummaryRoutes');
const communityRoutes = require('./routes/community');
const communityChatRoutes = require('./routes/communityChat');
const topicChatRoutes = require('./routes/topicChat');
const adminRoutes = require('./routes/admin');
const appointmentRoutes = require('./routes/appointment');
const scheduleRoutes = require('./routes/schedule');
const coachRoutes = require('./routes/coach');
const memberRoutes = require('./routes/member');
const customerRoutes = require("./routes/customer");
const userRoutes = require("./routes/user");
const userScoreRoutes = require("./routes/userScore");
const paymentRoutes = require('./routes/payment');
const subscriptionRoutes = require('./routes/subscription');  // <-- Thêm route subscription
const ftndRoutes = require('./routes/ftnd');
const quitPlanRoutes = require("./routes/quitPlan");
const commentRoutes = require('./routes/comment');

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

// 3) FTND & QuitPlan & Customer
app.use('/api/ftnd', ftndRoutes);
app.use('/api/quitplan', quitPlanRoutes);
app.use('/api/customer', customerRoutes);

// 4) User Score (lấy và update)
app.use('/api/user-score', userScoreRoutes);

// 5) Session middleware (phải nằm trước passport.session())
app.use(
  session({
    secret: process.env.JWT_SECRET || 'fallback_secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000, // 1 ngày
    },
  })
);

// 6) Passport init & session
app.use(passport.initialize());
app.use(passport.session());

// 7) Auth & Role
app.use('/api/auth', authRoutes);
app.use('/api/role', roleRoutes);

// 8) Admin / Coach / Member
app.use('/api/admin', adminRoutes);
app.use('/api/coach', coachRoutes);
app.use('/api/member', memberRoutes);

// 9) Appointment & Schedule
app.use('/api/appointment', appointmentRoutes);
app.use('/api/schedule', scheduleRoutes);

// 10) Community & Comment & Chat
app.use('/api/community', communityRoutes);
app.use('/api/comment', commentRoutes);
app.use('/api/community-chat', communityChatRoutes);
app.use('/api/topic-chat', topicChatRoutes);

// 11) Habit Log & Smoking Summary
app.use('/api/habit-log', habitLogRoutes);
app.use('/api/smoking-summary', smokingSummaryRoutes);

// 12) User Profile
app.use('/api/user', userRoutes);

// 13) Payment & Subscription
app.use('/api/payment', paymentRoutes);
app.use('/api/subscriptions', subscriptionRoutes);

// 14) Root test endpoint
app.get('/', (req, res) => {
  res.json({ success: true, message: 'Auth API đang hoạt động!' });
});

// 15) Middleware log request (debug)
app.use((req, res, next) => {
  console.log(`📥 [INCOMING REQUEST] ${req.method} ${req.originalUrl}`);
  next();
});

// 16) Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ success: false, message: 'Lỗi server không xác định' });
});

// 17) 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ success: false, message: 'Endpoint không tồn tại' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server đang chạy trên port ${PORT}`);
  console.log(`🔗 Google OAuth callback URL: ${process.env.SERVER_URL}/api/auth/google/callback`);
});
  