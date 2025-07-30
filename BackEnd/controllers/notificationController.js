const { sql, dbConfig } = require("../config/database");

exports.getUserNotifications = async (req, res) => {
  try {
    const pool = await sql.connect(dbConfig);
    const userId = req.user.id;

    const result = await pool.request()
      .input("user_id", sql.Int, userId)
      .query(`
        SELECT TOP 20 *
        FROM NOTIFICATION
        WHERE user_id = @user_id
        ORDER BY created_at DESC
      `);

    res.json(result.recordset);
  } catch (err) {
    console.error("❌ Lỗi lấy thông báo:", err);
    res.status(500).json({ message: "Lỗi máy chủ" });
  }
};
