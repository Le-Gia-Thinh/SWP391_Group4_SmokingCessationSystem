// controllers/userController.js
const { sql, dbConfig } = require("../config/database");
const bcrypt = require("bcrypt");

async function getMe(req, res) {
  const pool = await sql.connect(dbConfig);
  try {
    const userId = req.user.id;

    const result = await pool.request()
      .input('user_id', sql.Int, userId)
      .query(`
        SELECT c.user_id AS id, c.full_name AS name, c.email, c.phone_number,
               c.ftnd_level, c.avatar_url, c.user_role, c.account_status,
               c.registration_date,
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


const updateProfile = async (req, res) => {
  const userId = req.user.id;
  const { avatar_url, phone_number, date_of_birth, ftnd_level } = req.body;

  try {
    const pool = await sql.connect(dbConfig);
    const request = pool.request().input("user_id", sql.Int, userId);

    let updateFields = [];

    if (avatar_url && avatar_url.trim() !== "") {
      request.input("avatar_url", sql.VarChar(255), avatar_url.trim());
      updateFields.push("avatar_url = @avatar_url");
    }
    if (phone_number !== undefined) {
      request.input("phone_number", sql.VarChar(20), phone_number);
      updateFields.push("phone_number = @phone_number");
    }
    if (date_of_birth !== undefined) {
      request.input("date_of_birth", sql.Date, date_of_birth);
      updateFields.push("date_of_birth = @date_of_birth");
    }
    if (ftnd_level !== undefined) {
      request.input("ftnd_level", sql.NVarChar(20), ftnd_level);
      updateFields.push("ftnd_level = @ftnd_level");
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ success: false, message: "Không có dữ liệu để cập nhật." });
    }

    const updateQuery = `
      UPDATE CUSTOMER
      SET ${updateFields.join(", ")}
      WHERE user_id = @user_id
    `;

    await request.query(updateQuery);

    res.json({ success: true, message: "Cập nhật thành công" });
  } catch (err) {
    console.error("Lỗi cập nhật hồ sơ:", err);
    res.status(500).json({ success: false, message: "Lỗi khi cập nhật hồ sơ" });
  }
};

module.exports = {getMe,updateProfile };