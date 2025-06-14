const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointmentController');
const auth = require('../middleware/auth');


router.post('/', auth('member'), appointmentController.bookAppointment);
router.put('/:id/accept', auth('coach'), appointmentController.acceptAppointment);
router.put('/:id/reject', auth('coach'), appointmentController.rejectAppointment);
router.get('/pending', auth('coach'), appointmentController.getPendingAppointments);
router.delete('/:id', auth('member'), appointmentController.cancelAppointment);

module.exports = router;