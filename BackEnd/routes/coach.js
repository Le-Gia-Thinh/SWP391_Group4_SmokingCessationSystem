// routes/coach.js
const express = require('express');
const router = express.Router();
const coachController = require('../controllers/coachController');
const { auth, authorize } = require('../middleware/auth');

// Admin tạo account Coach
router.post('/create', auth, authorize("admin"), coachController.createCoachAccount);

// Route cho coach cập nhật link Google Meet
router.put('/update-meet-link', auth, authorize('coach'), coachController.updateMeetLink);


module.exports = router;