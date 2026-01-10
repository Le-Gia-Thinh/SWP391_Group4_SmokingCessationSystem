// cron/paymentExpireJob.js

const cron = require('node-cron');
const { sql, dbConfig } = require('../config/database');

// Chạy mỗi phút để mark expired orders
cron.schedule('* * * * *', async () => {
    try {
        const pool = await sql.connect(dbConfig);
        const expirationDate = new Date(Date.now() - 15 * 60 * 1000);

        // 1) Cập nhật PAYMENT
        await pool.request()
            .input('expiration', sql.DateTime2, expirationDate)
            .query(`
        UPDATE PAYMENT
        SET payment_status = 'failed'
        WHERE payment_status = 'pending'
          AND payment_date < @expiration
      `);

        // 2) Cập nhật USER_SUBSCRIPTION
        await pool.request()
            .input('expiration', sql.DateTime2, expirationDate)
            .query(`
        UPDATE USER_SUBSCRIPTION
        SET payment_status = 'failed'
        WHERE payment_status = 'pending'
          AND subscription_id IN (
            SELECT subscription_id
            FROM PAYMENT
            WHERE payment_status = 'failed'
              AND payment_date < @expiration
          )
      `);
    } catch (err) {
        console.error('❌ paymentExpireJob error:', err);
    }
});
