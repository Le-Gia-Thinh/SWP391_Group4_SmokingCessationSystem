// routes/habitLogRoutes.js
const express = require("express");
const router = express.Router();
const {
  getHabitLogByDate,
  submitSingleLog,
  deleteHabitLogEntry,
} = require("../controllers/habitLogController");

const { auth } = require("../middleware/auth");

router.get("/", auth, getHabitLogByDate);              // Lấy dữ liệu theo ngày
router.post("/", auth, submitSingleLog);               // Gửi 1 log (tick hoặc bỏ tick)
router.delete("/", auth, deleteHabitLogEntry);         // Xóa log nếu cần

module.exports = router;
