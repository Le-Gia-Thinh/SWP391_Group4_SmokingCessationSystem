// routes/coach.js
const express = require('express');
const router = express.Router();
const coachController = require('../controllers/coachController');
const { auth, authorize } = require('../middleware/auth');

// Route cho coach cập nhật link Google Meet
router.put('/update-meet-link', auth, authorize('coach'), coachController.updateMeetLink);

// Route để lấy danh sách coaches cho member
router.get('/list', coachController.getAllCoaches);

module.exports = router;