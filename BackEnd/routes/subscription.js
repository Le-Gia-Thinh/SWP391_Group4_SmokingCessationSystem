const express = require('express');
const router = express.Router();
const { sql, dbConfig } = require('../config/database');
const { auth } = require('../middleware/auth');

// Lấy danh sách packages
router.get('/packages', async (req, res) => {
    try {
        const pool = await sql.connect(dbConfig);
        const result = await pool.request().query(`
            SELECT 
                package_id,
                package_name,
                description,
                price,
                duration_days,
                coach_access,
                community_access,
                premium_content,
                created_at
            FROM SUBSCRIPTION_PACKAGE 
            ORDER BY price ASC
        `);

        res.json(result.recordset);
    } catch (err) {
        console.error('❌ Error fetching packages:', err);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy danh sách gói dịch vụ',
            error: err.message
        });
    }
});

// Lấy thông tin subscription hiện tại của user
router.get('/current', auth, async (req, res) => {
    try {
        const userId = req.user.userId;
        const pool = await sql.connect(dbConfig);

        const result = await pool.request()
            .input('userId', sql.Int, userId)
            .query(`
                SELECT 
                    us.subscription_id,
                    us.start_date,
                    us.end_date,
                    us.auto_renew,
                    us.payment_status,
                    sp.package_name,
                    sp.description,
                    sp.price,
                    sp.duration_days,
                    sp.coach_access,
                    sp.community_access,
                    sp.premium_content
                FROM USER_SUBSCRIPTION us
                JOIN SUBSCRIPTION_PACKAGE sp ON us.package_id = sp.package_id
                WHERE us.user_id = @userId 
                    AND us.payment_status = 'success'
                    AND us.end_date >= GETDATE()
                ORDER BY us.end_date DESC
            `);

        res.json({
            success: true,
            subscription: result.recordset[0] || null
        });
    } catch (err) {
        console.error('❌ Error fetching current subscription:', err);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy thông tin subscription',
            error: err.message
        });
    }
});

// Lấy lịch sử subscriptions
router.get('/history', auth, async (req, res) => {
    try {
        const userId = req.user.userId;
        const pool = await sql.connect(dbConfig);

        const result = await pool.request()
            .input('userId', sql.Int, userId)
            .query(`
                SELECT 
                    us.subscription_id,
                    us.start_date,
                    us.end_date,
                    us.auto_renew,
                    us.payment_status,
                    sp.package_name,
                    sp.description,
                    sp.price,
                    sp.duration_days,
                    p.payment_date,
                    p.amount as paid_amount,
                    p.order_code
                FROM USER_SUBSCRIPTION us
                JOIN SUBSCRIPTION_PACKAGE sp ON us.package_id = sp.package_id
                LEFT JOIN PAYMENT p ON us.subscription_id = p.subscription_id
                WHERE us.user_id = @userId
                ORDER BY us.created_at DESC
            `);

        res.json({
            success: true,
            history: result.recordset
        });
    } catch (err) {
        console.error('❌ Error fetching subscription history:', err);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy lịch sử subscription',
            error: err.message
        });
    }
});

module.exports = router;