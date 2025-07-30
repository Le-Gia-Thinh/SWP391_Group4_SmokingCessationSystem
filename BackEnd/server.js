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

// 5. CORS: Cho phép React truy cập API với cookie
app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:3000"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
  })
);

// 6. Body Parser Middleware (JSON + URL-encoded)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 7. Đính io vào request để dùng trong controller
app.use((req, res, next) => {
  req.io = io;
  next();
});

// 8. Cấu hình Socket.IO
io.on("connection", (socket) => {
  console.log("📡 Client connected:", socket.id);

  socket.on("joinSession", (sessionId) => {
    socket.join(sessionId);
    console.log(`👥 Joined room session ${sessionId}`);
  });

  socket.on("disconnect", () => {
    console.log("❌ Client disconnected:", socket.id);
  });
});

// 9. Phục vụ file tĩnh (ảnh chat)
const path = require("path");
app.use("/uploads/chat", express.static(path.join(__dirname, "uploads/chat")));

// 10. Middleware session (trước passport.session)
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

// 11. Passport Middleware
app.use(passport.initialize());
app.use(passport.session());

// 12. Middleware log request (debug)
app.use((req, res, next) => {
  console.log(`📥 [INCOMING REQUEST] ${req.method} ${req.originalUrl}`);
  next();
});

// 13. ROUTES
// 13.1 Auth & Role
app.use("/api/auth", require("./routes/auth"));
app.use("/api/role", require("./routes/roleTestRoutes"));

// 13.2 User & Profile
app.use("/api/user", require("./routes/user"));
app.use("/api/user-score", require("./routes/userScore"));

// 13.3 FTND - Kế hoạch cai thuốc - Khách hàng
app.use("/api/ftnd", require("./routes/ftnd"));
app.use("/api/quitplan", require("./routes/quitPlan"));
app.use("/api/customer", require("./routes/customer"));

// 13.4 Coach - Member - Admin
app.use("/api/coach", require("./routes/coach"));
app.use("/api/member", require("./routes/member"));
app.use("/api/admin", require("./routes/admin"));
app.use("/api/admin/members", require("./routes/adminMemberRoutes"));

// 13.5 Lịch hẹn & thời gian biểu
app.use("/api/appointment", require("./routes/appointment"));
app.use("/api/schedule", require("./routes/schedule"));

// 13.6 Cộng đồng - Chat - Bình luận
app.use("/api/community", require("./routes/community"));
app.use("/api/community-chat", require("./routes/communityChat"));
app.use("/api/topic-chat", require("./routes/topicChat"));
app.use("/api/chat", require("./routes/chat"));
app.use("/api/comment", require("./routes/comment"));

// 13.7 Nhật ký thói quen & Thống kê hút thuốc
app.use("/api/habit-log", require("./routes/habitLogRoutes"));
app.use("/api/smoking-summary", require("./routes/smokingSummaryRoutes"));

// 13.8 Thanh toán
app.use("/api/payment", require("./routes/payment"));
app.use("/api/subscriptions", require("./routes/subscription"));

// 13.9 Thành tựu & Thông báo & Nhiệm vụ
app.use("/api/achievement", require("./routes/achievementRoutes"));
app.use("/api/notification", require("./routes/notification"));
app.use("/api/admin/tasks", require("./routes/taskRoutes"));

// 14. Root endpoint test
app.get("/", (req, res) => {
  res.json({ success: true, message: "Auth API đang hoạt động!" });
});

// 15. Middleware xử lý lỗi
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ success: false, message: "Lỗi server không xác định" });
});

// 16. 404 Handler cho các route không tồn tại
app.use("*", (req, res) => {
  res.status(404).json({ success: false, message: "Endpoint không tồn tại" });
});

// 17. Khởi chạy server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`✅ Server + Socket.IO chạy tại port ${PORT}`);
  console.log(`🔗 Google URL: http://localhost:${PORT}/api/auth/google`);
});
