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

// Sắp xếp object key theo alphabet
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
        })
        .join('&');
}

/**
 * Xử lý webhook callback từ PayOS
 */
exports.handlePaymentCallback = async (req, res) => {
    try {
        console.log('✅ Webhook body:', req.body);
        const { data, signature } = req.body;

        // ✅ FIX: Xử lý trường hợp không có data hoặc signature
        if (!data || !signature) {
            return res.status(200).json({ success: true, message: 'Webhook OK' });
        }

        // ✅ FIX: Kiểm tra orderCode trước khi xử lý
        const { orderCode, code, paidAt } = data;
        if (!orderCode) {
            console.warn('⚠️ Missing orderCode in webhook data');
            return res.status(200).json({ success: true, message: 'Missing orderCode' });
        }

        // 1) Tạo chuỗi và tính chữ ký
        const sortedData = sortObjDataByKey(data);
        const dataQueryStr = convertObjToQueryStr(sortedData);
        const calculatedSignature = crypto
            .createHmac('sha256', process.env.PAYOS_CHECKSUM_KEY)
            .update(dataQueryStr)
            .digest('hex');

        // 2) Log để debug
        console.log('🔍 So sánh chữ ký:', { received: signature, calculated: calculatedSignature });
        console.log('dataQueryStr:', dataQueryStr);

        // 3) So sánh chữ ký
        if (calculatedSignature !== signature) {
            console.warn('⚠️ Invalid signature');
            return res.status(200).json({ success: true, message: 'Invalid signature' });
        }

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
            .query(`SELECT payment_status FROM PAYMENT WHERE order_code = @orderCode`);
        if (prev.recordset[0].payment_status !== 'paid') {
            // Cập nhật PAYMENT
            await pool.request()
                .input('status', sql.NVarChar, status)
                .input('orderCode', sql.NVarChar, orderCode.toString())
                .query(`
                    UPDATE PAYMENT
                    SET payment_status = @status
                    WHERE order_code = @orderCode
                `);

            if (status === 'paid') {
                // Khi thanh toán thành công: tính start/end mới
                const paidTime = paidAt ? dayjs(paidAt) : dayjs();
                const pkg = await pool.request()
                    .input('package_id', sql.Int, package_id)
                    .query(`
                        SELECT duration_days
                        FROM SUBSCRIPTION_PACKAGE
                        WHERE package_id = @package_id
                    `);
                const duration = pkg.recordset[0]?.duration_days || 0;
                const endDate = paidTime.add(duration, 'day').toDate();

                await pool.request()
                    .input('status', sql.NVarChar, status)
                    .input('subscriptionId', sql.Int, subscription_id)
                    .input('start_date', sql.DateTime2, paidTime.toDate())
                    .input('end_date', sql.DateTime2, endDate)
                    .query(`
                        UPDATE USER_SUBSCRIPTION
                        SET payment_status = @status,
                            start_date     = @start_date,
                            end_date       = @end_date
                        WHERE subscription_id = @subscriptionId
                    `);
            } else {
                // Nếu thất bại: chỉ update status
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

        // Gửi notification nếu paid
        if (status === 'paid') {
            const usr = await pool.request()
                .input('subscriptionId', sql.Int, subscription_id)
                .query(`
                    SELECT user_id
                    FROM USER_SUBSCRIPTION
                    WHERE subscription_id = @subscriptionId
                `);
            const userId = usr.recordset[0].user_id;
            const content = '💳 Cảm ơn bạn đã thanh toán! Gói đã được kích hoạt.';
            const chk = await pool.request()
                .input('user_id', sql.Int, userId)
                .input('content', sql.NVarChar, content)
                .query(`
                    SELECT 1
                    FROM NOTIFICATION
                    WHERE user_id = @user_id AND content = @content
                `);
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
 * Tạo đơn thanh toán redirect — chỉ lưu pending, gán start_date, end_date = NULL
 */
exports.createRedirectPayment = async (req, res) => {
    const { packageId, amount, description } = req.body;
    const userId = req.user.id;

    try {
        // ✅ VALIDATION - Kiểm tra dữ liệu đầu vào
        if (!packageId || packageId === null || packageId === undefined) {
            console.error('❌ Missing or invalid packageId:', packageId);
            return res.status(400).json({
                success: false,
                message: 'Package ID is required and cannot be null'
            });
        }

        // ✅ FIX: Validate amount properly - check for NaN and non-numeric strings
        const numericAmount = Number(amount);
        if (!amount || isNaN(numericAmount) || numericAmount <= 0) {
            console.error('❌ Invalid amount:', amount);
            return res.status(400).json({
                success: false,
                message: 'Amount must be greater than 0'
            });
        }

        if (!userId) {
            console.error('❌ Missing userId from token');
            return res.status(401).json({
                success: false,
                message: 'User authentication required'
            });
        }

        console.log('📦 Payment request:', { userId, packageId, amount, description });

        const pool = await sql.connect(dbConfig);

        // ✅ KIỂM TRA PACKAGE TỒN TẠI
        const packageCheck = await pool.request()
            .input('package_id', sql.Int, parseInt(packageId))
            .query(`
                SELECT package_id, package_name, price, duration_days 
                FROM SUBSCRIPTION_PACKAGE 
                WHERE package_id = @package_id
            `);

        if (!packageCheck.recordset.length) {
            console.error('❌ Package not found:', packageId);
            return res.status(404).json({
                success: false,
                message: 'Subscription package not found'
            });
        }

        const packageInfo = packageCheck.recordset[0];
        console.log('📋 Package info:', packageInfo);

        // 1) Tạo USER_SUBSCRIPTION pending với package_id hợp lệ
        const now = new Date();
        const sub = await pool.request()
            .input('user_id', sql.Int, userId)
            .input('package_id', sql.Int, parseInt(packageId)) // ✅ Đảm bảo parseInt
            .input('payment_status', sql.NVarChar, 'pending')
            .input('start_date', sql.DateTime2, now)
            .input('end_date', sql.DateTime2, null)
            .query(`
                INSERT INTO USER_SUBSCRIPTION
                  (user_id, package_id, payment_status, start_date, end_date)
                OUTPUT INSERTED.subscription_id
                VALUES
                  (@user_id, @package_id, @payment_status, @start_date, @end_date)
            `);

        const subscriptionId = sub.recordset[0].subscription_id;
        console.log('✅ Created subscription:', subscriptionId);

        // 2) Tạo orderCode và validate PayOS data
        const orderCode = Number(String(Date.now()).slice(-6));
        const amountInt = parseInt(numericAmount, 10); // ✅ Use validated numeric amount

        // ✅ VALIDATION cho PayOS
        if (!process.env.CLIENT_URL) {
            throw new Error('CLIENT_URL environment variable is not set');
        }

        const payBody = {
            orderCode,
            amount: amountInt,
            description: (description || 'Payment for subscription').slice(0, 25),
            items: [{
                name: packageInfo.package_name || 'Subscription Package',
                quantity: 1,
                price: amountInt
            }],
            returnUrl: `${process.env.CLIENT_URL}/payment-success`,
            cancelUrl: `${process.env.CLIENT_URL}/checkout`,
            expiredAt: Math.floor(Date.now() / 1000) + 900  // 15 phút
        };

        console.log('💳 PayOS request body:', payBody);

        // ✅ VALIDATE PayOS credentials
        if (!process.env.PAYOS_CLIENT_ID || !process.env.PAYOS_API_KEY || !process.env.PAYOS_CHECKSUM_KEY) {
            throw new Error('PayOS credentials are not properly configured');
        }

        const payRes = await payOS.createPaymentLink(payBody);

        if (!payRes || !payRes.checkoutUrl) {
            throw new Error('PayOS did not return a valid checkout URL');
        }

        console.log('✅ PayOS response:', { checkoutUrl: payRes.checkoutUrl });

        // 3) Lưu PAYMENT pending
        await pool.request()
            .input('subscription_id', sql.Int, subscriptionId)
            .input('amount', sql.Float, amountInt)
            .input('payment_date', sql.DateTime2, now)
            .input('order_code', sql.NVarChar, orderCode.toString())
            .input('transaction_id', sql.NVarChar, String(orderCode))
            .input('payment_method', sql.NVarChar, 'redirect')
            .input('payment_status', sql.NVarChar, 'pending')
            .input('note', sql.NVarChar, (description || '').slice(0, 100)) // ✅ Truncate note to prevent DB error
            .query(`
                INSERT INTO PAYMENT
                  (subscription_id, amount, payment_date,
                   order_code, transaction_id, payment_method,
                   payment_status, note)
                VALUES
                  (@subscription_id, @amount, @payment_date,
                   @order_code, @transaction_id, @payment_method,
                   @payment_status, @note)
            `);

        console.log('✅ Payment record created successfully');

        return res.json({
            success: true,
            checkoutUrl: payRes.checkoutUrl,
            orderCode,
            subscriptionId
        });

    } catch (err) {
        console.error('❌ createRedirectPayment error:', err);

        // Specific error handling
        if (err.message.includes('package_id')) {
            return res.status(400).json({
                success: false,
                message: 'Invalid package ID provided',
                error: err.message
            });
        }

        if (err.message.includes('PayOS') || err.message.includes('Invalid Parameter')) {
            return res.status(500).json({
                success: false,
                message: 'Payment gateway configuration error',
                error: err.message
            });
        }

        return res.status(500).json({
            success: false,
            message: 'Payment creation failed',
            error: err.message
        });
    }
};