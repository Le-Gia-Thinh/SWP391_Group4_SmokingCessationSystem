// routes/admin.js
const express = require('express');
const router = express.Router();
const coachController = require('../controllers/coachController');
const { auth, authorize } = require('../middleware/auth');

// Tạo Coach mới
router.post('/create-coach', auth, authorize('admin'), coachController.createCoachAccount);

// Lấy danh sách Coach
router.get('/get-coaches', auth, authorize('admin'), coachController.getAllCoaches);

// Cập nhật thông tin Coach
router.put('/update-coach/:coach_id', auth, authorize('admin'), coachController.updateCoachInfo);

// Xóa Coach
router.delete('/delete-coach/:coach_id', auth, authorize('admin'), coachController.deleteCoach);

// Khôi phục Coach
router.put('/restore-coach/:coach_id', auth, authorize('admin'), coachController.restoreCoach);

module.exports = router;