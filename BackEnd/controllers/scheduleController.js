// controllers/scheduleController.js
const { sql, dbConfig } = require('../config/database');

// 1. Coach tạo lịch rảnh
exports.createSchedule = async (req, res) => {
  try {
    const coachId = req.user.coach_id;
    const { start_time, end_time } = req.body;

    const pool = await sql.connect(dbConfig);
    await pool.request()
      .input('coach_id', sql.Int, coachId)
      .input('start_time', sql.DateTime, start_time)
      .input('end_time', sql.DateTime, end_time)
      .query(`
        INSERT INTO COACH_SCHEDULE (coach_id, start_time, end_time)
        VALUES (@coach_id, @start_time, @end_time)
      `);

    res.status(201).json({ success: true, message: 'Lịch đã tạo thành công' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// 2. Member xem lịch trống
exports.getAvailableSchedules = async (req, res) => {
  try {
    const coachId = req.params.coachId;
    const pool = await sql.connect(dbConfig);
    const result = await pool.request()
      .input('coach_id', sql.Int, coachId)
      .query(`SELECT * FROM COACH_SCHEDULE WHERE coach_id = @coach_id AND is_booked = 0`);
    res.json(result.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// 3. Coach xóa lịch (chỉ lịch chưa được đặt)
exports.deleteSchedule = async (req, res) => {
  try {
    const coachId = req.user.coach_id;
    const scheduleId = req.params.scheduleId;

    const pool = await sql.connect(dbConfig);

    // Kiểm tra lịch có tồn tại và thuộc về coach này không
    const checkResult = await pool.request()
      .input('schedule_id', sql.Int, scheduleId)
      .input('coach_id', sql.Int, coachId)
      .query(`SELECT * FROM COACH_SCHEDULE WHERE schedule_id = @schedule_id AND coach_id = @coach_id`);

    if (checkResult.recordset.length === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy lịch hoặc không có quyền xóa' });
    }

    const schedule = checkResult.recordset[0];

    // Chỉ cho phép xóa lịch chưa được đặt
    if (schedule.is_booked === 1) {
      return res.status(400).json({ success: false, message: 'Không thể xóa lịch đã được đặt' });
    }

    // Xóa lịch
    await pool.request()
      .input('schedule_id', sql.Int, scheduleId)
      .query(`DELETE FROM COACH_SCHEDULE WHERE schedule_id = @schedule_id`);

    res.json({ success: true, message: 'Đã xóa lịch thành công' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Lỗi server khi xóa lịch' });
  }
};