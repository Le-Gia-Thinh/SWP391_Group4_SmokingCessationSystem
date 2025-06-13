// controllers/quitPlanController.js
const { sql, dbConfig } = require("../config/database");

const pool = new sql.ConnectionPool(dbConfig);
const poolConnect = pool.connect();

exports.checkPlanExists = async (req, res) => {
  try {
    await poolConnect;
    const result = await pool
      .request()
      .input("userId", sql.Int, req.params.userId)
      .query(`
        SELECT TOP 1 start_date, plan_type
        FROM CESSATION_PLAN
        WHERE user_id = @userId AND is_active = 1
      `);

    if (result.recordset.length > 0) {
      res.json({
        hasPlan: true,
        start_date: result.recordset[0].start_date,
        quit_months: 7, // có thể thay thế bằng giá trị động sau này
      });
    } else {
      res.json({ hasPlan: false });
    }
  } catch (err) {
    console.error("Error checking plan:", err);
    res.status(500).json({ error: "Server error" });
  }
};

exports.savePlan = async (req, res) => {
  const { user_id, start_date, quit_months } = req.body;

  // Kiểm tra dữ liệu đầu vào
  if (!user_id || !start_date || !quit_months) {
    return res.status(400).json({ error: "Thiếu user_id, start_date hoặc quit_months" });
  }

  try {
    await poolConnect;

    // 👉 Tính toán ngày kết thúc kế hoạch (end_date)
    const start = new Date(start_date);
    const endDate = new Date(start);
    endDate.setMonth(start.getMonth() + parseInt(quit_months));

    // Kiểm tra lại kết quả
    if (isNaN(endDate.getTime())) {
      return res.status(400).json({ error: "end_date tính ra không hợp lệ" });
    }

    // 1. Vô hiệu hóa kế hoạch cũ nếu có
    await pool.request()
      .input("user_id", sql.Int, user_id)
      .query(`
        UPDATE CESSATION_PLAN
        SET is_active = 0
        WHERE user_id = @user_id AND is_active = 1
      `);

    // 2. Thêm kế hoạch mới với đầy đủ thông tin
  await pool.request()
  .input("user_id", sql.Int, user_id)
  .input("start_date", sql.Date, start)
  .input("end_date", sql.Date, endDate) // ĐÃ có dòng này
  .input("plan_name", sql.NVarChar, `Kế hoạch ${user_id}`)
  .input("month_quit", sql.Int, quit_months)
  .query(`
    INSERT INTO CESSATION_PLAN (
      user_id, start_date, end_date, plan_type, is_active, created_at, plan_name, month_quit
    )
    VALUES (
      @user_id, @start_date, @end_date, 'standard', 1, GETDATE(), @plan_name, @month_quit
    )
  `);

    res.json({ success: true, message: "Plan saved successfully" });
  } catch (err) {
    console.error("❌ Error saving plan:", err);
    res.status(500).json({ error: "Save failed. Please check server logs." });
  }
};



exports.resetPlan = async (req, res) => {
  const { user_id } = req.body;

  try {
    await poolConnect;
    await pool
      .request()
      .input("user_id", sql.Int, user_id)
      .query("DELETE FROM CESSATION_PLAN WHERE user_id = @user_id");

    res.json({ success: true, message: "Reset thành công" });
  } catch (err) {
    console.error("Error resetting plan:", err);
    res.status(500).json({ error: "Lỗi server khi reset kế hoạch" });
  }
};
