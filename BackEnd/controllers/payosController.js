const axios = require('axios');

const { sql, dbConfig } = require('../config/database');
exports.createPayOSPayment = async (req, res) => {
    const { packageId, amount, description } = req.body;
    const userId = req.user?.id;
    const orderCode = Math.floor(Math.random() * 1000000000);

    try {
        const response = await axios.post('https://api.payos.vn/v1/payment-requests', {
            orderCode,
            amount,
            description,
            returnUrl: process.env.PAYOS_REDIRECT_URL,
            cancelUrl: process.env.CLIENT_URL + '/checkout',
            webhookUrl: process.env.PAYOS_WEBHOOK_URL,
        }, {
            headers: {
                'x-client-id': process.env.PAYOS_CLIENT_ID,
                'x-api-key': process.env.PAYOS_API_KEY,
            },
        });

        // Lưu đơn hàng
        const pool = await sql.connect(dbConfig);
        await pool.request()
            .input('customer_id', sql.Int, userId)
            .input('amount', sql.Int, amount)
            .input('transaction_id', sql.VarChar, orderCode)
            .input('method', sql.VarChar, 'PayOS')
            .input('payment_status', sql.VarChar, 'PENDING')
            .query(`
        INSERT INTO PAYMENT (customer_id, amount, transaction_id, method, payment_status)
        VALUES (@customer_id, @amount, @transaction_id, @method, @payment_status)
      `);

        res.json(response.data.data); // checkoutUrl
    } catch (err) {
        console.error('PayOS ERROR:', err.response?.data || err.message);
        res.status(500).json({ error: 'Không thể tạo thanh toán PayOS' });
    }
};

exports.verifyPayosPayment = async (req, res) => {
    const { orderCode } = req.body;
    const userId = req.user?.id;

    try {
        const response = await axios.get(`https://api.payos.vn/v1/payment-requests/${orderCode}`, {
            headers: {
                'x-client-id': process.env.PAYOS_CLIENT_ID,
                'x-api-key': process.env.PAYOS_API_KEY,
            }
        });

        const data = response.data.data;
        if (data.status === 'PAID') {
            const pool = await sql.connect(dbConfig);
            await pool.request()
                .input('transaction_id', sql.VarChar, orderCode)
                .query(`UPDATE PAYMENT SET payment_status='success' WHERE transaction_id=@transaction_id`);

            res.json({ success: true });
        } else {
            res.status(400).json({ error: 'Chưa thanh toán' });
        }
    } catch (err) {
        res.status(500).json({ error: 'Xác minh thất bại' });
    }
};
