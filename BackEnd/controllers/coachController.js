// controllers/coachController
const bcrypt = require('bcryptjs');
const { sql, dbConfig } = require('../config/database');

// 1. Admin tạo account Coach mới
exports.createCoachAccount = async (req, res) => {
  res.status(501).json({ message: 'Chức năng đang phát triển' });
};








// Cập nhật Google Meet link của coach
exports.updateMeetLink = async (req, res) => {
  try {
    const coachId = req.user.id; // req.user.id là user_id
    const { meet_link } = req.body;

    if (!meet_link || !meet_link.startsWith('http')) {
      return res.status(400).json({ success: false, message: 'Link Meet không hợp lệ' });
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

    await pool.request()
      .input('link', sql.VarChar(255), meet_link)
      .input('coach_id', sql.Int, coach_id)
      .query('UPDATE COACH SET google_meet_link = @link WHERE coach_id = @coach_id');

    res.json({ success: true, message: 'Cập nhật Google Meet link thành công' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Lỗi server khi cập nhật Meet link' });
  }
};
