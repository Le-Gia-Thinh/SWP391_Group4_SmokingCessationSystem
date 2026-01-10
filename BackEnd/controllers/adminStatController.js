const { sql, dbConfig } = require("../config/database");

const getUsersSummary = async (req, res) => {
  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool.request().query(`
      SELECT COUNT(*) AS total_users
      FROM CUSTOMER
      WHERE user_role = 'member'
    `);
    res.json({ total_users: result.recordset[0].total_users });
  } catch (err) {
    console.error("getUsersSummary error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// controllers/adminStatController.js
// Doanh thu 7 ngày gần nhất
const getDailyRevenue = async (req, res) => {
  try {
    const pool = await sql.connect(dbConfig);

    const rawResult = await pool.request().query(`
      SELECT 
        CAST(P.payment_date AS DATE) AS day, 
        SUM(P.amount) AS total
      FROM PAYMENT P
      JOIN USER_SUBSCRIPTION US ON P.subscription_id = US.subscription_id
      JOIN CUSTOMER C ON US.user_id = C.user_id
      WHERE 
        P.payment_status = 'paid'
        AND C.user_role = 'member'
        AND CAST(P.payment_date AS DATE) >= DATEADD(DAY, -6, CAST(GETDATE() AS DATE))
      GROUP BY CAST(P.payment_date AS DATE)
    `);

    // Tạo mảng 7 ngày gần nhất tính từ hôm nay
    const today = new Date();
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      last7Days.push(d.toISOString().slice(0, 10)); // yyyy-mm-dd
    }

    // Map kết quả từ SQL thành object để dễ tra cứu
    const revenueMap = {};
    rawResult.recordset.forEach((row) => {
      const key = row.day.toISOString().slice(0, 10);
      revenueMap[key] = row.total;
    });

    // Gắn doanh thu tương ứng với từng ngày (nếu không có thì = 0)
    const labels = last7Days;
    const data = last7Days.map((d) => revenueMap[d] || 0);

    res.json({ labels, data });
  } catch (err) {
    console.error("getDailyRevenue error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Doanh thu 5 tuần gần nhất trong tháng hiện tại
const getWeeklyRevenue = async (req, res) => {
  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool.request().query(`
      WITH FilteredPayments AS (
        SELECT
          payment_date,
          amount,
          DATEFROMPARTS(YEAR(payment_date), MONTH(payment_date), 1) AS month_start,
          EOMONTH(payment_date) AS month_end
        FROM PAYMENT P
        JOIN USER_SUBSCRIPTION US ON P.subscription_id = US.subscription_id
        JOIN CUSTOMER C ON US.user_id = C.user_id
        WHERE P.payment_status = 'paid' AND C.user_role = 'member'
      ),
      WeeklyGrouped AS (
        SELECT
          DATEADD(DAY, (DATEDIFF(DAY, month_start, payment_date) / 7) * 7, month_start) AS week_start,
          SUM(amount) AS total
        FROM FilteredPayments
        WHERE 
          MONTH(payment_date) = MONTH(GETDATE()) 
          AND YEAR(payment_date) = YEAR(GETDATE())
          AND payment_date >= month_start AND payment_date <= month_end
        GROUP BY DATEADD(DAY, (DATEDIFF(DAY, month_start, payment_date) / 7) * 7, month_start)
      )
      SELECT 
        FORMAT(week_start, 'dd-MM') + ' __ ' + FORMAT(DATEADD(DAY, 6, week_start), 'dd-MM') AS label,
        total
      FROM WeeklyGrouped
      ORDER BY week_start
    `);

    const labels = result.recordset.map((r) => r.label);
    const data = result.recordset.map((r) => r.total);

    res.json({ labels, data });
  } catch (err) {
    console.error("getWeeklyRevenueThisMonth error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Doanh thu 12 tháng của năm hiện tại
const getMonthlyRevenue = async (req, res) => {
  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool.request().query(`
      SELECT FORMAT(P.payment_date, 'MM/yyyy') AS month, SUM(P.amount) AS total
      FROM PAYMENT P
      JOIN USER_SUBSCRIPTION US ON P.subscription_id = US.subscription_id
      JOIN CUSTOMER C ON US.user_id = C.user_id
      WHERE P.payment_status = 'paid'
        AND C.user_role = 'member'
        AND YEAR(P.payment_date) = YEAR(GETDATE())
      GROUP BY FORMAT(P.payment_date, 'MM/yyyy')
      ORDER BY MIN(P.payment_date)
    `);
    const labels = result.recordset.map((r) => r.month);
    const data = result.recordset.map((r) => r.total);
    res.json({ labels, data });
  } catch (err) {
    console.error("getMonthlyRevenue error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Doanh thu theo từng năm
const getYearlyRevenue = async (req, res) => {
  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool.request().query(`
      SELECT DATEPART(YEAR, payment_date) AS year, SUM(amount) AS total
      FROM PAYMENT P
      JOIN USER_SUBSCRIPTION US ON P.subscription_id = US.subscription_id
      JOIN CUSTOMER C ON US.user_id = C.user_id
      WHERE P.payment_status = 'paid' AND C.user_role = 'member'
      GROUP BY DATEPART(YEAR, payment_date)
      ORDER BY year
    `);
    const labels = result.recordset.map((r) => r.year.toString());
    const data = result.recordset.map((r) => r.total);
    res.json({ labels, data });
  } catch (err) {
    console.error("getYearlyRevenue error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

const getActiveCoachCount = async (req, res) => {
  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool.request().query(`
      SELECT COUNT(*) AS active_coach
      FROM CUSTOMER
      WHERE user_role = 'coach' AND account_status = 'active'
    `);
    res.json({ count: result.recordset[0].active_coach });
  } catch (err) {
    console.error("getActiveCoachCount error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// 1️ API: Doanh thu theo ngày trong khoảng (range)
const getRevenueByDateRange = async (req, res) => {
  const { from, to } = req.query;
  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool
      .request()
      .input("from", sql.Date, from)
      .input("to", sql.Date, to).query(`
        SELECT 
          CAST(P.payment_date AS DATE) AS day,
          SUM(P.amount) AS total
        FROM PAYMENT P
        JOIN USER_SUBSCRIPTION US ON P.subscription_id = US.subscription_id
        JOIN CUSTOMER C ON US.user_id = C.user_id
        WHERE P.payment_status = 'paid'
          AND C.user_role = 'member'
          AND CAST(P.payment_date AS DATE) BETWEEN @from AND @to
        GROUP BY CAST(P.payment_date AS DATE)
        ORDER BY day ASC
      `);

    // Tạo map đầy đủ các ngày trong khoảng
    const dayMap = {};
    const current = new Date(from);
    const end = new Date(to);
    while (current <= end) {
      const dateStr = current.toISOString().split("T")[0];
      dayMap[dateStr] = 0;
      current.setDate(current.getDate() + 1);
    }

    result.recordset.forEach((r) => {
      const d = r.day.toISOString().split("T")[0];
      dayMap[d] = r.total;
    });

    res.json({
      labels: Object.keys(dayMap),
      data: Object.values(dayMap),
    });
  } catch (err) {
    console.error("getRevenueByDateRange error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

const getRevenueByWeekRange = async (req, res) => {
  const { from, to } = req.query;
  try {
    const pool = await sql.connect(dbConfig);

    // Chuyển from về Date object
    const start = new Date(from);
    const weekRanges = [];

    for (let i = 0; i < 5; i++) {
      const weekStart = new Date(start);
      weekStart.setDate(start.getDate() + i * 7);

      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);

      weekRanges.push({ start: weekStart, end: weekEnd });
    }

    // Tạo SQL truy vấn tổng doanh thu theo từng khoảng tuần
    const queries = await Promise.all(
      weekRanges.map(async ({ start, end }) => {
        const result = await pool
          .request()
          .input("start", sql.Date, start)
          .input("end", sql.Date, end).query(`
            SELECT 
              SUM(P.amount) AS total
            FROM PAYMENT P
            JOIN USER_SUBSCRIPTION US ON P.subscription_id = US.subscription_id
            JOIN CUSTOMER C ON US.user_id = C.user_id
            WHERE 
              P.payment_status = 'paid' AND C.user_role = 'member'
              AND CAST(P.payment_date AS DATE) BETWEEN @start AND @end
          `);

        const label = `${start.toLocaleDateString("vi-VN", {
          day: "2-digit",
          month: "2-digit",
        })} __ ${end.toLocaleDateString("vi-VN", {
          day: "2-digit",
          month: "2-digit",
        })}`;

        return {
          label,
          total: result.recordset[0].total || 0,
        };
      })
    );

    const labels = queries.map((q) => q.label);
    const data = queries.map((q) => q.total);

    res.json({ labels, data });
  } catch (err) {
    console.error("getRevenueByWeekRange error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// 3️ API: Doanh thu 12 tháng của 1 năm
const getMonthlyRevenueByYear = async (req, res) => {
  const { year } = req.query;
  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool.request().input("year", sql.Int, year).query(`
        SELECT 
          MONTH(payment_date) AS month,
          SUM(amount) AS total
        FROM PAYMENT P
        JOIN USER_SUBSCRIPTION US ON P.subscription_id = US.subscription_id
        JOIN CUSTOMER C ON US.user_id = C.user_id
        WHERE 
          P.payment_status = 'paid'
          AND C.user_role = 'member'
          AND YEAR(payment_date) = @year
        GROUP BY MONTH(payment_date)
        ORDER BY month
      `);

    const monthMap = Array(12).fill(0);
    result.recordset.forEach((r) => {
      monthMap[r.month - 1] = r.total;
    });

    res.json({
      labels: [
        "Tháng 1",
        "Tháng 2",
        "Tháng 3",
        "Tháng 4",
        "Tháng 5",
        "Tháng 6",
        "Tháng 7",
        "Tháng 8",
        "Tháng 9",
        "Tháng 10",
        "Tháng 11",
        "Tháng 12",
      ],
      data: monthMap,
    });
  } catch (err) {
    console.error("getMonthlyRevenueByYear error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

const getAverageMonthsByAddictionLevel = async (req, res) => {
  try {
    console.log("📊 [API CALLED] getAverageMonthsByAddictionLevel");

    const pool = await sql.connect(dbConfig);
    const result = await pool.request().query(`
      SELECT 
        fr.[level] AS addiction_level,
        AVG(cp.month_quit * 1.0) AS avg_months
      FROM CESSATION_PLAN cp
      JOIN (
        SELECT user_id, [level]
        FROM (
          SELECT *, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY submitted_at DESC) AS rn
          FROM FTND_RESULT
        ) sub
        WHERE rn = 1
      ) fr ON cp.user_id = fr.user_id
      JOIN CUSTOMER c ON cp.user_id = c.user_id
      WHERE c.user_role = 'member'
      GROUP BY fr.[level]
    `);

    console.log("✅ Query result:", result.recordset);

    const labels = result.recordset.map((r) => r.addiction_level.toLowerCase());
    const data = result.recordset.map((r) =>
      parseFloat(r.avg_months.toFixed(2))
    );

    res.json({ labels, data });
  } catch (err) {
    console.error("🔥 Error in getAverageMonthsByAddictionLevel:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

const getRevenueStats = async (req, res) => {
  // 👇 Hàm chỉ dùng trong đây
  function getStartOfCurrentWeek(fromBase) {
    const now = new Date();
    const start = new Date(fromBase);

    for (let i = 0; i < 5; i++) {
      const weekStart = new Date(start);
      weekStart.setDate(start.getDate() + i * 7);

      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);

      if (now >= weekStart && now <= weekEnd) {
        return { start: weekStart, end: weekEnd };
      }
    }

    return { start: null, end: null };
  }

  try {
    const fromBase = new Date(req.query.from || new Date());
    const { start, end } = getStartOfCurrentWeek(fromBase);

    console.log("📅 Tuần hiện tại:", {
      start: start?.toLocaleDateString("vi-VN"),
      end: end?.toLocaleDateString("vi-VN"),
    });

    const pool = await sql.connect(dbConfig);
    const result = await pool
      .request()
      .input("start", sql.Date, start)
      .input("end", sql.Date, end).query(`
        SELECT
          (SELECT SUM(amount) FROM PAYMENT
           WHERE payment_status = 'paid'
             AND CAST(payment_date AS DATE) = CAST(GETDATE() AS DATE)) AS total_today,

          (SELECT SUM(amount) FROM PAYMENT
           WHERE payment_status = 'paid'
             AND CAST(payment_date AS DATE) BETWEEN @start AND @end) AS total_week,

          (SELECT SUM(amount) FROM PAYMENT
           WHERE payment_status = 'paid'
             AND MONTH(payment_date) = MONTH(GETDATE())
             AND YEAR(payment_date) = YEAR(GETDATE())) AS total_month,

          (SELECT SUM(amount) FROM PAYMENT
           WHERE payment_status = 'paid'
             AND YEAR(payment_date) = YEAR(GETDATE())) AS total_year
      `);

    const stats = result.recordset[0];
    res.json({
      total_today: stats.total_today || 0,
      total_week: stats.total_week || 0,
      total_month: stats.total_month || 0,
      total_year: stats.total_year || 0,
    });
  } catch (err) {
    console.error("getRevenueStats error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = {
  getUsersSummary,
  getDailyRevenue,
  getWeeklyRevenue,
  getMonthlyRevenue,
  getYearlyRevenue,
  getRevenueByDateRange,
  getRevenueByWeekRange,
  getMonthlyRevenueByYear,
  getActiveCoachCount,
  getAverageMonthsByAddictionLevel,
  getRevenueStats,
};
