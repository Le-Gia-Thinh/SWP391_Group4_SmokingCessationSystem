// controllers/adminController.js
const { sql, dbConfig } = require('../config/database');
const bcrypt = require('bcrypt');
const sendCoachCredentials = require('../utils/sendCoachCredentials');
const defaultPassword = 'T123456';

// 1. Tạo Coach mới
exports.createCoachAccount = async (req, res) => {
  try {
    const {
      username, full_name, email, phone_number, date_of_birth, google_meet_link
    } = req.body;

    const password_hash = await bcrypt.hash(defaultPassword, 10);
    const pool = await sql.connect(dbConfig);

    // Thêm vào Customer
    const customerResult = await pool.request()
      .input('username', sql.NVarChar, username)
      .input('full_name', sql.NVarChar, full_name)
      .input('email', sql.VarChar, email)
      .input('phone_number', sql.VarChar, phone_number)
      .input('date_of_birth', sql.Date, date_of_birth)
      .input('registration_date', sql.Date, new Date())
      .input('user_role', sql.NVarChar, 'coach')
      .input('account_status', sql.NVarChar, 'active')
      .input('password_hash', sql.VarChar, password_hash)
      .input('login_provider', sql.NVarChar, 'local')
      .input('google_id', sql.VarChar, null)
      .query(`
        INSERT INTO CUSTOMER (username, full_name, email, phone_number, date_of_birth,
          registration_date, user_role, account_status, password_hash, login_provider, google_id)
        OUTPUT INSERTED.user_id, INSERTED.username, INSERTED.full_name, INSERTED.email
        VALUES (@username, @full_name, @email, @phone_number, @date_of_birth,
          @registration_date, @user_role, @account_status, @password_hash, @login_provider, @google_id)
      `);

    const user = customerResult.recordset[0];

    // Thêm vào COACH
    await pool.request()
      .input('user_id', sql.Int, user.user_id)
      .input('google_meet_link', sql.NVarChar, google_meet_link)
      .query(`
        INSERT INTO COACH (user_id, google_meet_link)
        VALUES (@user_id, @google_meet_link)
      `);

    await sendCoachCredentials({
      to: user.email,
      name: user.full_name,
      email: user.email,
      password: defaultPassword
    });

    return res.status(201).json({
      success: true,
      message: 'Tạo tài khoản coach thành công',
      data: user
    });

  } catch (error) {
    console.error('❌ Lỗi khi tạo coach:', error);
    res.status(500).json({ success: false, message: 'Tạo coach thất bại' });
  }
};

// 2. Lấy danh sách Coach
exports.getAllCoaches = async (req, res) => {
  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool.request().query(`
      SELECT 
        c.user_id, c.username, c.full_name, c.email, c.phone_number, c.account_status,
        coach.coach_id, coach.specialization, coach.bio, coach.experience_years,
        coach.status AS coach_status, coach.google_meet_link,
        (SELECT COUNT(*) FROM COACH_SCHEDULE s WHERE s.coach_id = coach.coach_id) AS scheduleCount
      FROM CUSTOMER c
      JOIN COACH coach ON c.user_id = coach.user_id
    `);

    return res.status(200).json({
      success: true,
      data: result.recordset
    });

  } catch (error) {
    console.error('❌ Lỗi khi lấy danh sách coach:', error);
    res.status(500).json({ success: false, message: 'Lỗi khi lấy danh sách coach' });
  }
};

// 3. Cập nhật thông tin Coach
exports.updateCoachInfo = async (req, res) => {
  try {
    const coachId = req.params.coach_id;
    const {
      full_name, phone_number, account_status, specialization, bio,
      experience_years, google_meet_link, coach_status
    } = req.body;

    const pool = await sql.connect(dbConfig);

    // Cập nhật thông tin trong CUSTOMER
    await pool.request()
      .input('coach_id', sql.Int, coachId)
      .input('full_name', sql.NVarChar, full_name)
      .input('phone_number', sql.VarChar, phone_number)
      .input('account_status', sql.NVarChar, account_status)
      .query(`
        UPDATE CUSTOMER 
        SET full_name = @full_name, phone_number = @phone_number, account_status = @account_status
        WHERE user_id = (SELECT user_id FROM COACH WHERE coach_id = @coach_id)
      `);

    // Cập nhật thông tin trong COACH
    await pool.request()
      .input('coach_id', sql.Int, coachId)
      .input('specialization', sql.NVarChar, specialization)
      .input('bio', sql.NText, bio)
      .input('experience_years', sql.Int, experience_years)
      .input('google_meet_link', sql.NVarChar, google_meet_link)
      .input('status', sql.NVarChar, coach_status)
      .query(`
        UPDATE COACH 
        SET specialization = @specialization, bio = @bio, experience_years = @experience_years,
            google_meet_link = @google_meet_link, status = @status
        WHERE coach_id = @coach_id
      `);

    return res.status(200).json({
      success: true,
      message: 'Cập nhật thông tin coach thành công'
    });

  } catch (error) {
    console.error('❌ Lỗi khi cập nhật coach:', error);
    res.status(500).json({ success: false, message: 'Cập nhật coach thất bại' });
  }
};

// 4. Xóa Coach (soft delete)
exports.deleteCoach = async (req, res) => {
  try {
    const coachId = req.params.coach_id;
    const pool = await sql.connect(dbConfig);

    // Soft delete - cập nhật trạng thái thành inactive
    await pool.request()
      .input('coach_id', sql.Int, coachId)
      .query(`
        UPDATE CUSTOMER 
        SET account_status = 'inactive'
        WHERE user_id = (SELECT user_id FROM COACH WHERE coach_id = @coach_id)
      `);

    return res.status(200).json({
      success: true,
      message: 'Xóa coach thành công'
    });

  } catch (error) {
    console.error('❌ Lỗi khi xóa coach:', error);
    res.status(500).json({ success: false, message: 'Xóa coach thất bại' });
  }
};

// 5. Khôi phục Coach
exports.restoreCoach = async (req, res) => {
  try {
    const coachId = req.params.coach_id;
    const pool = await sql.connect(dbConfig);

    // Khôi phục - cập nhật trạng thái thành active
    await pool.request()
      .input('coach_id', sql.Int, coachId)
      .query(`
        UPDATE CUSTOMER 
        SET account_status = 'active'
        WHERE user_id = (SELECT user_id FROM COACH WHERE coach_id = @coach_id)
      `);

    return res.status(200).json({
      success: true,
      message: 'Khôi phục coach thành công'
    });

  } catch (error) {
    console.error('❌ Lỗi khi khôi phục coach:', error);
    res.status(500).json({ success: false, message: 'Khôi phục coach thất bại' });
  }
};

// Admin xem tất cả feedback Member report Coach 
exports.getCoachViolations = async (req, res) => {
  try {
    const pool = await sql.connect(dbConfig);

    const result = await pool.request().query(`
      SELECT f.feedback_id, f.user_id, c.full_name AS reporter_name, f.content, f.submitted_at
      FROM FEEDBACK f
      JOIN CUSTOMER c ON f.user_id = c.user_id
      WHERE f.feedback_type = 'coach'
      ORDER BY f.submitted_at DESC
    `);

    res.json({ success: true, data: result.recordset });
  } catch (err) {
    console.error('Lỗi khi lấy danh sách tố cáo coach:', err);
    res.status(500).json({ message: 'Lỗi khi lấy dữ liệu' });
  }
};

// Admin xem tất cả feedback Coach báo cáo Member vắng mặt
exports.getMemberNoShowReports = async (req, res) => {
  try {
    const pool = await sql.connect(dbConfig);

    const result = await pool.request().query(`
      SELECT cs.session_id, cs.user_id, cu.full_name AS member_name, cs.coach_id,
             coach.full_name AS coach_name, cs.session_notes, cs.scheduled_time
      FROM COACHING_SESSION cs
      JOIN CUSTOMER cu ON cs.user_id = cu.user_id
      JOIN COACH ch ON cs.coach_id = ch.coach_id
      JOIN CUSTOMER coach ON ch.user_id = coach.user_id
      WHERE cs.session_notes IS NOT NULL
        AND cs.session_status = 'completed'
        AND cs.session_notes LIKE N'%vắng%' -- có thể kiểm tra keyword
      ORDER BY cs.scheduled_time DESC
    `);

    res.json({ success: true, data: result.recordset });
  } catch (err) {
    console.error('Lỗi khi lấy báo cáo member vắng mặt:', err);
    res.status(500).json({ message: 'Lỗi khi truy vấn dữ liệu' });
  }
};

// 6. Thống kê danh thi từ gói member
// 7. Thống kê Member: (số lượng member đang thực hiện kế hoạch, số member hoàn thành cai nghiện, số )