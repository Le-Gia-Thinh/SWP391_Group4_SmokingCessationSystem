// routes/admin.js
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { auth, authorize } = require('../middleware/auth');
const statController = require('../controllers/adminStatController');
const { getAverageMonthsByAddictionLevel } = require('../controllers/adminStatController');

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

// Admin xem tất cả feedback Member report Coach
router.get('/feedbacks/coach-violations', auth, authorize('admin'), adminController.getCoachViolations);

// Admin xem tất cả feedback Coach báo cáo Member vắng mặt
router.get('/reports/member-no-shows', auth, authorize('admin'), adminController.getMemberNoShowReports);

// Thống kê Member cho AdminStatDashBoard 
router.get('/users-summary', statController.getUsersSummary);
    
// Thống kê Doanh Thu cho AdminStatDashBoard 
router.get('/monthly-revenue', statController.getMonthlyRevenue);

// Thống kê Coach cho AdminStatDashBoard 
router.get('/active-coach-count', statController.getActiveCoachCount);

// Thống kê số tháng trung bình theo từng mức độ nghiện
router.get('/avg-months-by-addiction', getAverageMonthsByAddictionLevel);
module.exports = router;