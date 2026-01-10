const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { auth } = require('../middleware/auth');

// Đặt đơn hàng mới (cần xác thực)
router.post('/', auth, paymentController.createRedirectPayment);

// Webhook từ PayOS (không cần auth!)
router.post('/callback', paymentController.handlePaymentCallback);

// Test GET
router.get('/callback', (req, res) => {
  res.status(200).json({ message: 'Webhook GET ok' });
});

module.exports = router;
