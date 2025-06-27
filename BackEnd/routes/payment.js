// src/routes/payment.js
const express = require('express');
const router = express.Router();
const { createPayment } = require('../controllers/paymentController');

// POST /api/payment
// Body JSON: { method: 'vnpay'|'momo'|'creditcard', amount: number, bankCode?: string }
router.post('/', createPayment);

module.exports = router;
