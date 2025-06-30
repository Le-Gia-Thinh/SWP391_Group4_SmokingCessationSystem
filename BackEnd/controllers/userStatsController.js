const { sql, dbConfig } = require('../config/database');

// API 1: Lấy số tiền tiết kiệm
exports.getUserSavings = async (req, res) => {
  const userId = req.user.id;
  const pricePerCig = 3000;

  try {
    const pool = await sql.connect(dbConfig);

    const plan = await pool.request()
      .input('user_id', sql.Int, userId)
      .query(`SELECT start_date, frequency_per_day FROM CESSATION_PLAN WHERE user_id = @user_id AND is_active = 1;`);

    if (!plan.recordset.length)
      return res.status(400).json({ message: 'Chưa có kế hoạch cai thuốc đang hoạt động.' });

    const { start_date: startDate, frequency_per_day: freqPerDay } = plan.recordset[0];

    const logs = await pool.request()
    .input('user_id', sql.Int, userId)
    .input('start_date', sql.Date, startDate)
    .query(`
      SELECT total_cigarettes
      FROM DAILY_SMOKING_SUMMARY
      WHERE user_id = @user_id AND date >= @start_date;
    `);

    let totalSaved = 0;
    logs.recordset.forEach(entry => {
      const reduced = Math.max(0, freqPerDay - entry.total_cigarettes);
      totalSaved += reduced * pricePerCig;
    });
    res.json({ amount: totalSaved, startDate });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi tính số tiền tiết kiệm' });
  }
};

// API 2: Lấy tần suất hút thuốc 
exports.getUserFrequency = async (req, res) => {
  const userId = req.user.id;

  try {
    const pool = await sql.connect(dbConfig);

    const plan = await pool.request()
      .input('user_id', sql.Int, userId)
      .query(`SELECT frequency_per_day FROM CESSATION_PLAN WHERE user_id = @user_id AND is_active = 1;`);

    if (!plan.recordset.length)
      return res.status(400).json({ message: 'Chưa có kế hoạch cai thuốc.' });

    const freqPerDay = plan.recordset[0].frequency_per_day;

    const habit = await pool.request()
      .input('user_id', sql.Int, userId)
      .query(`SELECT AVG(total_cigarettes) AS avg_cigs FROM DAILY_SMOKING_SUMMARY WHERE user_id = @user_id;`);

    const avgCigs = habit.recordset[0]?.avg_cigs || 0;

    res.json({
      initial: freqPerDay,
      current: avgCigs,
      reductionRate: Math.round((1 - avgCigs / (freqPerDay || 1)) * 100)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi lấy tần suất hút thuốc' });
  }
};

// API 3: Lấy điểm số
exports.getUserScore = async (req, res) => {
  const userId = req.user.id;

  try {
    const pool = await sql.connect(dbConfig);

    const result = await pool.request()
      .input('user_id', sql.Int, userId)
      .query(`SELECT total_points FROM USER_SCORE WHERE user_id = @user_id;`);

    res.json({ score: result.recordset[0]?.total_points || 0 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi lấy điểm tích lũy' });
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
