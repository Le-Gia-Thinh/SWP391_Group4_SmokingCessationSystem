// controllers/appointmentController.js
const { sql, dbConfig } = require('../config/database');

// Member đặt lịch
exports.bookAppointment = async (req, res) => {
  try {
    const userId = req.user.id;
    const { schedule_id } = req.body;

    const pool = await sql.connect(dbConfig);
    const slot = await pool.request()
      .input('id', sql.Int, schedule_id)
      .query(`SELECT * FROM COACH_SCHEDULE WHERE schedule_id = @id AND is_booked = 0`);

    if (!slot.recordset.length) {
      return res.status(400).json({ success: false, message: 'Lịch đã được đặt' });
    }

    const coachId = slot.recordset[0].coach_id;
    const scheduledTime = slot.recordset[0].start_time;
    const endTime = slot.recordset[0].end_time;

    // Calculate duration in minutes
    const durationMinutes = (new Date(endTime).getTime() - new Date(scheduledTime).getTime()) / (1000 * 60);

    await pool.request()
      .input('user_id', sql.Int, userId)
      .input('coach_id', sql.Int, coachId)
      .input('schedule_id', sql.Int, schedule_id)
      .input('scheduled_time', sql.DateTime, scheduledTime)
      .input('duration_minutes', sql.Int, durationMinutes)
      .input('session_status', sql.VarChar, 'pending')
      .query(`
        INSERT INTO COACHING_SESSION (user_id, coach_id, schedule_id, scheduled_time, duration_minutes, session_status)
        VALUES (@user_id, @coach_id, @schedule_id, @scheduled_time, @duration_minutes, @session_status)
      `);

    await pool.request().input('id', sql.Int, schedule_id).query(`UPDATE COACH_SCHEDULE SET is_booked = 1 WHERE schedule_id = @id`);

    res.status(201).json({ success: true, message: 'Đặt lịch thành công' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// Coach duyệt lịch
exports.acceptAppointment = async (req, res) => {
  try {
    const coachId = req.user.coach_id;
    const actualCoachId = (coachId === 0 || coachId === undefined) ? null : coachId;
    const sessionId = req.params.id;

    const pool = await sql.connect(dbConfig);

    // Kiểm tra quyền sở hữu
    const check = await pool.request()
      .input('id', sql.Int, sessionId)
      .query('SELECT user_id, coach_id FROM COACHING_SESSION WHERE session_id = @id');

    if (!check.recordset.length || check.recordset[0].coach_id !== actualCoachId) {
      return res.status(403).json({ message: 'Không có quyền duyệt phiên này' });
    }

    const memberUserId = check.recordset[0].user_id;
    const actualMemberUserId = memberUserId === 0 ? null : memberUserId;

    // Lấy link cố định
    const linkQuery = await pool.request()
      .input('id', sql.Int, actualCoachId)
      .query('SELECT google_meet_link FROM COACH WHERE coach_id = @id');

    const meetLink = linkQuery.recordset[0]?.google_meet_link || null;

    await pool.request()
      .input('id', sql.Int, sessionId)
      .input('link', sql.VarChar, meetLink)
      .query(`
        UPDATE COACHING_SESSION
        SET session_status = 'accepted', google_meet_link = @link
        WHERE session_id = @id
      `);

    // Gửi thông báo
    await pool.request()
      .input('session_id', sql.Int, sessionId)
      .input('user_id', sql.Int, actualMemberUserId)
      .input('coach_id', sql.Int, actualCoachId)
      .input('content', sql.NVarChar, `Lịch hẹn đã được duyệt. Link Meet: ${meetLink}`)
      .query(`INSERT INTO COACHING_MESSAGE (session_id, user_id, coach_id, content, sent_at, is_read) VALUES (@session_id, @user_id, @coach_id, @content, GETDATE(), 0)`);

    res.json({ success: true, message: 'Đã duyệt lịch hẹn và gửi link Meet' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// Coach từ chối lịch
exports.rejectAppointment = async (req, res) => {
  try {
    const coachId = req.user.coach_id;
    const actualCoachId = (coachId === 0 || coachId === undefined) ? null : coachId;
    const sessionId = req.params.id;

    console.log('DEBUG: In rejectAppointment');
    console.log('DEBUG: actualCoachId from token:', actualCoachId);
    console.log('DEBUG: sessionId from params:', sessionId);

    const pool = await sql.connect(dbConfig);

    const check = await pool.request()
      .input('id', sql.Int, sessionId)
      .query('SELECT user_id, coach_id FROM COACHING_SESSION WHERE session_id = @id');

    console.log('DEBUG: check.recordset:', check.recordset);

    if (!check.recordset.length || check.recordset[0].coach_id !== actualCoachId) {
      return res.status(403).json({ message: 'Không có quyền từ chối phiên này' });
    }

    const memberUserId = check.recordset[0].user_id;
    const actualMemberUserId = memberUserId === 0 ? null : memberUserId;

    await pool.request()
      .input('id', sql.Int, sessionId)
      .query(`UPDATE COACHING_SESSION SET session_status = 'rejected' WHERE session_id = @id`);

    await pool.request()
      .input('session_id', sql.Int, sessionId)
      .input('user_id', sql.Int, actualMemberUserId)
      .input('coach_id', sql.Int, actualCoachId)
      .input('content', sql.NVarChar, 'Lịch hẹn đã bị từ chối. Vui lòng chọn thời gian khác.')
      .query(`INSERT INTO COACHING_MESSAGE (session_id, user_id, coach_id, content, sent_at, is_read) VALUES (@session_id, @user_id, @coach_id, @content, GETDATE(), 0)`);

    res.json({ success: true, message: 'Đã từ chối lịch hẹn' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// Coach xem lịch chờ duyệt
exports.getPendingAppointments = async (req, res) => {
  try {
    const coachId = req.user.coach_id;
    const pool = await sql.connect(dbConfig);
    const result = await pool.request()
      .input('coach_id', sql.Int, coachId)
      .query(`SELECT * FROM COACHING_SESSION WHERE coach_id = @coach_id AND session_status = 'pending'`);

    res.json(result.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// Member hủy lịch
exports.cancelAppointment = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const sessionId = req.params.id;
    const pool = await sql.connect(dbConfig);

    const check = await pool.request()
      .input('id', sql.Int, sessionId)
      .query('SELECT * FROM COACHING_SESSION WHERE session_id = @id');

    const session = check.recordset[0];
    if (!session || session.user_id !== userId) {
      return res.status(403).json({ message: 'Không có quyền huỷ phiên này' });
    }

    await pool.request()
      .input('id', sql.Int, sessionId)
      .query(`UPDATE COACHING_SESSION SET session_status = 'canceled_by_member' WHERE session_id = @id`);

    await pool.request()
      .input('id', sql.Int, session.schedule_id)
      .query(`UPDATE COACH_SCHEDULE SET is_booked = 0 WHERE schedule_id = @id`);

    await pool.request()
      .input('session_id', sql.Int, sessionId)
      .input('content', sql.NVarChar, 'Thành viên đã huỷ lịch hẹn.')
      .query(`INSERT INTO COACHING_MESSAGE (session_id, content, sent_at, is_read) VALUES (@session_id, @content, GETDATE(), 0)`);

    res.json({ success: true, message: 'Đã huỷ lịch hẹn' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// Member xem các lịch đã đặt
exports.getMyAppointments = async (req, res) => {
  try {
    const userId = req.user.id;
    // console.log('DEBUG: In getMyAppointments (Member View)');
    // console.log('DEBUG: userId from token:', userId);

    const pool = await sql.connect(dbConfig);

    const result = await pool.request()
      .input('user_id', sql.Int, userId)
      .query(`
        SELECT 
          cs.session_id, cs.scheduled_time, cs.session_status, cs.google_meet_link,
          c.full_name AS coach_name, c.email AS coach_email
        FROM COACHING_SESSION cs
        JOIN COACH ch ON cs.coach_id = ch.coach_id
        JOIN CUSTOMER c ON ch.user_id = c.user_id
        WHERE cs.user_id = @user_id
        ORDER BY cs.scheduled_time DESC
      `);

    // console.log('DEBUG: result.recordset from DB for Member View:', result.recordset);

    res.status(200).json({ success: true, data: result.recordset });
  } catch (error) {
    console.error('❌ Lỗi khi lấy lịch của member:', error);
    res.status(500).json({ success: false, message: 'Lỗi server khi lấy lịch đã đặt' });
  }
};

// Coach xem tất cả lịch của mình (đã đặt và còn trống)
exports.getCoachAllSchedules = async (req, res) => {
  try {
    const coachId = req.user.coach_id; // Lấy coach_id từ thông tin người dùng đã xác thực
    const pool = await sql.connect(dbConfig);
    const result = await pool.request()
      .input('coach_id', sql.Int, coachId)
      .query(`SELECT * FROM COACH_SCHEDULE WHERE coach_id = @coach_id ORDER BY start_time DESC`);

    res.json(result.recordset);
  } catch (err) {
    console.error('❌ Lỗi khi lấy lịch của coach:', err);
    res.status(500).json({ success: false, message: 'Lỗi server khi lấy lịch của coach' });
  }
};

// Coach xem tất cả các phiên coaching của mình (đã đặt, đã duyệt, đã hủy, ...)
exports.getCoachAllAppointments = async (req, res) => {
  try {
    const coachId = req.user.coach_id; // Lấy coach_id từ thông tin người dùng đã xác thực
    console.log('DEBUG: In getCoachAllAppointments');
    console.log('DEBUG: coachId from token:', coachId);

    const pool = await sql.connect(dbConfig);
    const result = await pool.request()
      .input('coach_id', sql.Int, coachId)
      .query(`
        SELECT 
          cs.session_id, cs.scheduled_time, cs.session_status, cs.google_meet_link,
          c.full_name AS member_name, c.email AS member_email, c.user_id as member_user_id
        FROM COACHING_SESSION cs
        LEFT JOIN CUSTOMER c ON cs.user_id = c.user_id
        WHERE cs.coach_id = @coach_id
        ORDER BY cs.scheduled_time DESC
      `);

    console.log('DEBUG: result.recordset from DB:', result.recordset);

    res.status(200).json({ success: true, data: result.recordset });
  } catch (error) {
    console.error('❌ Error fetching all coach appointments:', error);
    res.status(500).json({ success: false, message: 'Server error when fetching all coach appointments' });
  }
};