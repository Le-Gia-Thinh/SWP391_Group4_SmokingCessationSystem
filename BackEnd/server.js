require('dotenv').config();   // Load biến môi trường trước hết
require('./config/passport'); // Chạy file config/passport ngay sau, để passport được khởi tạo
const http = require('http');
const { Server } = require('socket.io');

const express = require('express');
const session = require('express-session');
const cors = require('cors');
const passport = require('./config/passport');
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
const userRoutes = require("./routes/user"); 
const userScoreRoutes = require("./routes/userScore");
const app = express();
const server = http.createServer(app);
const chatRoutes = require('./routes/chat');

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


const io = new Server(server, {
  cors: {
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    methods: ['GET', 'POST'],
    credentials: true,
  }
});

// Gắn io vào req để sử dụng trong controller
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Socket.IO lắng nghe kết nối
io.on('connection', (socket) => {
  console.log('📡 Client connected:', socket.id);

  socket.on('joinSession', (sessionId) => {
    socket.join(sessionId);
    console.log(`👥 Joined room session ${sessionId}`);
  });

  socket.on('disconnect', () => {
    console.log('❌ Client disconnected:', socket.id);
  });
});

// 2.1) Serve file chat uploads
const path = require('path');
app.use('/uploads/chat', express.static(path.join(__dirname, 'uploads/chat')));

// 3) Check FTND: Mức độ nghiện
const ftndRoutes = require('./routes/ftnd');
app.use('/api/ftnd', ftndRoutes);

// 4) Kết hoạch cai nghiện
const quitPlanRoutes = require("./routes/quitPlan");
app.use("/api/quitplan", quitPlanRoutes);

// 5) Display mức độ nghiện
const customerRoutes = require("./routes/customer");
app.use("/api/customer", customerRoutes);

// 6) Ranking
app.use("/api/user-score", require("./routes/userScore"));

// 7) Update user score
const { auth } = require("./middleware/auth");
app.use("/api/user-score", userScoreRoutes);

// 8) Session middleware (phải nằm trước passport.session())
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

// 9) Khởi tạo Passport và session support
app.use(passport.initialize());
app.use(passport.session());

// 10) Đăng ký route auth
app.use('/api/auth', authRoutes);
// 10.1) Route phân quyền
app.use('/api/role', roleRoutes);
// 10.2) Route admin
app.use('/api/admin', adminRoutes);
// 10.3) Route coach
app.use('/api/coach', coachRoutes);
// 10.4) Route member
app.use('/api/member', memberRoutes);

// 11) Route appointment & Schedule
app.use('/api/appointment', appointmentRoutes);
app.use('/api/schedule', scheduleRoutes);

// 12) Community Post & Comment
app.use('/api/community', require('./routes/community'));
app.use('/api/comment', require('./routes/comment'));

// 13) Community Chat (group & topic)
app.use('/api/community-chat', require('./routes/communityChat'));
app.use('/api/topic-chat', require('./routes/topicChat'));

// 14) Xử lý phần submit từ plan
app.use('/api/habit-log', habitLogRoutes);
// 14.1) Xử lí lưu số điếu hằng ngày của users
app.use('/api/smoking-summary', smokingSummaryRoutes);

// 15) Xử lí profile of member
app.use('/api/user', userRoutes);

// 16) Middleware log request
app.use((req, res, next) => {
  console.log(`📥 [INCOMING REQUEST] ${req.method} ${req.originalUrl}`);
  next();
});

// 17) Route gốc test
app.get('/', (req, res) => {
  res.json({ success: true, message: 'Auth API đang hoạt động!' });
});

// 18) Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ success: false, message: 'Lỗi server không xác định' });
})

// 19. Chat coach.member
app.use('/api/chat', chatRoutes);

// 19) 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ success: false, message: 'Endpoint không tồn tại' });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`✅ Server + Socket.IO chạy tại port ${PORT}`);
  console.log(`🔗 Google URL: http://localhost:${PORT}/api/auth/google`);
});



