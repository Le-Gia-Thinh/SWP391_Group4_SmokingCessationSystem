// routes/schedule.js
const express = require('express');
const router = express.Router();
const scheduleController = require('../controllers/scheduleController');
const { auth, authorize } = require('../middleware/auth');

// 1. Coach tạo lịch
router.post('/', auth, authorize('coach'), scheduleController.createSchedule);

// 1.1 Member xem
router.get('/available/:coachId', scheduleController.getAvailableSchedules);

module.exports = router;