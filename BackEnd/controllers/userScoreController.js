// controllers/userScoreController.js
const { sql, dbConfig } = require("../config/database");

const getRanking = async (req, res) => {
  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool.request().query(`
      SELECT TOP 10 s.user_id, c.full_name, s.total_points, s.current_level
      FROM USER_SCORE s
      JOIN CUSTOMER c ON s.user_id = c.user_id
      ORDER BY s.total_points DESC
    `);
    res.json({ success: true, data: result.recordset });
  } catch (err) {
    console.error("❌ Lỗi lấy bảng xếp hạng:", err);
    res.status(500).json({ success: false });
  }
};

module.exports = {
  getRanking,
};
