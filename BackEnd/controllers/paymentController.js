const { sql, dbConfig } = require('../config/database');
const dayjs = require('dayjs');
const crypto = require('crypto');
const PayOS = require('@payos/node');

// ✅ Khởi tạo SDK
const payOS = new PayOS(
    process.env.PAYOS_CLIENT_ID,
    process.env.PAYOS_API_KEY,
    process.env.PAYOS_CHECKSUM_KEY
);

// ✅ Hàm sắp xếp key trong object theo thứ tự alphabet (bắt buộc khi ký)
function sortObject(obj) {
    if (obj === null || typeof obj !== 'object' || Array.isArray(obj)) return obj;
    const sorted = {};
    Object.keys(obj).sort().forEach(key => {
        sorted[key] = sortObject(obj[key]);
    });
    return sorted;
}

function sortObjDataByKey(object) {
    const orderedObject = Object.keys(object)
        .sort()
        .reduce((obj, key) => {
            obj[key] = object[key];
            return obj;
        }, {});
    return orderedObject;
}

function convertObjToQueryStr(object) {
    return Object.keys(object)
        .filter((key) => object[key] !== undefined)
        .map((key) => {
            let value = object[key];
            // Nếu là mảng object thì sort từng object trong mảng
            if (value && Array.isArray(value)) {
                value = JSON.stringify(value.map((val) => sortObjDataByKey(val)));
            }
            // Nếu null hoặc undefined thì để rỗng
            if ([null, undefined, "undefined", "null"].includes(value)) {
                value = "";
            }
            return `${key}=${value}`;
        })
        .join("&");
}

// ✅ Webhook từ PayOS gửi về sau khi thanh toán
exports.handlePaymentCallback = async (req, res) => {
    try {
        console.log('✅ Webhook body:', req.body);

        const { data, signature } = req.body;

        // Nếu thiếu data hoặc signature (PayOS test webhook), vẫn trả về 200 OK
        if (!data || !signature) {
            return res.status(200).json({ success: true, message: 'Webhook check OK' });
        }

        // Tạo chuỗi ký đúng chuẩn PayOS
        const sortedData = sortObjDataByKey(data);
        const dataQueryStr = convertObjToQueryStr(sortedData);
        const calculatedSignature = crypto
            .createHmac('sha256', process.env.PAYOS_CHECKSUM_KEY)
            .update(dataQueryStr)
            .digest('hex');

        console.log('🔍 So sánh chữ ký:', { signature, calculatedSignature });
        console.log('dataQueryStr:', dataQueryStr);

        if (signature !== calculatedSignature) {
            // Trả về 200 OK để PayOS không báo lỗi webhook, nhưng không xử lý DB
            return res.status(200).json({ success: true, message: 'Invalid signature, but webhook OK' });
        }

        // Xử lý cập nhật DB như cũ
        const { orderCode, code } = data;
        let status = code === '00' ? 'paid' : 'failed';
        status = status.trim();
        console.log('Update status:', `"${status}"`);
        const pool = await sql.connect(dbConfig);

        const currentStatusRes = await pool.request()
            .input('orderCode', sql.NVarChar, orderCode.toString())
            .query('SELECT payment_status FROM PAYMENT WHERE order_code = @orderCode');

            const alreadyPaid = currentStatusRes.recordset[0]?.payment_status === 'paid';
        // Lấy subscription_id từ PAYMENT
        const subResult = await pool.request()
            .input('orderCode', sql.NVarChar, orderCode.toString())
            .query('SELECT subscription_id FROM PAYMENT WHERE order_code = @orderCode');

        if (!subResult.recordset.length) {
            console.error('Không tìm thấy subscription_id cho order_code:', orderCode);
            return res.status(200).json({ success: false, message: 'Không tìm thấy subscription_id' });
        }

        

        const subscriptionId = subResult.recordset[0].subscription_id;
    if (!alreadyPaid) {
    // Update PAYMENT
    await pool.request()
        .input('status', sql.NVarChar, status)
        .input('orderCode', sql.NVarChar, orderCode.toString())
        .query('UPDATE PAYMENT SET payment_status = @status WHERE order_code = @orderCode');

    // Update USER_SUBSCRIPTION
    await pool.request()
        .input('status', sql.NVarChar, status)
        .input('subscriptionId', sql.Int, subscriptionId)
        .query('UPDATE USER_SUBSCRIPTION SET payment_status = @status WHERE subscription_id = @subscriptionId');
    }
        // 👉 Gửi thông báo cho người dùng
        if (status === 'paid') {
        const userResult = await pool.request()
            .input('subscriptionId', sql.Int, subscriptionId)
            .query('SELECT user_id FROM USER_SUBSCRIPTION WHERE subscription_id = @subscriptionId');

        const userId = userResult.recordset[0].user_id;

        const content = '💳 Cảm ơn bạn đã thanh toán! Gói dịch vụ đã được kích hoạt. Chúc bạn sớm cai thuốc thành công!';
        // 🔍 Kiểm tra xem đã gửi thông báo này chưa
        const checkNoti = await pool.request()
            .input('user_id', sql.Int, userId)
            .input('content', sql.NVarChar, content)
            .query('SELECT 1 FROM NOTIFICATION WHERE user_id = @user_id AND content = @content');

        if (checkNoti.recordset.length === 0) {
            await pool.request()
        .input('user_id', sql.Int, userId)
        .input('title', sql.NVarChar, 'Thanh toán thành công')
        .input('content', sql.NVarChar, content)
        .input('notification_type', sql.VarChar, 'payment')
        .input('created_at', sql.DateTime, new Date())
        .input('is_read', sql.Bit, 0)
        .query(`
            INSERT INTO NOTIFICATION (user_id, title, content, notification_type, created_at, is_read)
            VALUES (@user_id, @title, @content, @notification_type, @created_at, @is_read)
        `);
        }
        }


    res.status(200).json({ success: true, message: 'Xử lý webhook thành công' });
    } catch (err) {
        console.error('❌ Lỗi webhook:', err);
        // Vẫn trả về 200 OK để PayOS không báo lỗi webhook
        res.status(200).json({ success: false, message: 'Lỗi xử lý callback' });
    }
};

// ✅ Tạo đơn thanh toán với PayOS
exports.createRedirectPayment = async (req, res) => {
    const { packageId, amount, description } = req.body;
    const userId = req.user.id;

    try {
        const amountInt = parseInt(amount);
        if (isNaN(amountInt) || amountInt <= 0) {
            return res.status(400).json({ message: 'Số tiền không hợp lệ' });
        }

        const pool = await sql.connect(dbConfig);
        const start = dayjs();
        const end = start.add(30, 'day');
        const orderCode = Number(String(Date.now()).slice(-6)); // 6 số cuối để dễ nhìn

        // 👉 Tạo bản ghi USER_SUBSCRIPTION
        const subRes = await pool.request()
            .input('user_id', sql.Int, userId)
            .input('package_id', sql.Int, packageId)
            .input('start_date', sql.Date, start.toDate())
            .input('end_date', sql.Date, end.toDate())
            .input('auto_renew', sql.Bit, 0)
            .input('payment_status', sql.NVarChar, 'pending')
            .query(`
        INSERT INTO USER_SUBSCRIPTION (user_id, package_id, start_date, end_date, auto_renew, payment_status)
        OUTPUT INSERTED.subscription_id
        VALUES (@user_id, @package_id, @start_date, @end_date, @auto_renew, @payment_status)
      `);

        const subscriptionId = subRes.recordset[0].subscription_id;

        // 👉 Gửi yêu cầu tới PayOS để lấy link thanh toán
        const shortDescription = (description || "Gói Premium").slice(0, 25);

        const paymentBody = {
            orderCode,
            amount: amountInt,
            description: shortDescription,
            items: [{
                name: "Gói dịch vụ Premium",
                quantity: 1,
                price: amountInt
            }],
            returnUrl: `${process.env.CLIENT_URL}/payment-success`,
            cancelUrl: `${process.env.CLIENT_URL}/checkout`,
            expiredAt: Math.floor(Date.now() / 1000) + 900 // 15 phút
        };

        const paymentResponse = await payOS.createPaymentLink(paymentBody);
        const checkoutUrl = paymentResponse.checkoutUrl;

        if (!checkoutUrl) {
            throw new Error('Không tạo được checkoutUrl từ PayOS');
        }

        // 👉 Lưu đơn vào bảng PAYMENT
        await pool.request()
            .input('subscription_id', sql.Int, subscriptionId)
            .input('amount', sql.Float, amountInt)
            .input('payment_date', sql.DateTime, new Date())
            .input('order_code', sql.NVarChar, orderCode.toString())
            .input('transaction_id', sql.NVarChar, orderCode.toString())
            .input('payment_method', sql.NVarChar, 'redirect')
            .input('payment_status', sql.NVarChar, 'pending')
            .input('note', sql.NVarChar, description || '')
            .query(`
        INSERT INTO PAYMENT (
          subscription_id, amount, payment_date,
          order_code, transaction_id, payment_method, payment_status, note
        )
        VALUES (
          @subscription_id, @amount, @payment_date,
          @order_code, @transaction_id, @payment_method, @payment_status, @note
        )
      `);

        res.json({
            success: true,
            checkoutUrl,
            orderCode
        });

    } catch (err) {
        console.error('❌ Lỗi tạo đơn thanh toán:', err);
        res.status(500).json({
            success: false,
            message: 'Lỗi tạo đơn thanh toán',
            error: err.message
        });
    }
};
