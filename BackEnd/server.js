require("dotenv").config(); // Load biến môi trường trước hết
require("./config/passport"); // Chạy file config/passport ngay sau, để passport được khởi tạo
const http = require("http");
const { Server } = require("socket.io");
require("./cron/notificationJob");
require("./cron/paymentExpireJob");
const express = require("express");
const session = require("express-session");
const cors = require("cors");
const passport = require("./config/passport");

// Routes
const authRoutes = require("./routes/auth");
const roleRoutes = require("./routes/roleTestRoutes");
const habitLogRoutes = require("./routes/habitLogRoutes");
const smokingSummaryRoutes = require("./routes/smokingSummaryRoutes");
const communityRoutes = require("./routes/community");
const communityChatRoutes = require("./routes/communityChat");
const topicChatRoutes = require("./routes/topicChat");
const adminRoutes = require("./routes/admin");
const appointmentRoutes = require("./routes/appointment");
const scheduleRoutes = require("./routes/schedule");
const coachRoutes = require("./routes/coach");
const memberRoutes = require("./routes/member");
const customerRoutes = require("./routes/customer");
const userRoutes = require("./routes/user");
const userScoreRoutes = require("./routes/userScore");

const paymentRoutes = require("./routes/payment");
const subscriptionRoutes = require("./routes/subscription");

const ftndRoutes = require("./routes/ftnd");
const quitPlanRoutes = require("./routes/quitPlan");
const commentRoutes = require("./routes/comment");

const achievementRoutes = require("./routes/achievementRoutes");
const notificationRoutes = require("./routes/notification");
const taskRoutes = require("./routes/taskRoutes.js");
const app = express();
const server = http.createServer(app);
const chatRoutes = require("./routes/chat");
const adminMemberRoutes = require("./routes/adminMemberRoutes");

// ✅ 1) MIDDLEWARE LOG REQUEST - ĐẶT Ở ĐẦU
app.use((req, res, next) => {
  console.log(`📥 [INCOMING REQUEST] ${req.method} ${req.originalUrl}`);
  next();
});

// 2) CORS: bắt buộc phải cho phép credentials (cookie) và origin chạy React (5173 / 3000)
app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:3000"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
  })
);

// 3) Middleware parse body JSON / URL-encoded
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173", "http://localhost:3000"],
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Gắn io vào req để sử dụng trong controller
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Socket.IO lắng nghe kết nối
io.on("connection", (socket) => {
  // Join session room (phiên tư vấn)
  socket.on("joinSession", (sessionId) => {
    socket.join(sessionId);
  });

  // Leave session room
  socket.on("leaveSession", (sessionId) => {
    socket.leave(sessionId);
  });

  // Join chat room (theo thread_id)
  socket.on("joinRoom", (roomId) => {
    socket.join(roomId);
    // Gửi thông báo tới phòng khi có người tham gia
    socket.to(roomId).emit("userJoined", { id: socket.id, room: roomId });
  });

  // Leave chat room
  socket.on("leaveRoom", (roomId) => {
    socket.leave(roomId);
    // Gửi thông báo tới phòng khi có người rời đi
    socket.to(roomId).emit("userLeft", { id: socket.id, room: roomId });
  });

  // Debug: Liệt kê các phòng mà socket hiện đang tham gia
  socket.on("getRooms", () => {
    const rooms = Array.from(socket.rooms).filter(room => room !== socket.id);
    socket.emit("roomsList", rooms);
  });
  
  // Ping-pong để duy trì kết nối
  socket.on("ping", (data) => {
    socket.emit("pong", { ts: new Date().toISOString(), serverAck: true });
  });
  
  // Xử lý join/leave room
  socket.on('forceJoinRoom', (roomId) => {
    socket.join(roomId);
    // Gửi thông báo tới phòng khi có người tham gia
    socket.emit('joinSuccess', { id: socket.id, room: roomId });
  });

  socket.on("disconnect", () => {
    // Client đã ngắt kết nối
  });
});

// 4) Serve file chat uploads
const path = require("path");
app.use("/uploads/chat", express.static(path.join(__dirname, "uploads/chat")));

// 5) Check FTND: Mức độ nghiện
app.use("/api/ftnd", ftndRoutes);
app.use("/api/quitplan", quitPlanRoutes);
app.use("/api/customer", customerRoutes);

// 6) User Score (lấy và update)
app.use("/api/user-score", userScoreRoutes);

// 7) Session middleware (phải nằm trước passport.session())
app.use(
  session({
    secret: process.env.JWT_SECRET || "fallback_secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1000, // 1 ngày
    },
  })
);

// 8) Passport init & session
app.use(passport.initialize());
app.use(passport.session());

// 9) Auth & Role
app.use("/api/auth", authRoutes);
app.use("/api/role", roleRoutes);

// 10) Admin / Coach / Member
app.use("/api/admin", adminRoutes);
app.use("/api/coach", coachRoutes);
app.use("/api/member", memberRoutes);

// 11) Appointment & Schedule
app.use("/api/appointment", appointmentRoutes);
app.use("/api/schedule", scheduleRoutes);

// 12) Community & Comment & Chat
app.use("/api/community", communityRoutes);
app.use("/api/comment", commentRoutes);
app.use("/api/community-chat", communityChatRoutes);
app.use("/api/topic-chat", topicChatRoutes);

// 13) Habit Log & Smoking Summary
app.use("/api/habit-log", habitLogRoutes);
app.use("/api/smoking-summary", smokingSummaryRoutes);

// 14) User Profile
app.use("/api/user", userRoutes);

// 15) Payment
app.use("/api/payment", paymentRoutes);
app.use("/api/subscriptions", subscriptionRoutes);

// 16) Achievement & Notification & Tasks
app.use("/api/achievement", achievementRoutes);
app.use("/api/notification", notificationRoutes);
app.use("/api/admin/tasks", taskRoutes);

// 17) Admin Member Routes
app.use("/api/admin/members", adminMemberRoutes);

// 18) Chat coach.member
app.use("/api/chat", chatRoutes);

// 19) Root test endpoint
app.get("/", (req, res) => {
  res.json({ success: true, message: "Auth API đang hoạt động!" });
});

// 20) Global error handler
// 15) Middleware log request (debug)
// 15.1) Xử lí thành tựu
app.use("/api/achievement", achievementRoutes);
// Xử lí thông báo
app.use("/api/notification", notificationRoutes);
// Task routes
app.use("/api/admin/tasks", taskRoutes);

// 16) Middleware log request
app.use((req, res, next) => {
  next();
});

// 16) Global error handler
app.use((err, req, res, next) => {
  console.error("❗ Unhandled error:", err);
  res
    .status(500)
    .json({ success: false, message: "Lỗi server không xác định" });
});

// 21) 404 handler - PHẢI Ở CUỐI CÙNG
app.use("*", (req, res) => {
  console.log(`❌ 404 - Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ success: false, message: "Endpoint không tồn tại" });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`✅ Server + Socket.IO chạy tại port ${PORT}`);
  console.log(`🔗 Google URL: http://localhost:${PORT}/api/auth/google`);
});

