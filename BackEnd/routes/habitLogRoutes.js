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
  deleteBehaviorTaskLogEntry,
  submitBehaviorTaskCompletion,
} = require("../controllers/habitLogController");

const { auth } = require("../middleware/auth");

router.get("/", auth, getHabitLogByDate); // Lấy dữ liệu theo ngày
router.post("/", auth, submitSingleLog); // Gửi 1 log (tick hoặc bỏ tick)
router.delete("/", auth, deleteHabitLogEntry);
router.post("/choose-task", auth, chooseBehaviorTask); // chọn nhiệm vụ sẽ làm
router.get("/selected-tasks", auth, getSelectedTasksByDate);
router.get("/completed-tasks", auth, getCompletedTasksByDate);
router.post("/submit-task-points", auth, submitBehaviorTaskPoint);
router.post("/delete-task-log", auth, deleteBehaviorTaskLogEntry);
router.post("/complete-task", auth, submitBehaviorTaskCompletion); // Đánh dấu hoàn thành nhiệm vụ

module.exports = router;
