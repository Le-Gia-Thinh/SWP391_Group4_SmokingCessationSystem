const express = require("express");
const router = express.Router();
const { sql, dbConfig } = require("../config/database");

// Tự khởi tạo pool và poolConnect ở đây
const pool = new sql.ConnectionPool(dbConfig);
const poolConnect = pool.connect();

router.get("/exists/:userId", async (req, res) => {
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
        quit_months: 7
      });
    } else {
      res.json({ hasPlan: false });
    }
  } catch (err) {
    console.error("Error checking plan:", err);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/save", async (req, res) => {
  const { user_id, start_date, quit_months } = req.body;
  if (!user_id || !start_date) {
    return res.status(400).json({ error: "Thiếu user_id hoặc start_date" });
  }
  try {
    await poolConnect;
    await pool
      .request()
      .input("user_id", sql.Int, user_id)
      .query(`
        UPDATE CESSATION_PLAN
        SET is_active = 0
        WHERE user_id = @user_id AND is_active = 1
      `);

    await pool
      .request()
      .input("user_id", sql.Int, user_id)
      .input("start_date", sql.Date, start_date)
      .input("plan_name", sql.NVarChar, `Kế hoạch ${user_id}`)
      .input("month_quit", sql.Int, quit_months)
      .query(`
        INSERT INTO CESSATION_PLAN (
          user_id, start_date, plan_type, is_active, created_at, plan_name, month_quit
        )
        VALUES (
          @user_id, @start_date, 'standard', 1, GETDATE(), @plan_name, @month_quit
        )
      `);

    res.json({ message: "Plan saved" });
  } catch (err) {
    console.error("Error saving plan:", err);
    res.status(500).json({ error: "Save failed" });
  }
});

router.post("/reset", async (req, res) => {
  const { user_id } = req.body;
  try {
    await poolConnect; // Đảm bảo pool đã kết nối
    await pool
      .request()
      .input("user_id", sql.Int, user_id)
      .query("DELETE FROM CESSATION_PLAN WHERE user_id = @user_id");

    res.json({ message: "Reset thành công" });
  } catch (err) {
    console.error("Error resetting plan:", err);
    res.status(500).json({ error: "Lỗi server khi reset kế hoạch" });
  }
});

module.exports = router;