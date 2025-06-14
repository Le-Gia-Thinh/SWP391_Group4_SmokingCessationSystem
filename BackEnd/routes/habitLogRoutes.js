// routes/habitLogRoutes.js
const express = require("express");
const router = express.Router();

const { auth } = require("../middleware/auth");
const {
  getHabitLogByDate,
  submitHabitLogBulk, // <== Sửa lại đúng tên
} = require("../controllers/habitLogController");

router.get("/", auth, getHabitLogByDate);
router.post("/bulk", auth, submitHabitLogBulk); // <== Đúng tên hàm export

module.exports = router;
