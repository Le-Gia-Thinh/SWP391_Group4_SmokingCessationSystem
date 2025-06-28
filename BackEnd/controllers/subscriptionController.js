// controllers/subscriptionController.js
const { sql, dbConfig } = require('../config/database');

// Get all subscription packages
exports.getPackages = async (req, res) => {
  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool.request()
      .query(
        `SELECT package_id, package_name, description, price, duration_days, coach_access, community_access, premium_content, created_at
         FROM SUBSCRIPTION_PACKAGE
         ORDER BY price ASC`
      );
    res.json(result.recordset);
  } catch (err) {
    console.error('Get packages error:', err);
    res.status(500).json({ error: 'Không lấy được danh sách gói dịch vụ' });
  }
};

// Create new subscription (internal)
exports.createSubscription = async (req, res) => {
  const userId = req.user?.id;
  const { packageId } = req.body;
  if (!userId) return res.status(401).json({ error: 'Chưa đăng nhập' });
  if (!packageId) return res.status(400).json({ error: 'Thiếu packageId' });

  try {
    const pool = await sql.connect(dbConfig);
    const check = await pool.request().input('package_id', sql.Int, packageId)
      .query('SELECT duration_days FROM SUBSCRIPTION_PACKAGE WHERE package_id = @package_id');
    if (!check.recordset.length) return res.status(404).json({ error: 'Gói không tồn tại' });

    const now = new Date();
    const endDate = new Date(now);
    endDate.setDate(endDate.getDate() + check.recordset[0].duration_days);

    const result = await pool.request()
      .input('user_id', sql.Int, userId)
      .input('package_id', sql.Int, packageId)
      .input('start_date', sql.DateTime, now)
      .input('end_date', sql.DateTime, endDate)
      .input('auto_renew', sql.Bit, false)
      .input('payment_status', sql.VarChar, 'pending')
      .query(
        `INSERT INTO USER_SUBSCRIPTION (user_id, package_id, start_date, end_date, auto_renew, payment_status)
         OUTPUT INSERTED.subscription_id
         VALUES (@user_id,@package_id,@start_date,@end_date,@auto_renew,@payment_status)`
      );
    res.json({ subscriptionId: result.recordset[0].subscription_id, startDate: now, endDate });
  } catch (err) {
    console.error('Create subscription error:', err);
    res.status(500).json({ error: 'Không tạo được subscription' });
  }
};

// Get user's active subscription
exports.getUserSubscription = async (req, res) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ error: 'Chưa đăng nhập' });

  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool.request().input('user_id', sql.Int, userId)
      .query(
        `SELECT us.subscription_id, us.start_date, us.end_date, us.auto_renew, us.payment_status,
                sp.package_name, sp.description, sp.price, sp.duration_days, sp.coach_access, sp.community_access, sp.premium_content
         FROM USER_SUBSCRIPTION us
         JOIN SUBSCRIPTION_PACKAGE sp ON us.package_id=sp.package_id
         WHERE us.user_id=@user_id AND us.payment_status='active' AND us.end_date>GETDATE()
         ORDER BY us.start_date DESC`
      );
    res.json({ subscription: result.recordset[0] || null });
  } catch (err) {
    console.error('Get user subscription error:', err);
    res.status(500).json({ error: 'Không lấy được thông tin subscription' });
  }
};

// Get subscription history
exports.getSubscriptionHistory = async (req, res) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ error: 'Chưa đăng nhập' });

  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool.request().input('user_id', sql.Int, userId)
      .query(
        `SELECT us.subscription_id, us.start_date, us.end_date, us.payment_status,
                sp.package_name, sp.price, p.payment_id, p.amount, p.payment_date, p.payment_status AS payment_transaction_status
         FROM USER_SUBSCRIPTION us
         JOIN SUBSCRIPTION_PACKAGE sp ON us.package_id=sp.package_id
         LEFT JOIN PAYMENT p ON us.subscription_id=p.subscription_id
         WHERE us.user_id=@user_id
         ORDER BY us.start_date DESC`
      );
    res.json(result.recordset);
  } catch (err) {
    console.error('Get subscription history error:', err);
    res.status(500).json({ error: 'Không lấy được lịch sử subscription' });
  }
};
