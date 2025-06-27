const { sql, dbConfig } = require("../config/database");
// Hàm tính cấp độ dựa vào điểm
function getUserLevel(points) {
  if (points < 100) return "Beginner";
  if (points < 400) return "Intermediate";
  if (points < 1000) return "Advanced";
  return "Master";
}


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
  const completedCount = completedArray.filter(Boolean).length;


  res.json({
    success: true,
    data: completedArray,
    completedCount, // số tích
    totalSlots: 9
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
  const { date, timeSlot, completed } = req.body;
  const completedBool = completed === true || completed === 1 || completed === "1" || completed === "true";


  if (!date || timeSlot === undefined) {
    return res.status(400).json({ success: false, message: "Thiếu dữ liệu" });
  }


  try {
    const pool = await sql.connect(dbConfig);


    // Lấy thông tin kế hoạch để tính điểm
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


    // Ghi lại hành vi hiện tại
    await pool.request()
      .input("user_id", sql.Int, userId)
      .input("log_date", sql.Date, date)
      .input("time_slot", sql.Int, timeSlot)
      .input("completed", sql.Bit, completedBool)
      .input("points_awarded", sql.Float, completedBool ? pointPerSlot : 0)
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


    // Lấy toàn bộ completed trong ngày
    const logOfDay = await pool.request()
      .input("user_id", sql.Int, userId)
      .input("log_date", sql.Date, date)
      .query(`
        SELECT completed FROM HABIT_LOG
        WHERE user_id = @user_id AND log_date = @log_date
      `);


    const completedCount = logOfDay.recordset.filter(r => r.completed).length;


    // Tính multiplier theo completedCount
    let multiplier = 1.0;
    if (completedCount >= 9) multiplier = 1.5;
    else if (completedCount >= 7) multiplier = 1.3;
    else if (completedCount >= 5) multiplier = 1.2;
    else if (completedCount >= 3) multiplier = 1.1;


    const totalPointToday = +(completedCount * pointPerSlot * multiplier).toFixed(3);
    // Reset toàn bộ điểm ngày đó
await pool.request()
  .input("user_id", sql.Int, userId)
  .input("log_date", sql.Date, date)
  .query(`
    UPDATE HABIT_LOG
    SET points_awarded = 0
    WHERE user_id = @user_id AND log_date = @log_date
  `);


// Gán lại điểm đúng theo multiplier
await pool.request()
  .input("user_id", sql.Int, userId)
  .input("log_date", sql.Date, date)
  .input("point", sql.Float, +(totalPointToday / completedCount).toFixed(3))
  .query(`
    UPDATE HABIT_LOG
    SET points_awarded = @point
    WHERE user_id = @user_id AND log_date = @log_date AND completed = 1
  `);




    // Lấy điểm hiện tại
    const scoreRes = await pool.request()
      .input("user_id", sql.Int, userId)
      .query(`SELECT total_points FROM USER_SCORE WHERE user_id = @user_id`);


    const currentPoints = scoreRes.recordset[0]?.total_points || 0;


    // ⚠️ Để tránh cộng dồn sai → điểm hôm đó được cập nhật lại, không cộng thêm
    // Tính lại toàn bộ tổng điểm từ tất cả HABIT_LOG (đã có points_awarded đúng)
const allLog = await pool.request()
  .input("user_id", sql.Int, userId)
  .query(`
    SELECT SUM(points_awarded) AS total FROM HABIT_LOG
    WHERE user_id = @user_id AND completed = 1
  `);


const newTotal = +(allLog.recordset[0]?.total || 0).toFixed(3);


    const newLevel = getUserLevel(newTotal);


    await pool.request()
      .input("user_id", sql.Int, userId)
      .input("total_points", sql.Float, newTotal)
      .input("current_level", sql.VarChar, newLevel)
      .query(`
        MERGE USER_SCORE AS target
        USING (SELECT @user_id AS user_id) AS source
        ON target.user_id = source.user_id
        WHEN MATCHED THEN
          UPDATE SET total_points = @total_points, current_level = @current_level, last_updated = GETDATE()
        WHEN NOT MATCHED THEN
          INSERT (user_id, total_points, current_level, last_updated)
          VALUES (@user_id, @total_points, @current_level, GETDATE());
      `);


    console.log(`✅ Ngày ${date} đạt ${completedCount}/9 slot → +${totalPointToday} điểm (x${multiplier})`);
    res.json({ success: true, message: "Đã lưu hành vi" });
  } catch (err) {
    console.error("❌ Lỗi ghi hành vi đơn:", err);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};






// DELETE hành vi
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



