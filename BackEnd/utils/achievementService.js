const { sql, dbConfig } = require("../config/database");

const checkFunctions = {
  // Blog
  blog_first_post: async (pool, userId) => {
    const result = await pool.request().input("user_id", sql.Int, userId)
      .query(`SELECT COUNT(*) AS count FROM COMMUNITY_POST WHERE user_id = @user_id`);
    return result.recordset[0].count >= 1;
  },

  blog_5_in_7days: async (pool, userId) => {
    const result = await pool.request().input("user_id", sql.Int, userId)
      .query(`
        SELECT COUNT(*) AS count FROM COMMUNITY_POST
        WHERE user_id = @user_id AND created_at >= DATEADD(DAY, -6, CAST(GETDATE() AS DATE))
      `);
    return result.recordset[0].count >= 5;
  },

  // FTND
  ftnd_submitted: async (pool, userId) => {
    const result = await pool.request().input("user_id", sql.Int, userId)
      .query(`SELECT 1 FROM FTND_RESULT WHERE user_id = @user_id`);
    return result.recordset.length > 0;
  },

  // Kế hoạch
  plan_created: async (pool, userId) => {
    const result = await pool.request().input("user_id", sql.Int, userId)
      .query(`SELECT 1 FROM CESSATION_PLAN WHERE user_id = @user_id`);
    return result.recordset.length > 0;
  },

  // Hành vi
  task_first: async (pool, userId) => {
    const result = await pool.request().input("user_id", sql.Int, userId)
      .query(`SELECT 1 FROM USER_BEHAVIOR_TASK_LOG WHERE user_id = @user_id`);
    return result.recordset.length > 0;
  },

  task_full_day: async (pool, userId) => {
    const result = await pool.request().input("user_id", sql.Int, userId)
      .query(`
        SELECT COUNT(*) AS count FROM (
          SELECT log_date FROM USER_BEHAVIOR_TASK_LOG
          WHERE user_id = @user_id
          GROUP BY log_date HAVING COUNT(DISTINCT time_slot) = 9
        ) AS FullDay
      `);
    return result.recordset[0].count >= 1;
  },

  task_10_total: async (pool, userId) => {
    const result = await pool.request().input("user_id", sql.Int, userId)
      .query(`SELECT COUNT(*) AS count FROM USER_BEHAVIOR_TASK_LOG WHERE user_id = @user_id`);
    return result.recordset[0].count >= 10;
  },

  task_20_total: async (pool, userId) => {
    const result = await pool.request().input("user_id", sql.Int, userId)
      .query(`SELECT COUNT(*) AS count FROM USER_BEHAVIOR_TASK_LOG WHERE user_id = @user_id`);
    return result.recordset[0].count >= 20;
  },

  task_40_total: async (pool, userId) => {
    const result = await pool.request().input("user_id", sql.Int, userId)
      .query(`SELECT COUNT(*) AS count FROM USER_BEHAVIOR_TASK_LOG WHERE user_id = @user_id`);
    return result.recordset[0].count >= 40;
  },

  task_7days_consistent: async (pool, userId) => {
    const result = await pool.request().input("user_id", sql.Int, userId)
      .query(`
        SELECT COUNT(*) AS count FROM (
          SELECT log_date
          FROM USER_BEHAVIOR_TASK_LOG
          WHERE user_id = @user_id
          GROUP BY log_date
          HAVING COUNT(*) >= 5
        ) AS Days
      `);
    return result.recordset[0].count >= 7;
  },

  tried_all_slots: async (pool, userId) => {
    const result = await pool.request().input("user_id", sql.Int, userId)
      .query(`
        SELECT COUNT(DISTINCT time_slot) AS count
        FROM USER_BEHAVIOR_TASK_LOG
        WHERE user_id = @user_id
      `);
    return result.recordset[0].count >= 9;
  },

  // Không hút thuốc
  clean_3_days: async (pool, userId) => {
    const result = await pool.request().input("user_id", sql.Int, userId)
      .query(`
        SELECT COUNT(DISTINCT date) AS days
        FROM DAILY_SMOKING_SUMMARY
        WHERE user_id = @user_id AND total_cigarettes = 0 AND date <= CAST(GETDATE() AS DATE)
      `);
    return result.recordset[0].days >= 3;
  },

  clean_7_days: async (pool, userId) => {
  const result = await pool.request()
    .input("user_id", sql.Int, userId)
    .query(`
      SELECT COUNT(*) AS clean_days
      FROM DAILY_SMOKING_SUMMARY
      WHERE user_id = @user_id 
        AND total_cigarettes = 0 
        AND date <= CAST(GETDATE() AS DATE)
    `);
    return result.recordset[0].clean_days >= 7;
  },

  clean_15_days: async (pool, userId) => {
    const result = await pool.request().input("user_id", sql.Int, userId)
      .query(`
        SELECT COUNT(DISTINCT date) AS days
        FROM DAILY_SMOKING_SUMMARY
        WHERE user_id = @user_id AND total_cigarettes = 0  AND date <= CAST(GETDATE() AS DATE)
      `);
    return result.recordset[0].days >= 15;
  },

  clean_30_days: async (pool, userId) => {
    const result = await pool.request().input("user_id", sql.Int, userId)
      .query(`
        SELECT COUNT(DISTINCT date) AS days
        FROM DAILY_SMOKING_SUMMARY
        WHERE user_id = @user_id AND total_cigarettes = 0 AND date <= CAST(GETDATE() AS DATE)
      `);
    return result.recordset[0].days >= 30;
  },

  clean_60_days: async (pool, userId) => {
    const result = await pool.request().input("user_id", sql.Int, userId)
      .query(`
        SELECT COUNT(DISTINCT date) AS days
        FROM DAILY_SMOKING_SUMMARY
        WHERE user_id = @user_id AND total_cigarettes = 0 AND date <= CAST(GETDATE() AS DATE)
      `);
    return result.recordset[0].days >= 60;
  },

  clean_90_days: async (pool, userId) => {
    const result = await pool.request().input("user_id", sql.Int, userId)
      .query(`
        SELECT COUNT(DISTINCT date) AS days
        FROM DAILY_SMOKING_SUMMARY
        WHERE user_id = @user_id AND total_cigarettes = 0 AND date <= CAST(GETDATE() AS DATE)
      `);
    return result.recordset[0].days >= 90;
  },

  first_day_clean: async (pool, userId) => {
    const result = await pool.request().input("user_id", sql.Int, userId)
      .query(`
        SELECT TOP 1 total_cigarettes
        FROM DAILY_SMOKING_SUMMARY
        WHERE user_id = @user_id
        ORDER BY date ASC
      `);
    return result.recordset.length > 0 && result.recordset[0].total_cigarettes === 0;
  },

  // Coach
  coach_session_done: async (pool, userId) => {
    const result = await pool.request().input("user_id", sql.Int, userId)
      .query(`
        SELECT 1 FROM COACHING_SESSION
        WHERE user_id = @user_id AND session_status IN ('accepted', 'completed')
      `);
    return result.recordset.length > 0;
  },

  // Community
  inspiring_post: async (pool, userId) => {
    const result = await pool.request().input("user_id", sql.Int, userId)
      .query(`
        SELECT COUNT(*) AS count FROM COMMUNITY_POST
        WHERE user_id = @user_id AND like_count >= 10
      `);
    return result.recordset[0].count >= 1;
  },
};

// Hàm kiểm tra và mở khóa thành tựu
exports.evaluateAndUnlockAchievements = async (userId) => {
  const pool = await sql.connect(dbConfig);
  const achievements = await pool.request()
    .query(`SELECT achievement_id, check_code FROM ACHIEVEMENT WHERE check_code IS NOT NULL`);
  for (const { achievement_id, check_code } of achievements.recordset) {
    const fn = checkFunctions[check_code];
    if (fn && await fn(pool, userId)) {
      await grantIfNotExist(pool, userId, achievement_id);
    }
  }
};

async function grantIfNotExist(pool, userId, achievementId) {
  const exist = await pool.request()
    .input("user_id", sql.Int, userId)
    .input("achievement_id", sql.Int, achievementId)
    .query(`SELECT 1 FROM USER_ACHIEVEMENT WHERE user_id = @user_id AND achievement_id = @achievement_id`);
  if (exist.recordset.length === 0) {
    await pool.request()
      .input("user_id", sql.Int, userId)
      .input("achievement_id", sql.Int, achievementId)
      .query(`
        INSERT INTO USER_ACHIEVEMENT (user_id, achievement_id, earned_date, is_shared)
        VALUES (@user_id, @achievement_id, GETDATE(), 0)
      `);

    const info = await pool.request()
      .input("achievement_id", sql.Int, achievementId)
      .query(`SELECT title, description FROM ACHIEVEMENT WHERE achievement_id = @achievement_id`);

    const { title, description } = info.recordset[0];
    const content = `🏆 Bạn vừa đạt thành tựu: ${title}! ${description}`;

    // Gửi thông báo cho người dùng
    await pool.request()
      .input("user_id", sql.Int, userId)
      .input("title", sql.NVarChar, "🎉 Thành tựu mới")
      .input("content", sql.NVarChar, content)
      .input("notification_type", sql.VarChar, "achievement")
      .input("created_at", sql.DateTime, new Date())
      .input("is_read", sql.Bit, 0)
      .query(`
        INSERT INTO NOTIFICATION (user_id, title, content, notification_type, created_at, is_read)
        VALUES (@user_id, @title, @content, @notification_type, @created_at, @is_read)
      `);
  }

  
}
