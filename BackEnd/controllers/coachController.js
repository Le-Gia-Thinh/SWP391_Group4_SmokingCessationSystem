// controllers/coachController
const { sql, dbConfig } = require('../config/database');

// Cập nhật Google Meet link của coach
exports.updateMeetLink = async (req, res) => {
  try {
    const { meet_link } = req.body;
    const coachId = req.user.id; // req.user.id là user_id

    if (!meet_link) {
      return res.status(400).json({ success: false, message: 'Meet link is required' });
    }

    const pool = await sql.connect(dbConfig);

    // Lấy coach_id từ bảng COACH
    const coachResult = await pool.request()
      .input('user_id', sql.Int, coachId)
      .query('SELECT coach_id FROM COACH WHERE user_id = @user_id');

    if (coachResult.recordset.length === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy Coach' });
    }

    const coach_id = coachResult.recordset[0].coach_id;

    // Cập nhật Google Meet link
    await pool.request()
      .input('link', sql.VarChar, meet_link)
      .input('coach_id', sql.Int, coach_id)
      .query('UPDATE COACH SET google_meet_link = @link WHERE coach_id = @coach_id');

    res.json({ success: true, message: 'Cập nhật Meet link thành công' });
  } catch (error) {
    console.error('❌ Lỗi khi cập nhật Meet link:', error);
    res.status(500).json({ success: false, message: 'Lỗi server khi cập nhật Meet link' });
  }
};

// Lấy danh sách coaches cho member
exports.getAllCoaches = async (req, res) => {
  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool.request()
      .query(`
        SELECT 
          c.user_id, c.full_name, c.email,
          coach.coach_id, coach.specialization, coach.bio, coach.experience_years,
          coach.status AS coach_status, coach.google_meet_link
        FROM CUSTOMER c
        JOIN COACH coach ON c.user_id = coach.user_id
        WHERE coach.status = 'active'
        ORDER BY c.full_name ASC
      `);

    res.json({
      success: true,
      data: result.recordset
    });
  } catch (error) {
    console.error('❌ Lỗi khi lấy danh sách coach:', error);
    res.status(500).json({ success: false, message: 'Lỗi khi lấy danh sách coach' });
  }
};

// Lấy thông tin coach hiện tại
exports.getCurrentCoach = async (req, res) => {
  try {
    const userId = req.user.id;
    const pool = await sql.connect(dbConfig);
    const result = await pool.request()
      .input('user_id', sql.Int, userId)
      .query(`
        SELECT c.user_id, c.full_name, c.email, coach.coach_id, coach.specialization, coach.bio, coach.experience_years, coach.status AS coach_status, coach.google_meet_link
        FROM CUSTOMER c
        JOIN COACH coach ON c.user_id = coach.user_id
        WHERE c.user_id = @user_id
      `);
    if (!result.recordset.length) {
      return res.status(404).json({ success: false, message: 'Coach not found' });
    }
    res.json({ success: true, data: result.recordset[0] });
  } catch (error) {
    console.error('❌ Lỗi khi lấy thông tin coach hiện tại:', error);
    res.status(500).json({ success: false, message: 'Lỗi server khi lấy thông tin coach' });
  }
};
