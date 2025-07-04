const { sql, dbConfig } = require("../config/database");
const { evaluateAndUnlockAchievements } = require("../utils/achievementService");

// Lấy tất cả các thành tựu
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

// Lấy thành tựu member đã đạt
exports.getUnlockedAchievements = async (req, res) => {
  try {
    const userId = req.user.id;
    const pool = await sql.connect(dbConfig);

    // Tự động kiểm tra và mở khóa trước khi trả
    await evaluateAndUnlockAchievements(userId);

    const result = await pool.request()
      .input("user_id", sql.Int, userId)
      .query(`
        SELECT a.achievement_id, a.title, a.description, a.badge_image, a.achievement_type, a.phase, ua.earned_date
        FROM USER_ACHIEVEMENT ua
        JOIN ACHIEVEMENT a ON a.achievement_id = ua.achievement_id
        WHERE ua.user_id = @user_id
        ORDER BY a.phase, a.difficulty_level
      `);
    res.json(result.recordset);
  } catch (err) {
    console.error("Lỗi lấy thành tựu đã mở khóa:", err);
    res.status(500).json({ message: "Lỗi máy chủ" });
  }
};