
// routes/payment.js
const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { handlePaymentCallback, checkPaymentStatus } = require('../controllers/paymentCallback');
const paymentController = require('../controllers/paymentController');

// Tạo payment mới
router.post('/', auth, paymentController.createPayment);

// Lấy thông tin payment
router.get('/:paymentId', auth, paymentController.getPaymentInfo);

// Callback từ ngân hàng hoặc webhook
router.post('/callback', handlePaymentCallback);

// Polling trạng thái thanh toán
router.get('/:paymentId/status', auth, checkPaymentStatus);

module.exports = router;
