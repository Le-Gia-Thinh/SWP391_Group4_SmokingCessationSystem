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
    const result = await pool
      .request()
      .input("user_id", sql.Int, userId)
      .input("log_date", sql.Date, date).query(`
          SELECT time_slot, completed
          FROM HABIT_LOG
          WHERE user_id = @user_id AND log_date = @log_date
          ORDER BY time_slot
        `);

    const completedArray = Array(9).fill(false);
    result.recordset.forEach((row) => {
      completedArray[row.time_slot] = row.completed;
    });
    const completedCount = completedArray.filter(Boolean).length;

    // Lấy số nhiệm vụ đã làm trong USER_BEHAVIOR_TASK_LOG
    const taskResult = await pool
      .request()
      .input("user_id", sql.Int, userId)
      .input("log_date", sql.Date, date).query(`
    SELECT COUNT(*) AS completedTasks
    FROM USER_BEHAVIOR_TASK_LOG
    WHERE user_id = @user_id AND log_date = @log_date AND is_completed = 1
  `);

    const completedTasks = taskResult.recordset[0]?.completedTasks || 0;

    res.json({
      success: true,
      data: completedArray,
      completedCount, // số tích
      completedTasks, // số tick "đã làm nhiệm vụ"
      totalSlots: 9,
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
  const completedBool =
    completed === true ||
    completed === 1 ||
    completed === "1" ||
    completed === "true";

  if (!date || timeSlot === undefined) {
    return res.status(400).json({ success: false, message: "Thiếu dữ liệu" });
  }

  try {
    const pool = await sql.connect(dbConfig);

    // Lấy thông tin kế hoạch để tính điểm
    const planRes = await pool.request().input("user_id", sql.Int, userId)
      .query(`
        SELECT TOP 1 month_quit
        FROM CESSATION_PLAN
        WHERE user_id = @user_id AND is_active = 1
      `);
    const months = planRes.recordset[0]?.month_quit || 1;
    const totalSlots = months * 30 * 9;
    const pointPerSlot = +(100 / totalSlots).toFixed(3);

    // Ghi lại hành vi hiện tại
    await pool
      .request()
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
    const logOfDay = await pool
      .request()
      .input("user_id", sql.Int, userId)
      .input("log_date", sql.Date, date).query(`
        SELECT completed FROM HABIT_LOG
        WHERE user_id = @user_id AND log_date = @log_date
      `);

    const completedCount = logOfDay.recordset.filter((r) => r.completed).length;

    // Tính multiplier theo completedCount
    let multiplier = 1.0;
    if (completedCount >= 9) multiplier = 1.5;
    else if (completedCount >= 7) multiplier = 1.3;
    else if (completedCount >= 5) multiplier = 1.2;
    else if (completedCount >= 3) multiplier = 1.1;

    const totalPointToday = +(
      completedCount *
      pointPerSlot *
      multiplier
    ).toFixed(3);
    // Reset toàn bộ điểm ngày đó
    await pool
      .request()
      .input("user_id", sql.Int, userId)
      .input("log_date", sql.Date, date).query(`
    UPDATE HABIT_LOG
    SET points_awarded = 0
    WHERE user_id = @user_id AND log_date = @log_date
  `);

    // Gán lại điểm đúng theo multiplier
    await pool
      .request()
      .input("user_id", sql.Int, userId)
      .input("log_date", sql.Date, date)
      .input("point", sql.Float, +(totalPointToday / completedCount).toFixed(3))
      .query(`
    UPDATE HABIT_LOG
    SET points_awarded = @point
    WHERE user_id = @user_id AND log_date = @log_date AND completed = 1
  `);

    // Lấy điểm hiện tại
    const scoreRes = await pool
      .request()
      .input("user_id", sql.Int, userId)
      .query(`SELECT total_points FROM USER_SCORE WHERE user_id = @user_id`);

    const currentPoints = scoreRes.recordset[0]?.total_points || 0;

    // ✅ Tính tổng điểm từ cả 2 bảng
    const [habitRes, behaviorRes] = await Promise.all([
      pool
        .request()
        .input("user_id", sql.Int, userId)
        .query(
          `SELECT SUM(points_awarded) AS total FROM HABIT_LOG WHERE user_id = @user_id AND completed = 1`
        ),
      pool
        .request()
        .input("user_id", sql.Int, userId)
        .query(
          `SELECT SUM(points_awarded) AS total FROM USER_BEHAVIOR_TASK_LOG WHERE user_id = @user_id AND is_completed = 1`
        ),
    ]);

    const habitPoints = +(habitRes.recordset[0]?.total || 0);
    const behaviorPoints = +(behaviorRes.recordset[0]?.total || 0);
    const newTotal = +(habitPoints + behaviorPoints).toFixed(3);

    const newLevel = getUserLevel(newTotal);

    await pool
      .request()
      .input("user_id", sql.Int, userId)
      .input("total_points", sql.Float, newTotal)
      .input("current_level", sql.VarChar, newLevel).query(`
        MERGE USER_SCORE AS target
        USING (SELECT @user_id AS user_id) AS source
        ON target.user_id = source.user_id
        WHEN MATCHED THEN
          UPDATE SET total_points = @total_points, current_level = @current_level, last_updated = GETDATE()
        WHEN NOT MATCHED THEN
          INSERT (user_id, total_points, current_level, last_updated)
          VALUES (@user_id, @total_points, @current_level, GETDATE());
      `);

    res.json({ success: true, message: "Đã lưu hành vi" });
  } catch (err) {
    console.error("❌ Lỗi ghi hành vi đơn:", err);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

// DELETE cot da ko hut thuoc
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

    // Cập nhật completed = 0, điểm = 0
    await pool
      .request()
      .input("user_id", sql.Int, userId)
      .input("log_date", sql.Date, date)
      .input("time_slot", sql.Int, timeSlot).query(`
        UPDATE HABIT_LOG
        SET completed = 0, points_awarded = 0
        WHERE user_id = @user_id AND log_date = @log_date AND time_slot = @time_slot
      `);

    // Tính lại điểm tổng từ HABIT_LOG + USER_BEHAVIOR_TASK_LOG
    const [habitRes, behaviorRes] = await Promise.all([
      pool
        .request()
        .input("user_id", sql.Int, userId)
        .query(
          `SELECT SUM(points_awarded) AS total FROM HABIT_LOG WHERE user_id = @user_id AND completed = 1`
        ),
      pool
        .request()
        .input("user_id", sql.Int, userId)
        .query(
          `SELECT SUM(points_awarded) AS total FROM USER_BEHAVIOR_TASK_LOG WHERE user_id = @user_id AND is_completed = 1`
        ),
    ]);

    const habitPoints = +(habitRes.recordset[0]?.total || 0);
    const behaviorPoints = +(behaviorRes.recordset[0]?.total || 0);
    const newTotal = +(habitPoints + behaviorPoints).toFixed(3);
    const newLevel = getUserLevel(newTotal);

    await pool
      .request()
      .input("user_id", sql.Int, userId)
      .input("total_points", sql.Float, newTotal)
      .input("current_level", sql.VarChar, newLevel).query(`
        MERGE USER_SCORE AS target
        USING (SELECT @user_id AS user_id) AS source
        ON target.user_id = source.user_id
        WHEN MATCHED THEN
          UPDATE SET total_points = @total_points, current_level = @current_level, last_updated = GETDATE()
        WHEN NOT MATCHED THEN
          INSERT (user_id, total_points, current_level, last_updated)
          VALUES (@user_id, @total_points, @current_level, GETDATE());
      `);

    res.json({ success: true, message: "Đã bỏ tích hành vi và cập nhật điểm" });
  } catch (err) {
    console.error("❌ Lỗi khi bỏ tích habit log:", err);
    res.status(500).json({ success: false, message: "Lỗi server khi bỏ tích" });
  }
};

// delete cot da lam nhiem vu
const deleteBehaviorTaskLogEntry = async (req, res) => {
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

    // 1. Gỡ ô đã làm
    await pool
      .request()
      .input("user_id", sql.Int, userId)
      .input("log_date", sql.Date, date)
      .input("time_slot", sql.Int, timeSlot).query(`
        UPDATE USER_BEHAVIOR_TASK_LOG
        SET is_completed = 0, points_awarded = 0
        WHERE user_id = @user_id AND log_date = @log_date AND time_slot = @time_slot
      `);

    // 2. Đếm lại số nhiệm vụ còn lại trong ngày
    const taskRes = await pool
      .request()
      .input("user_id", sql.Int, userId)
      .input("log_date", sql.Date, date).query(`
        SELECT * FROM USER_BEHAVIOR_TASK_LOG
        WHERE user_id = @user_id AND log_date = @log_date AND is_completed = 1
      `);
    const completedCount = taskRes.recordset.length;

    // 3. Lấy plan để biết month_quit
    const planRes = await pool.request().input("user_id", sql.Int, userId)
      .query(`
        SELECT TOP 1 month_quit
        FROM CESSATION_PLAN
        WHERE user_id = @user_id AND is_active = 1
      `);
    const months = planRes.recordset[0]?.month_quit || 1;
    const totalSlots = months * 30 * 9;
    const pointPerSlot = +(100 / totalSlots).toFixed(3);

    // 4. Tính multiplier
    let multiplier = 1.0;
    if (completedCount >= 9) multiplier = 1.5;
    else if (completedCount >= 7) multiplier = 1.3;
    else if (completedCount >= 5) multiplier = 1.2;
    else if (completedCount >= 3) multiplier = 1.1;

    const totalPointToday = +(
      completedCount *
      pointPerSlot *
      multiplier
    ).toFixed(3);
    const pointEach = +(totalPointToday / completedCount || 0).toFixed(3); // tránh chia 0

    // 5. Reset toàn bộ điểm
    await pool
      .request()
      .input("user_id", sql.Int, userId)
      .input("log_date", sql.Date, date).query(`
        UPDATE USER_BEHAVIOR_TASK_LOG
        SET points_awarded = 0
        WHERE user_id = @user_id AND log_date = @log_date
      `);

    // 6. Gán lại điểm mới
    if (completedCount > 0) {
      await pool
        .request()
        .input("user_id", sql.Int, userId)
        .input("log_date", sql.Date, date)
        .input("point", sql.Float, pointEach).query(`
          UPDATE USER_BEHAVIOR_TASK_LOG
          SET points_awarded = @point
          WHERE user_id = @user_id AND log_date = @log_date AND is_completed = 1
        `);
    }

    // 7. Tính lại tổng điểm (HABIT_LOG + BEHAVIOR_TASK_LOG)
    const [habitRes, behaviorRes] = await Promise.all([
      pool
        .request()
        .input("user_id", sql.Int, userId)
        .query(
          `SELECT SUM(points_awarded) AS total FROM HABIT_LOG WHERE user_id = @user_id AND completed = 1`
        ),
      pool
        .request()
        .input("user_id", sql.Int, userId)
        .query(
          `SELECT SUM(points_awarded) AS total FROM USER_BEHAVIOR_TASK_LOG WHERE user_id = @user_id AND is_completed = 1`
        ),
    ]);

    const habitPoints = +(habitRes.recordset[0]?.total || 0);
    const behaviorPoints = +(behaviorRes.recordset[0]?.total || 0);
    const newTotal = +(habitPoints + behaviorPoints).toFixed(3);
    const newLevel = getUserLevel(newTotal);

    // 8. Cập nhật USER_SCORE
    await pool
      .request()
      .input("user_id", sql.Int, userId)
      .input("total_points", sql.Float, newTotal)
      .input("current_level", sql.VarChar, newLevel).query(`
        MERGE USER_SCORE AS target
        USING (SELECT @user_id AS user_id) AS source
        ON target.user_id = source.user_id
        WHEN MATCHED THEN
          UPDATE SET total_points = @total_points, current_level = @current_level, last_updated = GETDATE()
        WHEN NOT MATCHED THEN
          INSERT (user_id, total_points, current_level, last_updated)
          VALUES (@user_id, @total_points, @current_level, GETDATE());
      `);

    res.json({
      success: true,
      message: "Đã bỏ tích nhiệm vụ và cập nhật điểm",
    });
  } catch (err) {
    console.error("❌ Lỗi khi bỏ tích task:", err);
    res
      .status(500)
      .json({ success: false, message: "Lỗi server khi bỏ tích nhiệm vụ" });
  }
};

// de tam
const chooseBehaviorTask = async (req, res) => {
  const userId = req.user.id;
  const { date, timeSlot, taskId } = req.body;
  console.log("Chọn nhiệm vụ:", { date, timeSlot, taskId });

  if (!date || typeof timeSlot !== "number" || !taskId) {
    return res
      .status(400)
      .json({ success: false, message: "Thiếu dữ liệu chọn task" });
  }

  try {
    const pool = await sql.connect(dbConfig);

    // Nếu đã có dòng, chỉ update task_id và giữ nguyên is_completed
    // Nếu chưa có dòng, insert task_id và is_completed = 0
    await pool
      .request()
      .input("user_id", sql.Int, userId)
      .input("log_date", sql.Date, date)
      .input("time_slot", sql.Int, timeSlot)
      .input("task_id", sql.NVarChar, taskId).query(`
        MERGE USER_BEHAVIOR_TASK_LOG AS target
        USING (SELECT @user_id AS user_id, @log_date AS log_date, @time_slot AS time_slot) AS source
        ON (target.user_id = source.user_id AND target.log_date = source.log_date AND target.time_slot = source.time_slot)
        WHEN MATCHED THEN
          UPDATE SET task_id = @task_id -- KHÔNG update is_completed ở đây
        WHEN NOT MATCHED THEN
          INSERT (user_id, log_date, time_slot, task_id, is_completed)
          VALUES (@user_id, @log_date, @time_slot, @task_id, 0);
      `);

    res.json({ success: true, message: "Đã lưu lựa chọn nhiệm vụ" });
  } catch (err) {
    console.error("❌ Lỗi ghi task hành vi:", err);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

const getSelectedTasksByDate = async (req, res) => {
  const userId = req.user.id;
  const { date } = req.query;

  if (!date) {
    return res.status(400).json({ success: false, message: "Thiếu ngày" });
  }

  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool
      .request()
      .input("user_id", sql.Int, userId)
      .input("log_date", sql.Date, date).query(`
        SELECT time_slot, task_id
        FROM USER_BEHAVIOR_TASK_LOG
        WHERE user_id = @user_id AND log_date = @log_date
        ORDER BY time_slot
      `);

    res.json({ success: true, data: result.recordset });
  } catch (err) {
    console.error("❌ Lỗi get selected-tasks:", err);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

// ✅ GET các task đã làm (is_completed = 1)
const getCompletedTasksByDate = async (req, res) => {
  const userId = req.user.id;
  const { date } = req.query;

  if (!date) {
    return res.status(400).json({ success: false, message: "Thiếu ngày" });
  }

  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool
      .request()
      .input("user_id", sql.Int, userId)
      .input("log_date", sql.Date, date).query(`
        SELECT time_slot, is_completed
        FROM USER_BEHAVIOR_TASK_LOG
        WHERE user_id = @user_id AND log_date = @log_date AND is_completed = 1
        ORDER BY time_slot
      `);

    res.json({ success: true, data: result.recordset });
  } catch (err) {
    console.error("❌ Lỗi get completed-tasks:", err);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

const submitBehaviorTaskPoint = async (req, res) => {
  const userId = req.user.id;
  const { date } = req.body;

  if (!date) {
    return res.status(400).json({ success: false, message: "Thiếu ngày" });
  }

  try {
    const pool = await sql.connect(dbConfig);

    // Lấy thông tin kế hoạch để tính điểm
    const planRes = await pool.request().input("user_id", sql.Int, userId)
      .query(`
        SELECT TOP 1 month_quit
        FROM CESSATION_PLAN
        WHERE user_id = @user_id AND is_active = 1
      `);
    const months = planRes.recordset[0]?.month_quit || 1;
    const totalSlots = months * 30 * 9;
    const pointPerSlot = +(100 / totalSlots).toFixed(3);

    // Lấy số nhiệm vụ hoàn thành trong ngày
    const taskRes = await pool
      .request()
      .input("user_id", sql.Int, userId)
      .input("log_date", sql.Date, date).query(`
        SELECT * FROM USER_BEHAVIOR_TASK_LOG
        WHERE user_id = @user_id AND log_date = @log_date AND is_completed = 1
      `);
    const completedCount = taskRes.recordset.length;

    // Tính multiplier
    let multiplier = 1.0;
    if (completedCount >= 9) multiplier = 1.5;
    else if (completedCount >= 7) multiplier = 1.3;
    else if (completedCount >= 5) multiplier = 1.2;
    else if (completedCount >= 3) multiplier = 1.1;

    const totalPointToday = +(
      completedCount *
      pointPerSlot *
      multiplier
    ).toFixed(3);

    // Reset điểm trước đó
    await pool
      .request()
      .input("user_id", sql.Int, userId)
      .input("log_date", sql.Date, date).query(`
        UPDATE USER_BEHAVIOR_TASK_LOG
        SET points_awarded = 0
        WHERE user_id = @user_id AND log_date = @log_date
      `);

    // Cập nhật lại điểm cho từng task hoàn thành
    const pointEach = +(totalPointToday / completedCount).toFixed(3);
    await pool
      .request()
      .input("user_id", sql.Int, userId)
      .input("log_date", sql.Date, date)
      .input("point", sql.Float, pointEach).query(`
        UPDATE USER_BEHAVIOR_TASK_LOG
        SET points_awarded = @point
        WHERE user_id = @user_id AND log_date = @log_date AND is_completed = 1
      `);

    // Tính lại tổng điểm
    const [habitRes, behaviorRes] = await Promise.all([
      pool
        .request()
        .input("user_id", sql.Int, userId)
        .query(
          `SELECT SUM(points_awarded) AS total FROM HABIT_LOG WHERE user_id = @user_id AND completed = 1`
        ),
      pool
        .request()
        .input("user_id", sql.Int, userId)
        .query(
          `SELECT SUM(points_awarded) AS total FROM USER_BEHAVIOR_TASK_LOG WHERE user_id = @user_id AND is_completed = 1`
        ),
    ]);

    const habitPoints = +(habitRes.recordset[0]?.total || 0);
    const behaviorPoints = +(behaviorRes.recordset[0]?.total || 0);
    const newTotal = +(habitPoints + behaviorPoints).toFixed(3);
    const newLevel = getUserLevel(newTotal);

    await pool
      .request()
      .input("user_id", sql.Int, userId)
      .input("total_points", sql.Float, newTotal)
      .input("current_level", sql.VarChar, newLevel).query(`
        MERGE USER_SCORE AS target
        USING (SELECT @user_id AS user_id) AS source
        ON target.user_id = source.user_id
        WHEN MATCHED THEN
          UPDATE SET total_points = @total_points, current_level = @current_level, last_updated = GETDATE()
        WHEN NOT MATCHED THEN
          INSERT (user_id, total_points, current_level, last_updated)
          VALUES (@user_id, @total_points, @current_level, GETDATE());
      `);

    res.json({
      success: true,
      message: "Đã cập nhật điểm cho nhiệm vụ hành vi",
    });
  } catch (err) {
    console.error("❌ Lỗi tính điểm task hành vi:", err);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

// Tick hoặc bỏ tick nhiệm vụ hành vi (USER_BEHAVIOR_TASK_LOG)
const submitBehaviorTaskCompletion = async (req, res) => {
  const userId = req.user.id;
  const { date, timeSlot, completed } = req.body;
  const completedBool =
    completed === true ||
    completed === 1 ||
    completed === "1" ||
    completed === "true";

  if (!date || typeof timeSlot !== "number") {
    return res.status(400).json({ success: false, message: "Thiếu dữ liệu" });
  }

  try {
    const pool = await sql.connect(dbConfig);

    // Nếu đã có dòng thì update is_completed, nếu chưa có thì insert với is_completed và task_id = null
    await pool
      .request()
      .input("user_id", sql.Int, userId)
      .input("log_date", sql.Date, date)
      .input("time_slot", sql.Int, timeSlot)
      .input("is_completed", sql.Bit, completedBool).query(`
        MERGE USER_BEHAVIOR_TASK_LOG AS target
        USING (SELECT @user_id AS user_id, @log_date AS log_date, @time_slot AS time_slot) AS source
        ON (target.user_id = source.user_id AND target.log_date = source.log_date AND target.time_slot = source.time_slot)
        WHEN MATCHED THEN
          UPDATE SET is_completed = @is_completed
        WHEN NOT MATCHED THEN
          INSERT (user_id, log_date, time_slot, is_completed, task_id)
          VALUES (@user_id, @log_date, @time_slot, @is_completed, NULL);
      `);

    res.json({
      success: true,
      message: "Đã cập nhật trạng thái hoàn thành nhiệm vụ",
    });
  } catch (err) {
    console.error("❌ Lỗi tick nhiệm vụ hành vi:", err);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

module.exports = {
  getHabitLogByDate,
  submitSingleLog,
  deleteHabitLogEntry,
  chooseBehaviorTask,
  getSelectedTasksByDate,
  getCompletedTasksByDate,
  submitBehaviorTaskPoint,
  deleteBehaviorTaskLogEntry,
  submitBehaviorTaskCompletion,
};
