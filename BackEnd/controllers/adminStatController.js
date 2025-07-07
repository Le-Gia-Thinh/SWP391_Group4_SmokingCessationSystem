const { sql, dbConfig } = require('../config/database');

const getUsersSummary = async (req, res) => {
  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool.request().query(`
      SELECT COUNT(*) AS total_users
      FROM CUSTOMER
      WHERE user_role = 'member'
    `);
    res.json({ total_users: result.recordset[0].total_users });
  } catch (err) {
    console.error('getUsersSummary error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getMonthlyRevenue = async (req, res) => {
  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool.request().query(`
      SELECT FORMAT(P.payment_date, 'yyyy-MM') AS month, SUM(P.amount) AS total
      FROM PAYMENT P
      JOIN USER_SUBSCRIPTION US ON P.subscription_id = US.subscription_id
      JOIN CUSTOMER C ON US.user_id = C.user_id
      WHERE P.payment_status = 'paid' AND C.user_role = 'member'
      GROUP BY FORMAT(P.payment_date, 'yyyy-MM')
      ORDER BY month ASC
    `);
    const labels = result.recordset.map(r => r.month);
    const data = result.recordset.map(r => r.total);
    res.json({ labels, data });
  } catch (err) {
    console.error('getMonthlyRevenue error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getActiveCoachCount = async (req, res) => {
  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool.request().query(`
      SELECT COUNT(*) AS active_coach
      FROM CUSTOMER
      WHERE user_role = 'coach' AND account_status = 'active'
    `);
    res.json({ count: result.recordset[0].active_coach });
  } catch (err) {
    console.error('getActiveCoachCount error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getAverageMonthsByAddictionLevel = async (req, res) => {
  try {
    console.log('📊 [API CALLED] getAverageMonthsByAddictionLevel');

    const pool = await sql.connect(dbConfig);
    const result = await pool.request().query(`
      SELECT 
        fr.[level] AS addiction_level,
        AVG(cp.month_quit * 1.0) AS avg_months
      FROM CESSATION_PLAN cp
      JOIN (
        SELECT user_id, [level]
        FROM (
          SELECT *, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY submitted_at DESC) AS rn
          FROM FTND_RESULT
        ) sub
        WHERE rn = 1
      ) fr ON cp.user_id = fr.user_id
      JOIN CUSTOMER c ON cp.user_id = c.user_id
      WHERE c.user_role = 'member'
      GROUP BY fr.[level]
    `);

    console.log('✅ Query result:', result.recordset);

    const labels = result.recordset.map(r => r.addiction_level.toLowerCase());
    const data = result.recordset.map(r => parseFloat(r.avg_months.toFixed(2)));

    res.json({ labels, data });
  } catch (err) {
    console.error('🔥 Error in getAverageMonthsByAddictionLevel:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getUsersSummary,
  getMonthlyRevenue,
  getActiveCoachCount,
  getAverageMonthsByAddictionLevel
};
