// controllers/achievementController.js
const { sql, dbConfig } = require("../config/database");

// GET tất cả
exports.getAllAchievements = async (req, res) => {
  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool.request().query(`
      SELECT achievement_id, title, description, badge_image,
             achievement_type, difficulty_level, phase
      FROM ACHIEVEMENT
      ORDER BY phase, difficulty_level
    `);
    res.json(result.recordset);
  } catch (err) {
    console.error("Error fetching achievements:", err);
    res.status(500).json({ message: "Lỗi khi lấy dữ liệu thành tựu." });
  }
};

// GET unlocked (cần login)
exports.getUnlockedAchievements = async (req, res) => {
  const userId = req.user.id;
  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool.request()
      .input("user_id", sql.Int, userId)
      .query(`
        SELECT a.*, ISNULL(ua.earned_date, NULL) AS earned_date,
               ISNULL(ua.is_shared, 0) AS is_shared,
               CASE WHEN ua.user_id IS NOT NULL THEN 1 ELSE 0 END AS unlocked
        FROM ACHIEVEMENT a
        LEFT JOIN USER_ACHIEVEMENT ua
          ON a.achievement_id = ua.achievement_id
          AND ua.user_id = @user_id
        ORDER BY a.achievement_id
      `);
    // convert unlocked từ 0/1 thành boolean
    const list = result.recordset.map(r => ({
      ...r,
      unlocked: r.unlocked === 1
    }));
    res.json(list);
  } catch (err) {
    console.error("Error fetching unlocked achievements:", err);
    res.status(500).json({ message: "Lỗi lấy danh sách thành tựu." });
  }
};

// GET chi tiết theo id
exports.getAchievementById = async (req, res) => {
  const id = parseInt(req.params.id, 10);
  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool.request()
      .input("id", sql.Int, id)
      .query(`
        SELECT achievement_id, title, description, badge_image,
               achievement_type, difficulty_level, phase, check_code
        FROM ACHIEVEMENT
        WHERE achievement_id = @id
      `);
    if (result.recordset.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy thành tựu." });
    }
    res.json(result.recordset[0]);
  } catch (err) {
    console.error("Error fetching achievement by id:", err);
    res.status(500).json({ message: "Lỗi server." });
  }
};

// CREATE mới
exports.createAchievement = async (req, res) => {
  let {
    title,
    description,
    badge_image,
    achievement_type,
    difficulty_level,
    phase,
    check_code
  } = req.body;

  // nếu badge_image rỗng hoặc chỉ khoảng trắng → để null
  badge_image = badge_image?.trim() || null;

  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool.request()
      .input("title", sql.NVarChar, title)
      .input("description", sql.NVarChar, description)
      .input("badge_image", sql.NVarChar, badge_image)
      .input("achievement_type", sql.NVarChar, achievement_type)
      .input("difficulty_level", sql.Int, difficulty_level)
      .input("phase", sql.Int, phase)
      .input("check_code", sql.NVarChar, check_code)
      .query(`
        INSERT INTO ACHIEVEMENT
          (title, description, badge_image, achievement_type,
           difficulty_level, phase, check_code)
        VALUES
          (@title, @description, @badge_image, @achievement_type,
           @difficulty_level, @phase, @check_code);
        SELECT SCOPE_IDENTITY() AS achievement_id;
      `);
    res.status(201).json({ achievement_id: result.recordset[0].achievement_id });
  } catch (err) {
    console.error("Error creating achievement:", err);
    res.status(500).json({ message: "Lỗi khi tạo thành tựu." });
  }
};

// UPDATE
exports.updateAchievement = async (req, res) => {
  const id = parseInt(req.params.id, 10);
  let {
    title,
    description,
    badge_image,
    achievement_type,
    difficulty_level,
    phase,
    check_code
  } = req.body;

  // xử lý badge_image tương tự
  badge_image = badge_image?.trim() || null;

  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool.request()
      .input("id", sql.Int, id)
      .input("title", sql.NVarChar, title)
      .input("description", sql.NVarChar, description)
      .input("badge_image", sql.NVarChar, badge_image)
      .input("achievement_type", sql.NVarChar, achievement_type)
      .input("difficulty_level", sql.Int, difficulty_level)
      .input("phase", sql.Int, phase)
      .input("check_code", sql.NVarChar, check_code)
      .query(`
        UPDATE ACHIEVEMENT
        SET title=@title,
            description=@description,
            badge_image=@badge_image,
            achievement_type=@achievement_type,
            difficulty_level=@difficulty_level,
            phase=@phase,
            check_code=@check_code
        WHERE achievement_id=@id
      `);
    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ message: "Không tìm thấy thành tựu." });
    }
    res.json({ message: "Cập nhật thành tựu thành công." });
  } catch (err) {
    console.error("Error updating achievement:", err);
    res.status(500).json({ message: "Lỗi khi cập nhật thành tựu." });
  }
};

// DELETE
exports.deleteAchievement = async (req, res) => {
  const id = parseInt(req.params.id, 10);
  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool.request()
      .input("id", sql.Int, id)
      .query(`
        DELETE FROM ACHIEVEMENT
        WHERE achievement_id=@id
      `);
    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ message: "Không tìm thấy thành tựu." });
    }
    res.json({ message: "Xóa thành tựu thành công." });
  } catch (err) {
    console.error("Error deleting achievement:", err);
    res.status(500).json({ message: "Lỗi khi xóa thành tựu." });
  }
};
