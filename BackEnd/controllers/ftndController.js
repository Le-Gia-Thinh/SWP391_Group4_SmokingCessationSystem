// controllers/ftndController.js
const { sql, dbConfig } = require("../config/database");

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
  const { user_id, level } = req.body;

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

      // tao id
      const achResult = await pool
      .request()
      .input("title", sql.NVarChar, "Hoàn thành FTND")
      .query("SELECT achievement_id FROM ACHIEVEMENT WHERE title = @title");

    const achievement_id = achResult.recordset[0]?.achievement_id;

    if (achievement_id) {
      //  Kiểm tra nếu user đã có thành tựu chưa
      const existCheck = await pool
        .request()
        .input("user_id", sql.Int, user_id)
        .input("achievement_id", sql.Int, achievement_id)
        .query(`
          SELECT 1 FROM USER_ACHIEVEMENT
          WHERE user_id = @user_id AND achievement_id = @achievement_id
        `);

      if (existCheck.recordset.length === 0) {
        // Nếu chưa có thì thêm mới vào USER_ACHIEVEMENT
        await pool
          .request()
          .input("user_id", sql.Int, user_id)
          .input("achievement_id", sql.Int, achievement_id)
          .input("earned_date", sql.Date, new Date())
          .query(`
            INSERT INTO USER_ACHIEVEMENT (user_id, achievement_id, earned_date)
            VALUES (@user_id, @achievement_id, @earned_date)
          `);
      }
    }


    res.json({ success: true, message: "Đã cập nhật ftnd_level" });
  } catch (err) {
    console.error("Lỗi cập nhật FTND:", err);
    res.status(500).json({ message: "Lỗi server" });
  }
};

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


