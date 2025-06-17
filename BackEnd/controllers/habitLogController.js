// controllers/habitLogController.js
const { sql, dbConfig } = require("../config/database");

// GET habit log theo ngày
const getHabitLogByDate = async (req, res) => {
  const userId = req.user.id;
  const { date } = req.query;

  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool.request()
      .input("user_id", sql.Int, userId)
      .input("log_date", sql.Date, date)
      .query(`
        SELECT time_slot, completed 
        FROM HABIT_LOG 
        WHERE user_id = @user_id AND log_date = @log_date
        ORDER BY time_slot
      `);

    const completedArray = Array(9).fill(false);
    result.recordset.forEach(row => {
      completedArray[row.time_slot] = row.completed;
    });

    res.json({
      success: true,
      data: completedArray,
    });
  } catch (err) {
    console.error("❌ Lỗi khi truy vấn habit log:", err);
    res.status(500).json({
      success: false,
      error: "Lỗi máy chủ khi truy vấn habit log",
    });
  }
};

// POST 1 hành vi (tick hoặc bỏ tick)
const submitSingleLog = async (req, res) => {
  const userId = req.user.id;
  const { date, timeSlot, completed, points } = req.body;

  if (!date || timeSlot === undefined) {
    return res.status(400).json({ success: false, message: "Thiếu dữ liệu" });
  }

  try {
    const pool = await sql.connect(dbConfig);
    await pool.request()
      .input("user_id", sql.Int, userId)
      .input("log_date", sql.Date, date)
      .input("time_slot", sql.Int, timeSlot)
      .input("completed", sql.Bit, completed)
      .input("points_awarded", sql.Int, points || (completed ? 1 : 0))
      .query(`
        MERGE HABIT_LOG AS target
        USING (SELECT @user_id AS user_id, @log_date AS log_date, @time_slot AS time_slot) AS source
        ON (target.user_id = source.user_id AND target.log_date = source.log_date AND target.time_slot = source.time_slot)
        WHEN MATCHED THEN
          UPDATE SET completed = @completed, points_awarded = @points_awarded
        WHEN NOT MATCHED THEN
          INSERT (user_id, log_date, time_slot, completed, points_awarded)
          VALUES (@user_id, @log_date, @time_slot, @completed, @points_awarded);
      `);

    res.json({ success: true, message: "Đã lưu hành vi" });
  } catch (err) {
    console.error("❌ Lỗi ghi hành vi đơn:", err);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

// DELETE hành vi (nếu thật sự muốn xoá khỏi DB)
const deleteHabitLogEntry = async (req, res) => {
  const userId = req.user.id;
  const { date, timeSlot } = req.body;

  if (!date || typeof timeSlot !== "number") {
    return res.status(400).json({
      success: false,
      message: "Thiếu ngày hoặc timeSlot không hợp lệ",
    });
  }

  try {
    const pool = await sql.connect(dbConfig);
    await pool.request()
      .input("user_id", sql.Int, userId)
      .input("log_date", sql.Date, date)
      .input("time_slot", sql.Int, timeSlot)
      .query(`
        DELETE FROM HABIT_LOG 
        WHERE user_id = @user_id AND log_date = @log_date AND time_slot = @time_slot
      `);

    res.json({ success: true, message: "Đã xóa hành vi khỏi log" });
  } catch (err) {
    console.error("❌ Lỗi khi xóa habit log:", err);
    res.status(500).json({ success: false, message: "Lỗi server khi xóa" });
  }
};

module.exports = {
  getHabitLogByDate,
  submitSingleLog,
  deleteHabitLogEntry,
};
