// routes/schedule.js
const express = require('express');
const router = express.Router();
const scheduleController = require('../controllers/scheduleController');
const { auth, authorize } = require('../middleware/auth');

// 1. Coach tạo lịch
router.post('/', auth, authorize('coach'), scheduleController.createSchedule);

// 1.1 Admin tạo lịch hàng loạt cho 1 coach
router.post('/bulk', auth, authorize('admin'), scheduleController.createBulkSchedules);

// 1.2 Admin tạo lịch cho nhiều coach cùng lúc
router.post('/bulk-multiple', auth, authorize('admin'), scheduleController.createSchedulesForMultipleCoaches);

// 2. Member xem lịch trống
router.get('/available/:coachId', scheduleController.getAvailableSchedules);

// 3. Coach xóa lịch (chỉ lịch chưa được đặt)
router.delete('/:scheduleId', auth, authorize('coach'), scheduleController.deleteSchedule);

module.exports = router;