// controllers/userScoreController.js
const { sql, dbConfig } = require("../config/database");

const getRanking = async (req, res) => {
  try {
    console.log('🔄 Đang lấy bảng xếp hạng...');

    const pool = await sql.connect(dbConfig);
    const result = await pool.request().query(`
      SELECT TOP 50
        s.user_id,
        c.full_name,
        c.avatar_url,
        s.total_points,
        s.current_level,
        s.last_updated,
        CASE
          WHEN s.current_level = 'Beginner' THEN 
            CASE 
              WHEN s.total_points >= 100 THEN 100
              ELSE CAST(s.total_points * 100.0 / 100 AS INT)
            END
          WHEN s.current_level = 'Intermediate' THEN 
            CASE 
              WHEN s.total_points >= 400 THEN 100
              ELSE CAST((s.total_points - 100) * 100.0 / 300 AS INT)
            END
          WHEN s.current_level = 'Advanced' THEN 
            CASE 
              WHEN s.total_points >= 1000 THEN 100
              ELSE CAST((s.total_points - 400) * 100.0 / 600 AS INT)
            END
          WHEN s.current_level = 'Master' THEN 100
          ELSE 0
        END AS progress_to_next,
        ROW_NUMBER() OVER (ORDER BY s.total_points DESC, s.last_updated ASC) AS rank
      FROM USER_SCORE s
      INNER JOIN CUSTOMER c ON s.user_id = c.user_id
      WHERE s.total_points > 0
      ORDER BY s.total_points DESC, s.last_updated ASC
    `);

    const dataWithRank = result.recordset.map((user, index) => ({
      ...user,
      rank: index + 1,
      total_points: parseFloat(user.total_points) || 0,
      progress_to_next: Math.min(Math.max(user.progress_to_next || 0, 0), 100)
    }));

    console.log(`✅ Lấy được ${dataWithRank.length} người dùng trong bảng xếp hạng`);

    res.json({
      success: true,
      data: dataWithRank,
      total: dataWithRank.length,
      timestamp: new Date().toISOString()
    });

  } catch (err) {
    console.error("❌ Lỗi lấy bảng xếp hạng:", err);
    res.json({
      success: true,
      data: mockData,
      total: mockData.length,
      error: "Sử dụng dữ liệu mẫu do lỗi database",
      timestamp: new Date().toISOString()
    });
  }
};

// Vị trí của người dùng hiện tại
const getMyRanking = async (req, res) => {
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({
      success: false,
      message: "Người dùng chưa đăng nhập"
    });
  }

  try {
    console.log(`🔄 Đang lấy thứ hạng cho user ID: ${userId}`);

    const pool = await sql.connect(dbConfig);

    // Lấy thông tin người dùng và thứ hạng
    const result = await pool.request()
      .input('user_id', sql.Int, userId)
      .query(`
        WITH RankedUsers AS (
          SELECT 
            s.user_id,
            c.full_name,
            c.avatar_url,
            s.total_points,
            s.current_level,
            s.last_updated,
            CASE
              WHEN s.current_level = 'Beginner' THEN 
                CASE 
                  WHEN s.total_points >= 100 THEN 100
                  ELSE CAST(s.total_points * 100.0 / 100 AS INT)
                END
              WHEN s.current_level = 'Intermediate' THEN 
                CASE 
                  WHEN s.total_points >= 400 THEN 100
                  ELSE CAST((s.total_points - 100) * 100.0 / 300 AS INT)
                END
              WHEN s.current_level = 'Advanced' THEN 
                CASE 
                  WHEN s.total_points >= 1000 THEN 100
                  ELSE CAST((s.total_points - 400) * 100.0 / 600 AS INT)
                END
              WHEN s.current_level = 'Master' THEN 100
              ELSE 0
            END AS progress_to_next,
            ROW_NUMBER() OVER (ORDER BY s.total_points DESC, s.last_updated ASC) AS rank
          FROM USER_SCORE s
          INNER JOIN CUSTOMER c ON s.user_id = c.user_id
          WHERE s.total_points > 0
        )
        SELECT * FROM RankedUsers WHERE user_id = @user_id
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy thông tin xếp hạng của người dùng"
      });
    }

    const userRanking = result.recordset[0];
    const responseData = {
      ...userRanking,
      total_points: parseFloat(userRanking.total_points) || 0,
      progress_to_next: Math.min(Math.max(userRanking.progress_to_next || 0, 0), 100)
    };

    console.log(`✅ Lấy được thứ hạng cho user ${userId}: #${responseData.rank}`);

    res.json({
      success: true,
      data: responseData,
      timestamp: new Date().toISOString()
    });

  } catch (err) {
    console.error("❌ Lỗi lấy thứ hạng người dùng:", err);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy thứ hạng",
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

const updateUserScore = async (req, res) => {
  const userId = req.user?.id || req.body.user_id || req.query.user_id;

  if (!userId) {
    return res.status(400).json({
      success: false,
      message: "Thiếu user_id"
    });
  }

  try {
    console.log(`🔄 Đang cập nhật điểm cho user ID: ${userId}`);

    const pool = await sql.connect(dbConfig);

    // Đếm số hành vi hoàn thành
    const habitResult = await pool.request()
      .input("user_id", sql.Int, userId)
      .query(`
        SELECT COUNT(*) AS completedCount
        FROM HABIT_LOG
        WHERE user_id = @user_id AND completed = 1
      `);

    const completedCount = habitResult.recordset[0]?.completedCount || 0;

    // Lấy thông tin plan để tính điểm mỗi slot
    const planResult = await pool.request()
      .input("user_id", sql.Int, userId)
      .query(`
        SELECT TOP 1 month_quit, created_at
        FROM CESSATION_PLAN
        WHERE user_id = @user_id AND is_active = 1
        ORDER BY created_at DESC
      `);

    const months = planResult.recordset[0]?.month_quit || 1;
    const totalSlots = months * 30 * 9;
    const pointPerSlot = parseFloat((100 / totalSlots).toFixed(3));
    const totalPoints = parseFloat((completedCount * pointPerSlot).toFixed(3));

    // Xác định cấp độ mới dựa trên điểm số
    let newLevel = "Beginner";
    if (totalPoints >= 1000) {
      newLevel = "Master";
    } else if (totalPoints >= 400) {
      newLevel = "Advanced";
    } else if (totalPoints >= 100) {
      newLevel = "Intermediate";
    }

    // Kiểm tra xem user đã có record trong USER_SCORE chưa
    const existingScoreResult = await pool.request()
      .input("user_id", sql.Int, userId)
      .query(`
        SELECT user_id FROM USER_SCORE WHERE user_id = @user_id
      `);

    if (existingScoreResult.recordset.length > 0) {
      // Cập nhật USER_SCORE nếu đã tồn tại
      await pool.request()
        .input("user_id", sql.Int, userId)
        .input("total_points", sql.Float, totalPoints)
        .input("current_level", sql.VarChar, newLevel)
        .query(`
          UPDATE USER_SCORE
          SET total_points = @total_points, 
              current_level = @current_level, 
              last_updated = GETDATE()
          WHERE user_id = @user_id
        `);
    } else {
      // Tạo mới record nếu chưa tồn tại
      await pool.request()
        .input("user_id", sql.Int, userId)
        .input("total_points", sql.Float, totalPoints)
        .input("current_level", sql.VarChar, newLevel)
        .query(`
          INSERT INTO USER_SCORE (user_id, total_points, current_level, last_updated)
          VALUES (@user_id, @total_points, @current_level, GETDATE())
        `);
    }

    console.log(`✅ Cập nhật điểm thành công cho user ${userId}: ${totalPoints} điểm, cấp ${newLevel}`);

    res.json({
      success: true,
      data: {
        user_id: userId,
        totalPoints: totalPoints,
        newLevel: newLevel,
        completedHabits: completedCount,
        pointPerSlot: pointPerSlot
      },
      message: "Cập nhật điểm thành công",
      timestamp: new Date().toISOString()
    });

  } catch (err) {
    console.error("❌ Lỗi cập nhật điểm tổng hợp:", err);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi cập nhật điểm",
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// Lấy thống kê tổng quan của hệ thống xếp hạng
const getRankingStats = async (req, res) => {
  try {
    console.log('🔄 Đang lấy thống kê xếp hạng...');

    const pool = await sql.connect(dbConfig);
    const result = await pool.request().query(`
      SELECT 
        COUNT(*) as total_users,
        AVG(total_points) as avg_points,
        MAX(total_points) as max_points,
        MIN(total_points) as min_points,
        SUM(CASE WHEN current_level = 'Beginner' THEN 1 ELSE 0 END) as beginners,
        SUM(CASE WHEN current_level = 'Intermediate' THEN 1 ELSE 0 END) as intermediates,
        SUM(CASE WHEN current_level = 'Advanced' THEN 1 ELSE 0 END) as advanced,
        SUM(CASE WHEN current_level = 'Master' THEN 1 ELSE 0 END) as masters
      FROM USER_SCORE 
      WHERE total_points > 0
    `);

    const stats = result.recordset[0];

    console.log('✅ Lấy được thống kê xếp hạng');

    res.json({
      success: true,
      data: {
        ...stats,
        avg_points: parseFloat(stats.avg_points?.toFixed(2)) || 0,
        max_points: parseFloat(stats.max_points) || 0,
        min_points: parseFloat(stats.min_points) || 0
      },
      timestamp: new Date().toISOString()
    });

  } catch (err) {
    console.error("❌ Lỗi lấy thống kê xếp hạng:", err);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy thống kê",
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// Lấy top performers theo từng cấp độ
const getTopPerformersByLevel = async (req, res) => {
  const { level } = req.params;
  const validLevels = ['Beginner', 'Intermediate', 'Advanced', 'Master'];

  if (!validLevels.includes(level)) {
    return res.status(400).json({
      success: false,
      message: "Cấp độ không hợp lệ. Chỉ chấp nhận: " + validLevels.join(', ')
    });
  }

  try {
    console.log(`🔄 Đang lấy top performers cho cấp ${level}...`);

    const pool = await sql.connect(dbConfig);
    const result = await pool.request()
      .input('level', sql.VarChar, level)
      .query(`
        SELECT TOP 10
          s.user_id,
          c.full_name,
          c.avatar_url,
          s.total_points,
          s.current_level,
          s.last_updated,
          ROW_NUMBER() OVER (ORDER BY s.total_points DESC) AS rank
        FROM USER_SCORE s
        INNER JOIN CUSTOMER c ON s.user_id = c.user_id
        WHERE s.current_level = @level AND s.total_points > 0
        ORDER BY s.total_points DESC
      `);

    console.log(`✅ Lấy được ${result.recordset.length} top performers cho cấp ${level}`);

    res.json({
      success: true,
      data: result.recordset.map(user => ({
        ...user,
        total_points: parseFloat(user.total_points) || 0
      })),
      level: level,
      total: result.recordset.length,
      timestamp: new Date().toISOString()
    });

  } catch (err) {
    console.error(`❌ Lỗi lấy top performers cho cấp ${level}:`, err);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy top performers",
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

module.exports = {
  getRanking,
  getMyRanking,
  updateUserScore,
  getRankingStats,
  getTopPerformersByLevel
};