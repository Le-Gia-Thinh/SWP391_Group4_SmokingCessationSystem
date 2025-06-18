const { sql, dbConfig } = require("../config/database");

// POST: Ghi nhận số điếu thuốc cho 1 ngày
const submitSingleSmokingSummary = async (req, res) => {
  const userId = req.user.id;
  const { date, total_cigarettes } = req.body;

  if (!date || total_cigarettes === undefined) {
    return res.status(400).json({
      success: false,
      message: "Thiếu ngày hoặc số điếu thuốc",
    });
  }

  try {
    const pool = await sql.connect(dbConfig);
    await pool.request()
      .input("user_id", sql.Int, userId)
      .input("date", sql.Date, date)
      .input("total_cigarettes", sql.Int, total_cigarettes)
      .query(`
        MERGE DAILY_SMOKING_SUMMARY AS target
        USING (SELECT @user_id AS user_id, @date AS date) AS source
        ON target.user_id = source.user_id AND target.date = source.date
        WHEN MATCHED THEN 
          UPDATE SET total_cigarettes = @total_cigarettes
        WHEN NOT MATCHED THEN
          INSERT (user_id, date, total_cigarettes)
          VALUES (@user_id, @date, @total_cigarettes);
      `);

    res.json({ success: true, message: "Đã ghi nhận số điếu thuốc" });
  } catch (err) {
    console.error("❌ Lỗi ghi nhận số điếu:", err);
    res.status(500).json({
      success: false,
      message: "Lỗi máy chủ khi ghi nhận",
    });
  }
};

//Giữ số điếu thuốc của người dùng khi load lại web
const getAllSmokingSummary = async (req, res) => {
  const userId = req.params.user_id;

  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool.request()
      .input("user_id", sql.Int, userId)
      .query(`
        SELECT date, total_cigarettes
        FROM DAILY_SMOKING_SUMMARY
        WHERE user_id = @user_id
        ORDER BY date
      `);

    res.json(result.recordset);
  } catch (err) {
    console.error("❌ Lỗi khi lấy số điếu:", err);
    res.status(500).json({ message: "Lỗi máy chủ" });
  }
};


module.exports = {
  submitSingleSmokingSummary,
  getAllSmokingSummary,
};