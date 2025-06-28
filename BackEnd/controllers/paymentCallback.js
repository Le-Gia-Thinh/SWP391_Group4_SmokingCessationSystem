// controllers/paymentCallback.js
const { sql, dbConfig } = require('../config/database');

async function handlePaymentCallback(req, res) {
    const { paymentId, transactionId, resultCode } = req.body;
    if (!paymentId || !transactionId) {
        return res.status(400).json({ error: 'Thiếu paymentId hoặc transactionId' });
    }
    const status = resultCode === '00' ? 'success' : 'failed';

    let pool;
    try {
        pool = await sql.connect(dbConfig);
        const transaction = new sql.Transaction(pool);
        await transaction.begin();

        // Cập nhật PAYMENT
        await transaction.request()
            .input('payment_id', sql.Int, paymentId)
            .input('transaction_id', sql.VarChar, transactionId)
            .input('status', sql.VarChar, status)
            .query(`
        UPDATE PAYMENT
        SET transaction_id=@transaction_id, payment_status=@status, payment_date=GETDATE()
        WHERE payment_id=@payment_id
      `);

        if (status === 'success') {
            // Active subscription
            await transaction.request()
                .input('payment_id', sql.Int, paymentId)
                .query(`
          UPDATE us SET payment_status='active', start_date=GETDATE()
          FROM USER_SUBSCRIPTION us JOIN PAYMENT p ON p.subscription_id=us.subscription_id
          WHERE p.payment_id=@payment_id
        `);

            // Update end_date
            await transaction.request()
                .input('payment_id', sql.Int, paymentId)
                .query(`
          UPDATE us SET end_date=DATEADD(day, sp.duration_days, us.start_date)
          FROM USER_SUBSCRIPTION us
          JOIN PAYMENT p ON p.subscription_id=us.subscription_id
          JOIN SUBSCRIPTION_PACKAGE sp ON us.package_id=sp.package_id
          WHERE p.payment_id=@payment_id
        `);
        } else {
            await transaction.request()
                .input('payment_id', sql.Int, paymentId)
                .query(`
          UPDATE us SET payment_status='failed'
          FROM USER_SUBSCRIPTION us JOIN PAYMENT p ON p.subscription_id=us.subscription_id
          WHERE p.payment_id=@payment_id
        `);
        }

        await transaction.commit();
        res.json({ message: 'Cập nhật thành công', status, paymentId, transactionId });
    } catch (err) {
        if (pool && pool.connected) await pool.close();
        console.error('Callback error:', err);
        res.status(500).json({ error: 'Không cập nhật được trạng thái thanh toán' });
    } finally {
        if (pool && pool.connected) await pool.close();
    }
}

async function checkPaymentStatus(req, res) {
    const { paymentId } = req.params;
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Chưa đăng nhập' });

    let pool;
    try {
        pool = await sql.connect(dbConfig);
        const result = await pool.request()
            .input('payment_id', sql.Int, paymentId)
            .input('user_id', sql.Int, userId)
            .query(`
        SELECT p.payment_status, p.transaction_id, us.payment_status AS subscription_status
        FROM PAYMENT p
        JOIN USER_SUBSCRIPTION us ON p.subscription_id=us.subscription_id
        WHERE p.payment_id=@payment_id AND us.user_id=@user_id
      `);
        if (!result.recordset.length) return res.status(404).json({ error: 'Không tìm thấy thanh toán' });
        res.json(result.recordset[0]);
    } catch (err) {
        console.error('Status check error:', err);
        res.status(500).json({ error: 'Không kiểm tra được trạng thái' });
    } finally {
        if (pool && pool.connected) await pool.close();
    }
}

module.exports = { handlePaymentCallback, checkPaymentStatus };