const { sql, dbConfig } = require('../config/database');

// API 1: Lấy số tiền tiết kiệm
exports.getUserSavings = async (req, res) => {
  const userId = req.user.id;
  const pricePerCig = 3000;

  const q4Map = {
    0: 5,   // ≤10
    1: 15,  // 11–20
    2: 25,  // 21–30
    3: 35   // ≥31
  };

  try {
    const pool = await sql.connect(dbConfig);

  // 1. Lấy số trung bình tần xuất hút
const ftnd = await pool.request()
  .input("user_id", sql.Int, userId)
  .query(`
    SELECT TOP 1 q4_value
    FROM FTND_RESULT
    WHERE user_id = @user_id AND q4_value IS NOT NULL
    ORDER BY submitted_at DESC
  `);

if (!ftnd.recordset.length) {
  return res.status(400).json({ message: "Chưa có dữ liệu FTND." });
}

const q4_value = ftnd.recordset[0].q4_value;
const estimatedPerDay = q4Map[q4_value] || 15;

// 2. Lấy ngày bắt đầu kế hoạch cai thuốc
const plan = await pool.request()
  .input("user_id", sql.Int, userId)
  .query(`
    SELECT TOP 1 start_date
    FROM CESSATION_PLAN
    WHERE user_id = @user_id AND is_active = 1
  `);

if (!plan.recordset.length) {
  return res.status(400).json({ message: "Chưa có kế hoạch cai thuốc." });
}

const startDate = plan.recordset[0].start_date;

// 3. Lấy log từ ngày bắt đầu kế hoạch
const logs = await pool.request()
  .input("user_id", sql.Int, userId)
  .input("start_date", sql.Date, startDate)
  .input("today", sql.Date, new Date())
  .query(`
    SELECT total_cigarettes
    FROM DAILY_SMOKING_SUMMARY
    WHERE user_id = @user_id AND date BETWEEN @start_date AND @today;
  `);

  let totalSaved = 0;
  logs.recordset.forEach(entry => {
    const reduced = Math.max(0, estimatedPerDay - entry.total_cigarettes);
    totalSaved += reduced * pricePerCig;
    });

    res.json({ amount: totalSaved, startDate: startDate  });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi tính số tiền tiết kiệm" });
  }
};


// API 4: Lấy thành tựu
exports.getUserAchievements = async (req, res) => {
  const userId = req.user.id;

  try {
    const pool = await sql.connect(dbConfig);

    const result = await pool.request()
      .input('user_id', sql.Int, userId)
      .query(`
        SELECT a.title, a.description, ua.earned_date, ua.is_shared
        FROM ACHIEVEMENT a
        JOIN USER_ACHIEVEMENT ua ON a.achievement_id = ua.achievement_id
        WHERE ua.user_id = @user_id;
      `);

    res.json({ achievements: result.recordset });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi lấy danh sách thành tựu' });
  }
}

exports.getUserProgressSummary = async (req, res) => {
  const userId = req.user.id;

  try {
    const pool = await sql.connect(dbConfig);

    // 1. Lấy kế hoạch cai thuốc đang hoạt động
    const plan = await pool.request()
      .input('user_id', sql.Int, userId)
      .query(`
        SELECT TOP 1 start_date, frequency_per_day
        FROM CESSATION_PLAN
        WHERE user_id = @user_id AND is_active = 1
      `);

    if (!plan.recordset.length) {
      return res.status(400).json({ message: 'Chưa có kế hoạch cai thuốc đang hoạt động.' });
    }

    const { start_date: startDate, frequency_per_day: freqPerDay } = plan.recordset[0];
    const today = new Date();
    const start = new Date(startDate);

    // 2. Nếu kế hoạch chưa bắt đầu thì return 0
    if (start > today) {
      return res.json({ avoidedCigarettes: 0, smokeFreeDays: 0 });
    }

    const totalDays = Math.floor((today - start) / (1000 * 60 * 60 * 24)) + 1;

    // 3. Lấy dữ liệu hút từ bảng DAILY_SMOKING_SUMMARY
    const result = await pool.request()
      .input('user_id', sql.Int, userId)
      .input('start_date', sql.Date, startDate)
      .input('today', sql.Date, today)
      .query(`
        SELECT 
          ISNULL(SUM(total_cigarettes), 0) AS total_actual,
          SUM(CASE WHEN total_cigarettes > 0 THEN 1 ELSE 0 END) AS smoked_days
        FROM DAILY_SMOKING_SUMMARY
        WHERE user_id = @user_id AND date BETWEEN @start_date AND @today
      `);

    const { total_actual, smoked_days } = result.recordset[0];
    const avoidedCigarettes = Math.max(0, (totalDays * freqPerDay) - total_actual);
    const smokeFreeDays = Math.max(0, totalDays - smoked_days);

    res.json({ avoidedCigarettes, smokeFreeDays });
  } catch (err) {
    console.error("❌ Lỗi lấy tiến trình cai thuốc:", err);
    res.status(500).json({ message: 'Lỗi lấy tiến trình bỏ thuốc' });
  }
};
