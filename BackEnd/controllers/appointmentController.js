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
    const userId = req.user.id;
    const sessionId = req.params.id;
    const pool = await sql.connect(dbConfig);

    // 1. Lấy thông tin phiên để kiểm tra quyền và thời gian
    const check = await pool.request()
      .input('id', sql.Int, sessionId)
      .query('SELECT * FROM COACHING_SESSION WHERE session_id = @id');

    const session = check.recordset[0];
    if (!session || session.user_id !== userId) {
      return res.status(403).json({ message: 'Không có quyền huỷ phiên này' });
    }

    // 2. Cập nhật trạng thái coaching session
    await pool.request()
      .input('id', sql.Int, sessionId)
      .query(`UPDATE COACHING_SESSION SET session_status = 'canceled_by_member' WHERE session_id = @id`);

    // 3. Nếu có schedule_id thì cập nhật lịch
    if (session.schedule_id) {
      const now = new Date();
      const scheduledTime = new Date(session.scheduled_time);
      const isEarlyCancel = now < new Date(scheduledTime.getTime() - 2 * 60 * 60 * 1000); // Trước 2 tiếng

      await pool.request()
        .input('id', sql.Int, session.schedule_id)
        .query(`
          UPDATE COACH_SCHEDULE 
          SET is_booked = 0, status = '${isEarlyCancel ? 'available' : 'cancelled'}'
          WHERE schedule_id = @id
        `);
    }

    // 4. Gửi tin nhắn thông báo
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

// Coach submit sau khi kết thúc buổi tư vấn
exports.completeAppointment = async (req, res) => {
  try {
    const coachId = req.user.coach_id;
    const sessionId = req.params.id;
    const { notes } = req.body;

    const pool = await sql.connect(dbConfig);

    // Kiểm tra quyền
    const check = await pool.request()
      .input('id', sql.Int, sessionId)
      .query('SELECT coach_id FROM COACHING_SESSION WHERE session_id = @id');

    if (!check.recordset.length || check.recordset[0].coach_id !== coachId) {
      return res.status(403).json({ message: 'Không có quyền hoàn thành phiên này' });
    }

    await pool.request()
      .input('id', sql.Int, sessionId)
      .input('notes', sql.NVarChar, notes || 'Cuộc họp đã hoàn tất')
      .query(`
        UPDATE COACHING_SESSION
        SET session_status = 'completed', session_notes = @notes
        WHERE session_id = @id
      `);

    res.json({ success: true, message: 'Đã hoàn thành phiên coaching' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi khi hoàn tất phiên coaching' });
  }
};

// Coach báo cáo Member không tham gia buổi tư vấn
exports.reportMissingMember = async (req, res) => {
  const coachId = req.user.coach_id;
  const sessionId = req.params.id;
  const { reason } = req.body;

  const pool = await sql.connect(dbConfig);

  // Kiểm tra quyền sở hữu
  const check = await pool.request()
    .input('id', sql.Int, sessionId)
    .query('SELECT coach_id, scheduled_time FROM COACHING_SESSION WHERE session_id = @id');

  const session = check.recordset[0];
  const now = new Date();

  if (!session || session.coach_id !== coachId) {
    return res.status(403).json({ message: 'Không có quyền' });
  }

  const minAllowedReportTime = new Date(session.scheduled_time.getTime() + 15 * 60000);
  if (now < minAllowedReportTime) {
    return res.status(400).json({ message: 'Chỉ được báo cáo sau 15 phút kể từ giờ hẹn' });
  }

  await pool.request()
    .input('id', sql.Int, sessionId)
    .input('reason', sql.NVarChar, reason)
    .query(`
      UPDATE COACHING_SESSION
      SET session_status = 'completed', session_notes = @reason
      WHERE session_id = @id
    `);

  res.json({ success: true, message: 'Đã lưu lý do member không tham dự' });
};

// Member tố cáo Coach vắng mặt
exports.reportMissingCoach = async (req, res) => {
  const userId = req.user.id;
  const { session_id, reason } = req.body;

  const pool = await sql.connect(dbConfig);

  await pool.request()
    .input('user_id', sql.Int, userId)
    .input('rating', sql.Int, 1)
    .input('content', sql.NVarChar, `[Session ${session_id}] ${reason}`)
    .input('feedback_type', sql.VarChar, 'coach')
    .input('submitted_at', sql.DateTime, new Date())
    .query(`
      INSERT INTO FEEDBACK (user_id, rating, content, feedback_type, submitted_at)
      VALUES (@user_id, @rating, @content, @feedback_type, @submitted_at)
    `);

  res.json({ success: true, message: 'Đã gửi phản hồi về việc coach vắng mặt' });
};
