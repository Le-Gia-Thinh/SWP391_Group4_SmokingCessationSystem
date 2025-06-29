// controllers/achievementController.js
const { sql, dbConfig } = require("../config/database");

exports.checkDailyNoSmoking = async (req, res) => {
  const userId = req.user.id;
  const today = new Date().toISOString().split("T")[0];

  try {
    const pool = await sql.connect(dbConfig);

    // Kiểm tra các ngày trước đã không hút
    const result = await pool.request()
      .input("user_id", sql.Int, userId)
      .input("today", sql.Date, today)
      .query(`
        SELECT log_date FROM DAILY_SMOKING_SUMMARY
        WHERE user_id = @user_id AND cigarette_count = 0 AND log_date < @today
      `);

    if (result.recordset.length === 0) {
      return res.json({ success: false, message: "Chưa có ngày nào không hút thuốc." });
    }

    // Kiểm tra đã có thành tựu chưa
    const check = await pool.request()
      .input("user_id", sql.Int, userId)
      .input("achievement_id", sql.Int, 1) // ID thành tựu "1 ngày không hút"
      .query(`
        SELECT * FROM USER_ACHIEVEMENT
        WHERE user_id = @user_id AND achievement_id = @achievement_id
      `);

    if (check.recordset.length > 0) {
      return res.json({ success: true, message: "Đã nhận thành tựu." });
    }

    // Ghi nhận thành tựu
    await pool.request()
      .input("user_id", sql.Int, userId)
      .input("achievement_id", sql.Int, 1)
      .input("earned_date", sql.DateTime, new Date())
      .query(`
        INSERT INTO USER_ACHIEVEMENT (user_id, achievement_id, earned_date, is_shared)
        VALUES (@user_id, @achievement_id, @earned_date, 0)
      `);

    res.json({ success: true, message: "🎉 Bạn đã đạt thành tựu 1 ngày không hút!" });

  } catch (err) {
    console.error("🚨 Error checking achievement:", err);
    res.status(500).json({ success: false, message: "Lỗi máy chủ." });
  }
};
