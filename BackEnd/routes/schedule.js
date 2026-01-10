// routes/schedule.js
const express = require('express');
const router = express.Router();
const scheduleController = require('../controllers/scheduleController');
const { auth, authorize } = require('../middleware/auth');

// 1 Admin tạo lịch hàng loạt cho 1 coach
router.post('/bulk', auth, authorize('admin'), scheduleController.createBulkSchedules);

// 1.1 Admin tạo lịch cho nhiều coach cùng lúc
router.post('/bulk-multiple', auth, authorize('admin'), scheduleController.createSchedulesForMultipleCoaches);

// 2. Member xem lịch trống
router.get('/available/:coachId', scheduleController.getAvailableSchedules);

// 3. Coach xóa lịch (chỉ lịch chưa được đặt)
router.delete('/:scheduleId', auth, authorize('coach'), scheduleController.deleteSchedule);

// 4. Coach xem tất cả lịch của chính mình (bao gồm lịch Admin tạo)
router.get('/my-coach-schedules', auth, authorize('coach'), scheduleController.getMySchedules);

// API: Admin xem tất cả lịch của một coach bất kỳ
router.get('/all/:coachId', auth, authorize('admin'), scheduleController.getAllSchedulesByCoachId);

module.exports = router;