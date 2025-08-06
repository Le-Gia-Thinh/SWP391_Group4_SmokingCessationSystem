// controllers/ftndController.js
const { sql, dbConfig } = require("../config/database");
const {
  evaluateAndUnlockAchievements,
} = require("../utils/achievementService");

const pool = new sql.ConnectionPool(dbConfig);
const poolConnect = pool.connect();

// Kiểm tra xem user đã có ftnd_level chưa
exports.checkFTNDExists = async (req, res) => {
  try {
    await poolConnect;
    const result = await pool
      .request()
      .input("user_id", sql.Int, req.params.userId)
      .query("SELECT ftnd_level FROM CUSTOMER WHERE user_id = @user_id");

    const level = result.recordset[0]?.ftnd_level;
    res.json({ exists: level !== null });
  } catch (err) {
    console.error("Lỗi khi kiểm tra FTND:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Ghi nhận kết quả FTND (cập nhật ftnd_level cho user)
exports.submitFTNDResult = async (req, res) => {
  const { user_id, level, frequency, pricePerCigarette } = req.body;

  if (!user_id || !level) {
    return res.status(400).json({ message: "Thiếu user_id hoặc level" });
  }

  try {
    await poolConnect;
    await pool
      .request()
      .input("user_id", sql.Int, user_id)
      .input("level", sql.NVarChar, level)
      .query(
        "UPDATE CUSTOMER SET ftnd_level = @level WHERE user_id = @user_id"
      );

    await pool
      .request()
      .input("user_id", sql.Int, user_id)
      .input("level", sql.NVarChar, level)
      .input("submitted_at", sql.DateTime, new Date())
      .input("frequency", sql.Int, frequency)
      .input("pricePerCigarette", sql.Int, pricePerCigarette).query(`
      INSERT INTO FTND_RESULT (user_id, level, submitted_at, frequency, pricePerCigarette)
      VALUES (@user_id, @level, @submitted_at, @frequency, @pricePerCigarette)
    `);

    await evaluateAndUnlockAchievements(user_id);

    res.json({ success: true, message: "Đã cập nhật ftnd_level" });
  } catch (err) {
    res.status(500).json({ message: "Lỗi server" });
  }
};

// Lấy cấp độ FTND của user
exports.getFtndLevel = async (req, res) => {
  try {
    await poolConnect;
    const result = await pool
      .request()
      .input("user_id", sql.Int, req.params.userId)
      .query("SELECT ftnd_level FROM CUSTOMER WHERE user_id = @user_id");

    const level = result.recordset[0]?.ftnd_level;
    res.json({ ftnd_level: level || null });
  } catch (err) {
    console.error("Lỗi getFtndLevel:", err);
    res.status(500).json({ msg: "Lỗi server" });
  }
};

// cap nhat gia tien moi dieu
exports.updatePricePerCigarette = async (req, res) => {
  const { user_id, pricePerCigarette } = req.body;
  if (!user_id || !pricePerCigarette) {
    return res.status(400).json({ message: "Thiếu user_id hoặc pricePerCigarette" });
  }

  try {
    await poolConnect;
    // Update bản ghi mới nhất
    const result = await pool.request()
      .input("user_id", sql.Int, user_id)
      .input("pricePerCigarette", sql.Int, pricePerCigarette)
      .query(`
        UPDATE FTND_RESULT
        SET pricePerCigarette = @pricePerCigarette
        WHERE user_id = @user_id AND submitted_at = (
          SELECT MAX(submitted_at) FROM FTND_RESULT WHERE user_id = @user_id
        )
      `);

    res.json({ success: true, message: "Đã cập nhật giá tiền mỗi điếu" });
  } catch (err) {
    console.error("Lỗi updatePricePerCigarette:", err);
    res.status(500).json({ message: "Lỗi server" });
  }
};
