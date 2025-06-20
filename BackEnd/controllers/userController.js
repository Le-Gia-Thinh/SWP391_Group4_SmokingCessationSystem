// controllers/userController.js
const { sql, dbConfig } = require("../config/database");

exports.getMe = async (req, res) => {
  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool.request()
      .input("user_id", sql.Int, req.user.id)
      .query(`
        SELECT 
          c.user_id AS id,
          c.username AS name,
          c.email,
          c.phone_number,
          c.user_role AS role,
          c.ftnd_level,
          c.registration_date,
          s.total_points,
          s.current_level
        FROM CUSTOMER c
        LEFT JOIN USER_SCORE s ON c.user_id = s.user_id
        WHERE c.user_id = @user_id
      `);

    res.json(result.recordset[0]);
  } catch (err) {
    console.error("Lỗi khi lấy thông tin user:", err);
    res.status(500).json({ message: "Lỗi server" });
  }
};
