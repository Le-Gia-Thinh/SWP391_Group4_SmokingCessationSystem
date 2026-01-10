// routes/appointment.js
const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointmentController');
const { auth, authorize } = require('../middleware/auth');

// Member đặt lịch hẹn
router.post('/', auth, authorize('member'), appointmentController.bookAppointment);

// Coach duyệt cuộc hẹn
router.put('/:id/accept', auth, authorize('coach'), appointmentController.acceptAppointment);
router.put('/:id/reject', auth, authorize('coach'), appointmentController.rejectAppointment);

// Coach xem các cuộc hẹn đang chờ xử lý
router.get('/pending', auth, authorize('coach'), appointmentController.getPendingAppointments);

// Member hủy cuộc hẹn
router.delete('/:id', auth, authorize('member'), appointmentController.cancelAppointment);

// Member xem tất cả lịch đã đặt
router.get('/my-bookings', auth, authorize('member'), appointmentController.getMyAppointments);

// Coach xem tất cả lịch của mình (đã đặt và còn trống)
router.get('/coach-schedules', auth, authorize('coach'), appointmentController.getCoachAllSchedules);

// Coach xem tất cả các phiên coaching của mình (đã đặt, đã duyệt, đã hủy, ...)
router.get('/all-coach-appointments', auth, authorize('coach'), appointmentController.getCoachAllAppointments);

// Coach submit hoàn tất buổi tư vấn
router.put('/:id/complete', auth, authorize('coach'), appointmentController.completeAppointment);

// Coach báo cáo member không tham dự
router.post('/:id/report-missing-member', auth, authorize('coach'), appointmentController.reportMissingMember);

// Member tố cáo coach vắng mặt
router.post('/report-missing-coach', auth, authorize('member'), appointmentController.reportMissingCoach);

// Hiện thị danh sách tư vấn trong 1 giờ sắp tới
router.get('/upcoming', auth, authorize('member'), appointmentController.getUpcomingAppointments);

module.exports = router;