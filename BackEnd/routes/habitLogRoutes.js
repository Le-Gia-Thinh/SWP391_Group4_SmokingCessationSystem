// routes/habitLogRoutes.js
const express = require("express");
const router = express.Router();
const {
  getHabitLogByDate,
  submitSingleLog,
  deleteHabitLogEntry,
  chooseBehaviorTask,
  getSelectedTasksByDate,
  getCompletedTasksByDate,
  submitBehaviorTaskPoint,
  deleteBehaviorTaskLogEntry
} = require("../controllers/habitLogController");

const { auth } = require("../middleware/auth");

router.get("/", auth, getHabitLogByDate);              // Lấy dữ liệu theo ngày
router.post("/", auth, submitSingleLog);               // Gửi 1 log (tick hoặc bỏ tick)
router.delete("/", auth, deleteHabitLogEntry);  
router.post("/choose-task", auth, chooseBehaviorTask);       // Xóa log nếu cần
router.get("/selected-tasks", auth, getSelectedTasksByDate);
router.get("/completed-tasks", auth, getCompletedTasksByDate);
router.post("/submit-task-points", auth, submitBehaviorTaskPoint);
router.post("/delete-task-log", auth, deleteBehaviorTaskLogEntry);

module.exports = router;
