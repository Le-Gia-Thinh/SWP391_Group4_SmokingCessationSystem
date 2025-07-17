const { sql, dbConfig } = require('../config/database');
const dayjs = require('dayjs');
const crypto = require('crypto');
const PayOS = require('@payos/node');

// Khởi tạo SDK PayOS
const payOS = new PayOS(
    process.env.PAYOS_CLIENT_ID,
    process.env.PAYOS_API_KEY,
    process.env.PAYOS_CHECKSUM_KEY
);

// Hàm sắp xếp object key theo alphabet
function sortObjDataByKey(object) {
    return Object.keys(object)
        .sort()
        .reduce((obj, key) => {
            obj[key] = object[key];
            return obj;
        }, {});
}

// Chuyển object thành chuỗi query string để ký
function convertObjToQueryStr(obj) {
    return Object.keys(obj)
        .filter(k => obj[k] !== undefined)
        .map(k => {
            let v = obj[k];
            if (Array.isArray(v)) v = JSON.stringify(v.map(sortObjDataByKey));
            if ([null, undefined, 'null', 'undefined'].includes(v)) v = '';
            return `${k}=${v}`;
        }).join('&');
}

/**
 * Xử lý webhook callback từ PayOS
 * - Chỉ cập nhật start/end khi payment thành công
 */
exports.handlePaymentCallback = async (req, res) => {
    try {
        console.log('✅ Webhook body:', req.body);
        const { data, signature } = req.body;
        if (!data || !signature) {
            return res.status(200).json({ success: true, message: 'Webhook OK' });
        }

        // Verify chữ ký
        const sorted = sortObjDataByKey(data);
        const qs = convertObjToQueryStr(sorted);
        const sig = crypto.createHmac('sha256', process.env.PAYOS_CHECKSUM_KEY)
            .update(qs)
            .digest('hex');


        if (sig !== signature) {
            return res.status(200).json({ success: true, message: 'Invalid signature' });
        }
        console.log('🔍 So sánh chữ ký:', { signature, calculatedSignature });
        console.log('dataQueryStr:', dataQueryStr);


        const { orderCode, code } = data;
        const status = code === '00' ? 'paid' : 'failed';

        const pool = await sql.connect(dbConfig);
        // Lấy subscription_id & package_id
        const info = await pool.request()
            .input('orderCode', sql.NVarChar, orderCode.toString())
            .query(`
        SELECT p.subscription_id, us.package_id
        FROM PAYMENT p
        JOIN USER_SUBSCRIPTION us
        ON us.subscription_id = p.subscription_id
        WHERE p.order_code = @orderCode
        `);
        if (!info.recordset.length) {
            return res.status(200).json({ success: false, message: 'Subscription not found' });
        }
        const { subscription_id, package_id } = info.recordset[0];

        // Chỉ xử lý nếu chưa paid
        const prev = await pool.request()
            .input('orderCode', sql.NVarChar, orderCode.toString())
            .query('SELECT payment_status FROM PAYMENT WHERE order_code = @orderCode');
        if (prev.recordset[0].payment_status !== 'paid') {
            // 1) Cập nhật PAYMENT
            await pool.request()
                .input('status', sql.NVarChar, status)
                .input('orderCode', sql.NVarChar, orderCode.toString())
                .query('UPDATE PAYMENT SET payment_status = @status WHERE order_code = @orderCode');

            if (status === 'paid') {
                // 2) Khi thanh toán thành công, gán start_date & end_date
                const pkg = await pool.request()
                    .input('package_id', sql.Int, package_id)
                    .query('SELECT duration_days FROM SUBSCRIPTION_PACKAGE WHERE package_id = @package_id');
                const duration = pkg.recordset[0]?.duration_days || 0;

                const now = dayjs();
                const end = now.add(duration, 'day');
                const startD = now.toDate();
                const endD = end.toDate();

                await pool.request()
                    .input('status', sql.NVarChar, status)
                    .input('subscriptionId', sql.Int, subscription_id)
                    .input('startDate', sql.DateTime2, startD)
                    .input('endDate', sql.DateTime2, endD)
                    .query(`
            UPDATE USER_SUBSCRIPTION
            SET payment_status = @status,
                start_date     = @startDate,
                end_date       = @endDate
            WHERE subscription_id = @subscriptionId
            `);
            } else {
                // Nếu thất bại thì chỉ update status
                await pool.request()
                    .input('status', sql.NVarChar, status)
                    .input('subscriptionId', sql.Int, subscription_id)
                    .query(`
            UPDATE USER_SUBSCRIPTION
            SET payment_status = @status
            WHERE subscription_id = @subscriptionId
            `);
            }
        }

        // 3) Gửi notification nếu paid 
        if (status === 'paid') {
            const usr = await pool.request()
                .input('subscriptionId', sql.Int, subscription_id)
                .query('SELECT user_id FROM USER_SUBSCRIPTION WHERE subscription_id = @subscriptionId');
            const userId = usr.recordset[0].user_id;
            const content = '💳 Cảm ơn bạn đã thanh toán! Gói dịch vụ đã được kích hoạt. Chúc bạn sớm cai thuốc thành công!';

            const chk = await pool.request()
                .input('user_id', sql.Int, userId)
                .input('content', sql.NVarChar, content)
                .query('SELECT 1 FROM NOTIFICATION WHERE user_id = @user_id AND content = @content');
            if (!chk.recordset.length) {
                await pool.request()
                    .input('user_id', sql.Int, userId)
                    .input('title', sql.NVarChar, 'Thanh toán thành công')
                    .input('content', sql.NVarChar, content)
                    .input('notification_type', sql.VarChar, 'payment')
                    .input('created_at', sql.DateTime2, new Date())
                    .input('is_read', sql.Bit, 0)
                    .query(`
            INSERT INTO NOTIFICATION
                (user_id, title, content, notification_type, created_at, is_read)
            VALUES
                (@user_id, @title, @content, @notification_type, @created_at, @is_read)
            `);
            }
        }

        return res.status(200).json({ success: true, message: 'Webhook processed' });
    } catch (err) {
        console.error('❌ handlePaymentCallback error:', err);
        return res.status(500).json({ success: false, message: 'Error processing webhook' });
    }
};

/**
 * Tạo đơn thanh toán redirect — chỉ lưu pending, không gán start/end
 */
exports.createRedirectPayment = async (req, res) => {
    const { packageId, amount, description } = req.body;
    const userId = req.user.id;
    try {
        const pool = await sql.connect(dbConfig);

        // 1) Tạo USER_SUBSCRIPTION pending (start/end NULL)
        const sub = await pool.request()
            .input('user_id', sql.Int, userId)
            .input('package_id', sql.Int, packageId)
            .input('payment_status', sql.NVarChar, 'pending')
            .query(`
        INSERT INTO USER_SUBSCRIPTION
            (user_id, package_id, payment_status)
        OUTPUT INSERTED.subscription_id
        VALUES
            (@user_id, @package_id, @payment_status)
        `);
        const subscriptionId = sub.recordset[0].subscription_id;
        const orderCode = Number(String(Date.now()).slice(-6));
        const amountInt = parseInt(amount, 10);

        // 2) Tạo link PayOS
        const payBody = {
            orderCode,
            amount: amountInt,
            description: (description || '').slice(0, 25),
            items: [{ name: 'Gói dịch vụ', quantity: 1, price: amountInt }],
            returnUrl: `${process.env.CLIENT_URL}/payment-success`,
            cancelUrl: `${process.env.CLIENT_URL}/checkout`,
            expiredAt: Math.floor(Date.now() / 1000) + 900
        };
        const payRes = await payOS.createPaymentLink(payBody);
        const checkoutUrl = payRes.checkoutUrl;
        if (!checkoutUrl) throw new Error('No checkoutUrl');

        // 3) Lưu PAYMENT pending
        await pool.request()
            .input('subscription_id', sql.Int, subscriptionId)
            .input('amount', sql.Float, amountInt)
            .input('payment_date', sql.DateTime2, new Date())
            .input('order_code', sql.NVarChar, orderCode.toString())
            .input('transaction_id', sql.NVarChar, orderCode.toString())
            .input('payment_method', sql.NVarChar, 'redirect')
            .input('payment_status', sql.NVarChar, 'pending')
            .input('note', sql.NVarChar, description || '')
            .query(`
        INSERT INTO PAYMENT
            (subscription_id, amount, payment_date,
            order_code, transaction_id, payment_method,
            payment_status, note)
        VALUES
            (@subscription_id,@amount,@payment_date,
            @order_code,@transaction_id,@payment_method,
            @payment_status,@note)
        `);

        return res.json({ success: true, checkoutUrl, orderCode });
    } catch (err) {
        console.error('❌ createRedirectPayment error:', err);
        return res.status(500).json({ success: false, message: 'Payment creation failed', error: err.message });
    }
};
