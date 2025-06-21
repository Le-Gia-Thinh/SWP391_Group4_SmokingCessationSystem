// controllers/userController.js
const { sql, dbConfig } = require("../config/database");

async function getMe(req, res) {
  const pool = await sql.connect(dbConfig);
  try {
    const userId = req.user.id;

    const result = await pool.request()
      .input('user_id', sql.Int, userId)
      .query(`
        SELECT c.user_id AS id, c.full_name AS name, c.email, c.phone_number,
               c.ftnd_level, c.avatar_url, c.user_role, c.account_status,
               s.total_points, s.current_level, s.last_updated
        FROM CUSTOMER c 
        LEFT JOIN USER_SCORE s ON c.user_id = s.user_id
        WHERE c.user_id = @user_id
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const userData = result.recordset[0];
    return res.status(200).json(userData);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
}

module.exports = { getMe };