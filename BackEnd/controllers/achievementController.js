const { sql, dbConfig } = require("../config/database");

exports.getAllAchievements = async (req, res) => {
  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool.request().query(`
      SELECT achievement_id, title, description, badge_image, achievement_type, difficulty_level, phase
      FROM ACHIEVEMENT
      ORDER BY phase, difficulty_level
    `);
    res.json(result.recordset);
  } catch (err) {
    console.error("Error fetching achievements:", err);
    res.status(500).json({ message: "Lỗi khi lấy dữ liệu thành tựu." });
  }
};
