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
  const userId = req.user.id;

  try {
    const pool = await sql.connect(dbConfig);

    const result = await pool.request()
      .input("user_id", sql.Int, userId)
      .query(`
        SELECT 
          a.achievement_id,
          a.title,
          a.description,
          a.phase,
          a.achievement_type,
          a.difficulty_level,
          a.check_code,
          ISNULL(ua.earned_date, NULL) AS earned_date,
          ISNULL(ua.is_shared, 0) AS is_shared,
          CASE 
            WHEN ua.user_id IS NOT NULL THEN 1 ELSE 0
          END AS unlocked
        FROM ACHIEVEMENT a
        LEFT JOIN USER_ACHIEVEMENT ua 
          ON a.achievement_id = ua.achievement_id AND ua.user_id = @user_id
        ORDER BY a.achievement_id
      `);

    const achievements = result.recordset.map(row => ({
      ...row,
      unlocked: row.unlocked === 1
    }));

    res.json(achievements);
  } catch (err) {
    console.error("❌ Lỗi getUnlockedAchievements:", err);
    res.status(500).json({ message: 'Lỗi lấy danh sách thành tựu' });
  }
};