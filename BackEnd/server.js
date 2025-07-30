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

// 1) CORS: bắt buộc phải cho phép credentials (cookie) và origin chạy React (5173 / 3000)
app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:3000"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
  })
);

// 2) Middleware parse body JSON / URL-encoded
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

// 2.1) Serve file chat uploads
const path = require("path");
app.use("/uploads/chat", express.static(path.join(__dirname, "uploads/chat")));

// 3) Check FTND: Mức độ nghiện
app.use("/api/ftnd", ftndRoutes);
app.use("/api/quitplan", quitPlanRoutes);
app.use("/api/customer", customerRoutes);

// 4) User Score (lấy và update)
app.use("/api/user-score", userScoreRoutes);

// 5) Session middleware (phải nằm trước passport.session())
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

// 6) Passport init & session
app.use(passport.initialize());
app.use(passport.session());

// 7) Auth & Role
app.use("/api/auth", authRoutes);
app.use("/api/role", roleRoutes);

// 8) Admin / Coach / Member
app.use("/api/admin", adminRoutes);
app.use("/api/coach", coachRoutes);
app.use("/api/member", memberRoutes);

// 9) Appointment & Schedule
app.use("/api/appointment", appointmentRoutes);
app.use("/api/schedule", scheduleRoutes);

// 10) Community & Comment & Chat
app.use("/api/community", communityRoutes);
app.use("/api/comment", commentRoutes);
app.use("/api/community-chat", communityChatRoutes);
app.use("/api/topic-chat", topicChatRoutes);

// 11) Habit Log & Smoking Summary
app.use("/api/habit-log", habitLogRoutes);
app.use("/api/smoking-summary", smokingSummaryRoutes);

// 12) User Profile
app.use("/api/user", userRoutes);

// 13) Payment
app.use("/api/payment", paymentRoutes);
app.use("/api/subscriptions", subscriptionRoutes);

// 14) Root test endpoint
app.get("/", (req, res) => {
  res.json({ success: true, message: "Auth API đang hoạt động!" });
});

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
  console.error("Unhandled error:", err);
  res
    .status(500)
    .json({ success: false, message: "Lỗi server không xác định" });
});

// 17) Admin Member Routes
app.use("/api/admin/members", adminMemberRoutes);

// 19. Chat coach.member
app.use("/api/chat", chatRoutes);

// 20) 404 handler
app.use("*", (req, res) => {
  res.status(404).json({ success: false, message: "Endpoint không tồn tại" });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`✅ Server + Socket.IO chạy tại port ${PORT}`);
});
