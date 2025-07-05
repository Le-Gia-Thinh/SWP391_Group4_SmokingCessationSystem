// controllers/paymentCallback.js
const { sql, dbConfig } = require('../config/database');
const crypto = require('crypto');

// Hàm xác thực signature từ PayOS
function verifyPayOSSignature(body, signature, checksumKey) {
  const sortedKeys = Object.keys(body).sort();
  const signatureData = sortedKeys.map(key => `${key}=${body[key]}`).join('&');
  const expectedSignature = crypto
    .createHmac('sha256', checksumKey)
    .update(signatureData)
    .digest('hex');
  
  return signature === expectedSignature;
}

async function handlePaymentCallback(req, res) {
  console.log('🔄 PayOS Callback received:', req.body);
  
  // Xử lý trường hợp webhook test
  if (!req.body || Object.keys(req.body).length === 0) {
    return res.status(200).json({ success: true, message: 'Webhook test OK' });
  }

  const { 
    orderCode, 
    amount, 
    description, 
    accountNumber, 
    reference, 
    transactionDateTime, 
    currency, 
    paymentLinkId, 
    code, 
    desc, 
    counterAccountBankId, 
    counterAccountBankName, 
    counterAccountName, 
    counterAccountNumber, 
    virtualAccountName, 
    virtualAccountNumber,
    signature 
  } = req.body;

  // Xác thực signature (tùy chọn, nếu PayOS có gửi)
  if (signature && process.env.PAYOS_CHECKSUM_KEY) {
    const isValid = verifyPayOSSignature(req.body, signature, process.env.PAYOS_CHECKSUM_KEY);
    if (!isValid) {
      console.error('❌ Invalid PayOS signature');
      return res.status(400).json({ error: 'Invalid signature' });
    }
  }

  // Kiểm tra dữ liệu cần thiết
  if (!orderCode) {
    console.error('❌ Missing orderCode in callback');
    return res.status(400).json({ error: 'Missing orderCode' });
  }

  // Xác định trạng thái thanh toán
  // code = "00" thường là thành công trong hệ thống Việt Nam
  const isSuccess = code === '00' || code === 'PAID' || desc === 'success';
  const status = isSuccess ? 'success' : 'failed';

  let pool, transaction;
  try {
    pool = await sql.connect(dbConfig);
    transaction = new sql.Transaction(pool);
    await transaction.begin();

    // Tìm payment record theo orderCode (transaction_id)
    const paymentQuery = await transaction.request()
      .input('transaction_id', sql.VarChar, orderCode.toString())
      .query(`
        SELECT p.payment_id, p.subscription_id, p.payment_status as current_status
        FROM PAYMENT p
        WHERE p.transaction_id = @transaction_id
      `);

    if (!paymentQuery.recordset.length) {
      console.error('❌ Payment not found for orderCode:', orderCode);
      await transaction.rollback();
      return res.status(404).json({ error: 'Payment not found' });
    }

    const { payment_id, subscription_id, current_status } = paymentQuery.recordset[0];

    // Tránh xử lý lại nếu đã success
    if (current_status === 'success') {
      console.log('✅ Payment already processed:', payment_id);
      await transaction.commit();
      return res.json({ 
        message: 'Payment already processed', 
        paymentId: payment_id,
        status: 'success' 
      });
    }

    // Cập nhật bảng PAYMENT
    await transaction.request()
      .input('payment_id', sql.Int, payment_id)
      .input('status', sql.VarChar, status)
      .input('amount', sql.Decimal(18, 2), amount || 0)
      .input('reference', sql.VarChar, reference || '')
      .input('transaction_datetime', sql.DateTime, transactionDateTime ? new Date(transactionDateTime) : new Date())
      .query(`
        UPDATE PAYMENT
        SET payment_status = @status,
            amount = CASE WHEN @amount > 0 THEN @amount ELSE amount END,
            payment_date = @transaction_datetime,
            note = CASE WHEN @reference != '' THEN @reference ELSE note END
        WHERE payment_id = @payment_id
      `);

    if (status === 'success') {
      // Kích hoạt subscription
      await transaction.request()
        .input('subscription_id', sql.Int, subscription_id)
        .query(`
          UPDATE us
          SET
            payment_status = 'active',
            start_date = CASE WHEN us.payment_status = 'pending' THEN GETDATE() ELSE us.start_date END,
            end_date = CASE
              WHEN us.payment_status = 'pending'
                THEN DATEADD(day, sp.duration_days, GETDATE())
              ELSE DATEADD(day, sp.duration_days, us.end_date)
            END
          FROM USER_SUBSCRIPTION us
          JOIN SUBSCRIPTION_PACKAGE sp ON sp.package_id = us.package_id
          WHERE us.subscription_id = @subscription_id
        `);

      console.log('✅ Payment successful:', payment_id);
    } else {
      // Cập nhật trạng thái thất bại
      await transaction.request()
        .input('subscription_id', sql.Int, subscription_id)
        .query(`
          UPDATE USER_SUBSCRIPTION
          SET payment_status = 'failed'
          WHERE subscription_id = @subscription_id
        `);

      console.log('❌ Payment failed:', payment_id);
    }

    await transaction.commit();
    
    return res.json({ 
      message: 'Callback processed successfully', 
      status, 
      paymentId: payment_id,
      orderCode 
    });

  } catch (err) {
    if (transaction) await transaction.rollback();
    console.error('💥 Callback processing error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  } finally {
    if (pool) await pool.close();
  }
}

async function checkPaymentStatus(req, res) {
  const { paymentId } = req.params;
  const userId = req.user?.id;
  
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  let pool;
  try {
    pool = await sql.connect(dbConfig);
    const result = await pool.request()
      .input('payment_id', sql.Int, paymentId)
      .input('user_id', sql.Int, userId)
      .query(`
        SELECT
          p.payment_id,
          p.payment_status,
          p.transaction_id,
          p.amount,
          p.payment_date,
          us.payment_status AS subscription_status,
          sp.package_name
        FROM PAYMENT p
        JOIN USER_SUBSCRIPTION us ON p.subscription_id = us.subscription_id
        JOIN SUBSCRIPTION_PACKAGE sp ON us.package_id = sp.package_id
        WHERE p.payment_id = @payment_id
          AND us.user_id = @user_id
      `);

    if (!result.recordset.length) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    return res.json(result.recordset[0]);
  } catch (err) {
    console.error('Status check error:', err);
    return res.status(500).json({ error: 'Failed to check payment status' });
  } finally {
    if (pool) await pool.close();
  }
}

module.exports = { handlePaymentCallback, checkPaymentStatus };