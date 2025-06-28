// controllers/paymentController.js
require('dotenv').config();
const { v4: uuidv4 } = require('uuid');
const { sql, dbConfig } = require('../config/database');
const { bin, accountNo, accountName } = require('../config/vietQR.config');

exports.createPayment = async (req, res) => {
    const { packageId, amount, description } = req.body;
    const userId = req.user?.id;

    // 1) Kiểm tra xác thực và input
    if (!userId) {
        return res.status(401).json({ error: 'Chưa đăng nhập' });
    }
    if (!packageId || isNaN(amount) || amount < 0) {
        return res.status(400).json({ error: 'PackageId hoặc amount không hợp lệ' });
    }
    if (!bin || !accountNo || !accountName) {
        return res.status(500).json({ error: 'Cấu hình VietQR không đầy đủ' });
    }

    let pool;
    try {
        pool = await sql.connect(dbConfig);

        // 2) Lấy thông tin gói
        const pkgRes = await pool.request()
            .input('pid', sql.Int, packageId)
            .query(`
        SELECT package_name, duration_days
        FROM SUBSCRIPTION_PACKAGE
        WHERE package_id = @pid
      `);
        if (!pkgRes.recordset.length) {
            return res.status(404).json({ error: 'Gói dịch vụ không tồn tại' });
        }
        const { package_name, duration_days } = pkgRes.recordset[0];

        let subscriptionId;

        // 3) Kiểm tra subscription active để gia hạn
        const activeSub = await pool.request()
            .input('uid', sql.Int, userId)
            .input('pid', sql.Int, packageId)
            .query(`
        SELECT subscription_id
        FROM USER_SUBSCRIPTION
        WHERE user_id = @uid
          AND package_id = @pid
          AND payment_status = 'active'
          AND end_date > GETDATE()
      `);

        if (activeSub.recordset.length) {
            // Gia hạn trên subscription hiện có
            subscriptionId = activeSub.recordset[0].subscription_id;
            await pool.request()
                .input('sid', sql.Int, subscriptionId)
                .input('dura', sql.Int, duration_days)
                .query(`
          UPDATE USER_SUBSCRIPTION
          SET end_date = DATEADD(day, @dura, end_date)
          WHERE subscription_id = @sid
        `);
        } else {
            // Tạo mới subscription (pending)
            const now = new Date();
            const end = new Date(now);
            end.setDate(end.getDate() + duration_days);

            const subRes = await pool.request()
                .input('uid', sql.Int, userId)
                .input('pid', sql.Int, packageId)
                .input('sd', sql.DateTime, now)
                .input('ed', sql.DateTime, end)
                .input('auto', sql.Bit, false)
                .input('ps', sql.VarChar, 'pending')
                .query(`
          INSERT INTO USER_SUBSCRIPTION
            (user_id, package_id, start_date, end_date, auto_renew, payment_status)
          OUTPUT INSERTED.subscription_id
          VALUES
            (@uid, @pid, @sd, @ed, @auto, @ps)
        `);
            subscriptionId = subRes.recordset[0].subscription_id;
        }

        // 4) Tạo QR code URL
        const info = encodeURIComponent(description || `Thanh toán gói ${package_name}`);
        const { bin, accountNo, accountName, templateId } = require('../config/vietQR.config');

        const qrImage =
            `https://api.vietqr.io/image/${bin}-${accountNo}-${templateId}.jpg` +
            `?accountName=${encodeURIComponent(accountName)}` +
            `&amount=${amount}` +
            `&addInfo=${info}`;
        // 5) Chèn PAYMENT mới với transaction_id = uuid
        const now2 = new Date();
        const transactionId = uuidv4();
        const payRes = await pool.request()
            .input('subscription_id', sql.Int, subscriptionId)
            .input('amount', sql.Decimal(18, 2), amount)
            .input('payment_date', sql.DateTime, now2)
            .input('transaction_id', sql.VarChar, transactionId)
            .input('payment_method', sql.VarChar, 'vietqr')
            .input('payment_status', sql.VarChar, 'pending')
            .input('qr_code_url', sql.VarChar, qrImage)
            .input('note', sql.VarChar, description || '')
            .query(`
        INSERT INTO PAYMENT
          (subscription_id, amount, payment_date, transaction_id,
           payment_method, payment_status, qr_code_url, note)
        OUTPUT INSERTED.payment_id
        VALUES
          (@subscription_id, @amount, @payment_date, @transaction_id,
           @payment_method, @payment_status, @qr_code_url, @note)
      `);

        const paymentId = payRes.recordset[0].payment_id;

        // 6) Trả về client
        return res.json({
            paymentId,
            subscriptionId,
            qrImage,
            accountNo,
            accountName,
            amount,
            description: description || `Thanh toán gói ${package_name}`,
            packageName: package_name,
        });

    } catch (err) {
        console.error('Payment creation error:', err);
        return res.status(500).json({ error: 'Không tạo được payment record' });
    } finally {
        if (pool) await pool.close();
    }
};

exports.getPaymentInfo = async (req, res) => {
    const { paymentId } = req.params;
    const userId = req.user?.id;
    if (!userId) {
        return res.status(401).json({ error: 'Chưa đăng nhập' });
    }

    let pool;
    try {
        pool = await sql.connect(dbConfig);
        const result = await pool.request()
            .input('payment_id', sql.Int, paymentId)
            .input('user_id', sql.Int, userId)
            .query(`
        SELECT
          p.payment_id,
          p.amount,
          p.payment_status,
          p.qr_code_url,
          p.note,
          sp.package_name,
          us.subscription_id,
          us.payment_status AS subscription_status
        FROM PAYMENT p
        JOIN USER_SUBSCRIPTION us ON p.subscription_id = us.subscription_id
        JOIN SUBSCRIPTION_PACKAGE sp ON us.package_id = sp.package_id
        WHERE p.payment_id = @payment_id
          AND us.user_id = @user_id
      `);

        if (!result.recordset.length) {
            return res.status(404).json({ error: 'Không tìm thấy thông tin thanh toán' });
        }

        res.json(result.recordset[0]);
    } catch (err) {
        console.error('Get payment info error:', err);
        res.status(500).json({ error: 'Không lấy được thông tin thanh toán' });
    } finally {
        if (pool) await pool.close();
    }
};
