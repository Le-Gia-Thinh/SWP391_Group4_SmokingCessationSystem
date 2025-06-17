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

module.exports = router;