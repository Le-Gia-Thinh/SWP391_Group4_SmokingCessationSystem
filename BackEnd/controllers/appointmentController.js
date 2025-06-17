// controllers/appointmentController.js
const { sql, dbConfig } = require('../config/database');

// Member đặt lịch
exports.bookAppointment = async (req, res) => {
  try {
    const userId = req.user.user_id;
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

    await pool.request()
      .input('user_id', sql.Int, userId)
      .input('coach_id', sql.Int, coachId)
      .input('schedule_id', sql.Int, schedule_id)
      .input('scheduled_time', sql.DateTime, scheduledTime)
      .query(`
        INSERT INTO COACHING_SESSION (user_id, coach_id, schedule_id, scheduled_time)
        VALUES (@user_id, @coach_id, @schedule_id, @scheduled_time)
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
    const sessionId = req.params.id;

    const pool = await sql.connect(dbConfig);

    // Kiểm tra quyền sở hữu
    const check = await pool.request()
      .input('id', sql.Int, sessionId)
      .query('SELECT * FROM COACHING_SESSION WHERE session_id = @id');

    if (!check.recordset.length || check.recordset[0].coach_id !== coachId) {
      return res.status(403).json({ message: 'Không có quyền duyệt phiên này' });
    }

    // Lấy link cố định
    const linkQuery = await pool.request()
      .input('id', sql.Int, coachId)
      .query('SELECT google_meet_link FROM COACH WHERE coach_id = @id');

    const meetLink = linkQuery.recordset[0]?.google_meet_link;

    await pool.request()
      .input('id', sql.Int, sessionId)
      .input('link', sql.VarChar, meetLink)
      .query(`
        UPDATE COACHING_SESSION
        SET session_status = 'accepted', google_meet_link = @link, updated_at = GETDATE()
        WHERE session_id = @id
      `);

    // Gửi thông báo
    await pool.request()
      .input('session_id', sql.Int, sessionId)
      .input('content', sql.NVarChar, `Lịch hẹn đã được duyệt. Link Meet: ${meetLink}`)
      .query(`INSERT INTO COACHING_MESSAGE (session_id, content, sent_at, is_read) VALUES (@session_id, @content, GETDATE(), 0)`);

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
    const sessionId = req.params.id;
    const pool = await sql.connect(dbConfig);

    const check = await pool.request()
      .input('id', sql.Int, sessionId)
      .query('SELECT * FROM COACHING_SESSION WHERE session_id = @id');

    if (!check.recordset.length || check.recordset[0].coach_id !== coachId) {
      return res.status(403).json({ message: 'Không có quyền từ chối phiên này' });
    }

    await pool.request()
      .input('id', sql.Int, sessionId)
      .query(`UPDATE COACHING_SESSION SET session_status = 'rejected', updated_at = GETDATE() WHERE session_id = @id`);

    await pool.request()
      .input('session_id', sql.Int, sessionId)
      .input('content', sql.NVarChar, 'Lịch hẹn đã bị từ chối. Vui lòng chọn thời gian khác.')
      .query(`INSERT INTO COACHING_MESSAGE (session_id, content, sent_at, is_read) VALUES (@session_id, @content, GETDATE(), 0)`);

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
      .query(`UPDATE COACHING_SESSION SET session_status = 'canceled_by_member', updated_at = GETDATE() WHERE session_id = @id`);

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
    const userId = req.user.user_id;
    const pool = await sql.connect(dbConfig);

    const result = await pool.request()
      .input('user_id', sql.Int, userId)
      .query(`
        SELECT 
          cs.session_id, cs.scheduled_time, cs.session_status, cs.google_meet_link,
          c.full_name AS coach_name, c.email AS coach_email
        FROM COACHING_SESSION cs
        JOIN CUSTOMER c ON cs.coach_id = c.user_id
        WHERE cs.user_id = @user_id
        ORDER BY cs.scheduled_time DESC
      `);

    res.status(200).json({ success: true, data: result.recordset });
  } catch (error) {
    console.error('❌ Lỗi khi lấy lịch của member:', error);
    res.status(500).json({ success: false, message: 'Lỗi server khi lấy lịch đã đặt' });
  }
};