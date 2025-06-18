// controllers/userScoreController.js
const { sql, dbConfig } = require("../config/database");

const getRanking = async (req, res) => {
  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool.request().query(`
      SELECT TOP 10
        s.user_id,
        c.full_name,
        c.avatar_url,
        s.total_points,
        s.current_level,
        CASE
          WHEN s.current_level = 'Beginner' THEN CAST(s.total_points * 100.0 / 100 AS INT)
          WHEN s.current_level = 'Intermediate' THEN CAST((s.total_points - 100) * 100.0 / 300 AS INT)
          WHEN s.current_level = 'Advanced' THEN CAST((s.total_points - 400) * 100.0 / 600 AS INT)
          WHEN s.current_level = 'Master' THEN 100
          ELSE 0
        END AS progress_to_next
      FROM USER_SCORE s
      JOIN CUSTOMER c ON s.user_id = c.user_id
      ORDER BY s.total_points DESC
    `);

    const dataWithRank = result.recordset.map((u, i) => ({
      ...u,
      rank: i + 1,
    }));

    res.json({ success: true, data: dataWithRank });
  } catch (err) {
    console.error("❌ Lỗi lấy bảng xếp hạng:", err);
    res.status(500).json({ success: false });
  }
};

const updateUserScore = async (req, res) => {
  const userId = req.user?.id || req.body.user_id || req.query.user_id;
  if (!userId) {
    return res.status(400).json({ success: false, message: "Thiếu user_id" });
  }
  try {
    const pool = await sql.connect(dbConfig);

    // Đếm số hành vi hoàn thành
    const result = await pool.request()
      .input("user_id", sql.Int, userId)
      .query(`
        SELECT COUNT(*) AS completedCount
        FROM HABIT_LOG
        WHERE user_id = @user_id AND completed = 1
      `);

    const completedCount = result.recordset[0].completedCount;

    // Lấy thông tin plan để tính điểm mỗi slot
    const planRes = await pool.request()
      .input("user_id", sql.Int, userId)
      .query(`
        SELECT TOP 1 month_quit
        FROM CESSATION_PLAN
        WHERE user_id = @user_id AND is_active = 1
      `);

    const months = planRes.recordset[0]?.month_quit || 1;
    const totalSlots = months * 30 * 9;
    const pointPerSlot = +(100 / totalSlots).toFixed(3);

    const totalPoints = +(completedCount * pointPerSlot).toFixed(3);

    // Xác định cấp độ mới
    let newLevel = "Beginner";
    if (totalPoints >= 1000) newLevel = "Master";
    else if (totalPoints >= 400) newLevel = "Advanced";
    else if (totalPoints >= 100) newLevel = "Intermediate";

    // Cập nhật USER_SCORE
    await pool.request()
      .input("user_id", sql.Int, userId)
      .input("total_points", sql.Float, totalPoints)
      .input("current_level", sql.VarChar, newLevel)
      .query(`
        UPDATE USER_SCORE
        SET total_points = @total_points, current_level = @current_level, last_updated = GETDATE()
        WHERE user_id = @user_id
      `);

    res.json({ success: true, totalPoints, newLevel });
  } catch (err) {
    console.error("❌ Lỗi cập nhật điểm tổng hợp:", err);
    res.status(500).json({ success: false });
  }
};

module.exports = {
  getRanking,
  updateUserScore,
};