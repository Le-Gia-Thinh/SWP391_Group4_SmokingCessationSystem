/**
 * controllers/subscriptionController.js
 *
 * Quản lý gói đăng ký (subscription):
 *  – Lấy danh sách packages
 *  – Lấy subscription hiện tại
 *  – Lấy lịch sử subscriptions
 *  – Tính tổng số ngày còn lại (gộp nhiều gói)
 */
const { sql, dbConfig } = require('../config/database');

/* ---------- 1. Danh sách tất cả gói ---------- */
exports.getAllPackages = async (req, res) => {
  try {
    const pool   = await sql.connect(dbConfig);
    const result = await pool.request().query(`
      SELECT package_id, package_name, description, price,
             duration_days, coach_access, community_access,
             premium_content, created_at
      FROM   SUBSCRIPTION_PACKAGE
      ORDER  BY price ASC
    `);
    res.json(result.recordset);
  } catch (err) {
    console.error('❌ getAllPackages:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

/* ---------- 2. Subscription hiện tại (đang hiệu lực) ---------- */
exports.getCurrentSubscription = async (req, res) => {
  try {
    const userId = req.user.id;                 // <── sửa ở đây
    const pool   = await sql.connect(dbConfig);

    const { recordset } = await pool.request()
      .input('userId', sql.Int, userId)
      .query(`
        SELECT TOP 1
               us.subscription_id, us.start_date, us.end_date,
               us.auto_renew, us.payment_status,
               sp.package_name, sp.description, sp.price,
               sp.duration_days, sp.coach_access,
               sp.community_access, sp.premium_content
        FROM   USER_SUBSCRIPTION us
        JOIN   SUBSCRIPTION_PACKAGE sp
               ON sp.package_id = us.package_id
        WHERE  us.user_id = @userId
          AND  us.payment_status IN ('paid', 'success')
          AND  us.end_date >= GETUTCDATE()
        ORDER  BY us.end_date DESC
      `);

    res.json({ success: true, subscription: recordset[0] || null });
  } catch (err) {
    console.error('❌ getCurrentSubscription:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

/* ---------- 3. Lịch sử các subscription ---------- */
exports.getHistory = async (req, res) => {
  try {
    const userId = req.user.id;                 // <── sửa ở đây
    const pool   = await sql.connect(dbConfig);

    const { recordset } = await pool.request()
      .input('userId', sql.Int, userId)
      .query(`
        SELECT us.subscription_id, us.start_date, us.end_date,
               us.auto_renew, us.payment_status,
               sp.package_name, sp.description, sp.price,
               sp.duration_days,
               p.payment_date, p.amount AS paid_amount, p.order_code
        FROM   USER_SUBSCRIPTION us
        JOIN   SUBSCRIPTION_PACKAGE sp
               ON sp.package_id = us.package_id
        LEFT JOIN PAYMENT p
               ON p.subscription_id = us.subscription_id
        WHERE  us.user_id = @userId
        ORDER  BY us.created_at DESC
      `);

    res.json({ success: true, history: recordset });
  } catch (err) {
    console.error('❌ getHistory:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

/* ---------- 4. Tổng số ngày còn lại ---------- */
exports.getRemainingDays = async (req, res) => {
  const userId = req.user.id;                   // <── sửa ở đây

  try {
    const pool = await sql.connect(dbConfig);
    const { recordset } = await pool.request()
      .input('userId', sql.Int, userId)
      .query(`
        SELECT start_date, end_date
        FROM   USER_SUBSCRIPTION
        WHERE  user_id = @userId
          AND  payment_status IN ('paid', 'success')
          AND  end_date > GETUTCDATE()
        ORDER  BY start_date
      `);

    if (!recordset.length) return res.json({ remainingDays: 0 });

    const today      = new Date();
    let   curEnd     = today;
    let   totalDays  = 0;

    recordset.forEach(({ start_date, end_date }) => {
      const start = new Date(start_date > today ? start_date : today);
      const end   = new Date(end_date);

      if (end <= curEnd) return;                         // trùng
      if (start <= curEnd) {
        totalDays += Math.ceil((end - curEnd) / 86_400_000);
      } else {
        totalDays += Math.ceil((end - start) / 86_400_000);
      }
      curEnd = end;
    });

    res.json({ remainingDays: totalDays });
  } catch (err) {
    console.error('❌ getRemainingDays:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
