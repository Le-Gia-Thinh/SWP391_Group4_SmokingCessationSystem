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