// routes/admin.js
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { auth, authorize } = require('../middleware/auth');

// Tạo Coach mới
router.post('/create-coach', auth, authorize('admin'), adminController.createCoachAccount);

// Lấy danh sách Coach
router.get('/get-coaches', auth, authorize('admin'), adminController.getAllCoaches);

// Cập nhật thông tin Coach
router.put('/update-coach/:coach_id', auth, authorize('admin'), adminController.updateCoachInfo);

// Xóa Coach
router.delete('/delete-coach/:coach_id', auth, authorize('admin'), adminController.deleteCoach);

// Khôi phục Coach
router.put('/restore-coach/:coach_id', auth, authorize('admin'), adminController.restoreCoach);

module.exports = router;