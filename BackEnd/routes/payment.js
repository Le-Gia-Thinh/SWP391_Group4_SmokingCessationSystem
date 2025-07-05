// routes/payment.js
const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const paymentController = require('../controllers/paymentController');
const { handlePaymentCallback, checkPaymentStatus } = require('../controllers/paymentCallback');

// Middleware riêng parse JSON cho webhook POST
router.use('/callback', express.json());

// 1) Route GET để PayOS test webhook (chỉ cần trả 200)
router.get('/callback', (req, res) => {
    res.status(200).send('Webhook GET OK');  // hoặc .sendStatus(200);
});

// 2) Route POST – thực sự nhận callback từ PayOS
router.post('/callback', async (req, res) => {
    console.log('▶️ PAYOS CALLBACK BODY:', req.body);

    // Trường hợp webhook test POST từ PayOS (body rỗng)
    if (!req.body || Object.keys(req.body).length === 0) {
        return res.status(200).json({ success: true, message: 'Webhook test OK' });
    }

    try {
        await handlePaymentCallback(req, res);
    } catch (error) {
        console.error('❌ Callback xử lý lỗi:', error);
        return res.status(500).json({ error: 'Lỗi xử lý callback' });
    }
});

// 3) Tạo payment
router.post('/', auth, paymentController.createPayment);

// 4) Lấy thông tin payment
router.get('/:paymentId', auth, paymentController.getPaymentInfo);

// 5) Polling trạng thái
router.get('/:paymentId/status', auth, checkPaymentStatus);

module.exports = router;  