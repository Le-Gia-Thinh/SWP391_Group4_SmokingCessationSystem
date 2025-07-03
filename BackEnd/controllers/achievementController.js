const { sql, dbConfig } = require("../config/database");

exports.getAllAchievements = async (req, res) => {
  try {
    const userId = req.user?.id; // Giả sử đã có middleware auth lấy từ token

    const pool = await sql.connect(dbConfig);

    // Lấy toàn bộ thành tựu
    const achievementsResult = await pool.request().query(`
      SELECT achievement_id, title, description, badge_image, achievement_type, difficulty_level, phase
      FROM ACHIEVEMENT
      ORDER BY phase, difficulty_level
    `);
    const allAchievements = achievementsResult.recordset;

    // Nếu có userId, lấy các thành tựu đã đạt
    let unlocked = [];
    if (userId) {
      const unlockedResult = await pool.request()
        .input("user_id", sql.Int, userId)
        .query(`
          SELECT achievement_id
          FROM USER_ACHIEVEMENT
          WHERE user_id = @user_id
        `);
      unlocked = unlockedResult.recordset.map((r) => r.achievement_id);
    }

    // Gắn cờ 'unlocked' vào mỗi thành tựu
    const data = allAchievements.map((ach) => ({
      ...ach,
      unlocked: unlocked.includes(ach.achievement_id),
    }));

    res.json(data);
  } catch (err) {
    console.error("Error fetching achievements:", err);
    res.status(500).json({ message: "Lỗi khi lấy dữ liệu thành tựu." });
  }
};

