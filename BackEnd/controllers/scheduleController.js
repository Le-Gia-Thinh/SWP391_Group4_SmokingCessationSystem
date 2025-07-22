// controllers/scheduleController.js
const { sql, dbConfig } = require('../config/database');
const moment = require('moment-timezone');

// Cấu hình timezone mặc định (có thể thay đổi theo môi trường)
const DEFAULT_TIMEZONE = process.env.TIMEZONE || 'Asia/Ho_Chi_Minh';

//Helper: Parse string 'YYYY-MM-DDTHH:mm:ss' thành Date object với giờ local (UTC+7)
function parseVietnamTime(str) {
  const [date, time] = str.split('T');
  const [year, month, day] = date.split('-').map(Number);
  const [hour, minute, second] = time.split(':').map(Number);
  return new Date(year, month - 1, day, hour, minute, second);
}

// 1 Admin tạo lịch hàng loạt cho coach
exports.createBulkSchedules = async (req, res) => {
  try {
    const { coach_id, schedules, pattern } = req.body;

    // DEBUG: Log dữ liệu nhận được từ frontend
    console.log("=== DEBUG BACKEND NHẬN DỮ LIỆU ===");
    console.log("Request body:", JSON.stringify(req.body, null, 2));
    console.log("Pattern:", pattern);
    console.log("Schedules:", schedules);
    console.log("Coach ID:", coach_id);
    console.log("==================================");

    // Validate input
    if (!coach_id || (!schedules && !pattern)) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin coach_id hoặc schedules/pattern'
      });
    }

    const pool = await sql.connect(dbConfig);

    // Check if coach exists
    const coachCheck = await pool.request()
      .input('coach_id', sql.Int, coach_id)
      .query('SELECT coach_id FROM COACH WHERE coach_id = @coach_id');

    if (coachCheck.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy coach'
      });
    }

    let createdCount = 0;
    let slotCount = 0;
    const MAX_SLOTS = 200;
    const slotInserts = [];
    const slotConflicts = [];
    const slotInvalids = [];

    // Helper: check overlap
    async function isOverlap(coach_id, start_time, end_time) {
      const overlap = await pool.request()
        .input('coach_id', sql.Int, coach_id)
        .input('start_time', sql.DateTime, start_time)
        .input('end_time', sql.DateTime, end_time)
        .query(`SELECT 1 FROM COACH_SCHEDULE WHERE coach_id = @coach_id AND ((@start_time < end_time) AND (@end_time > start_time))`);
      return overlap.recordset.length > 0;
    }

    // If pattern is provided, generate schedules based on pattern
    if (pattern) {
      const {
        startDate,
        endDate,
        startTime,
        endTime,
        daysOfWeek, // [1,2,3,4,5] for Monday to Friday
        duration = 60 // minutes
      } = pattern;

      // DEBUG: Log pattern details
      console.log("=== DEBUG PATTERN DETAILS ===");
      console.log("Start Date:", startDate);
      console.log("End Date:", endDate);
      console.log("Start Time:", startTime);
      console.log("End Time:", endTime);
      console.log("Days of Week:", daysOfWeek);
      console.log("Duration:", duration);
      console.log("=============================");

      if (duration < 15 || duration > 300) {
        return res.status(400).json({ success: false, message: 'Thời lượng mỗi slot phải từ 15 đến 300 phút.' });
      }

      const start = new Date(startDate);
      const end = new Date(endDate);

      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const date = new Date(d.getTime()); // clone date object
        const dayOfWeek = date.getDay();
        if (daysOfWeek.includes(dayOfWeek)) {
          const [startHour, startMinute] = startTime.split(':').map(Number);
          const [endHour, endMinute] = endTime.split(':').map(Number);

          // Tạo thời gian ở UTC+7 (Asia/Ho_Chi_Minh) và cộng thêm 7 tiếng để lưu đúng giờ Việt Nam vào SQL (UTC)
          const currentDate = date.toISOString().split('T')[0];
          const slotStart = moment.tz(`${currentDate} ${startTime}`, DEFAULT_TIMEZONE).add(7, 'hours').toDate();
          const slotEnd = moment.tz(`${currentDate} ${endTime}`, DEFAULT_TIMEZONE).add(7, 'hours').toDate();

          // DEBUG: Log slot creation chi tiết hơn
          console.log(`Creating slots for ${date.toDateString()}: ${startHour}:${startMinute} to ${endHour}:${endMinute}`);
          console.log(`Using timezone: ${DEFAULT_TIMEZONE}`);
          console.log(`Current date: ${currentDate}`);
          console.log(`Input string: ${currentDate} ${startTime}`);
          console.log(`Local time: ${slotStart.toString()}`);
          console.log(`SlotStart ISO: ${slotStart.toISOString()}`);
          console.log(`SlotEnd ISO: ${slotEnd.toISOString()}`);

          for (let currentStart = new Date(slotStart); currentStart < slotEnd;) {
            const currentEnd = new Date(currentStart.getTime() + duration * 60000);
            if (currentEnd > slotEnd) break;
            slotCount++;
            if (slotCount > MAX_SLOTS) {
              return res.status(400).json({ success: false, message: `Vượt quá số slot tối đa (${MAX_SLOTS}) trong 1 lần tạo.` });
            }

            // DEBUG: Log each slot
            console.log(`Slot ${slotCount}: ${currentStart.toISOString()} to ${currentEnd.toISOString()}`);

            // Check overlap
            if (await isOverlap(coach_id, currentStart, currentEnd)) {
              slotConflicts.push({ start_time: currentStart, end_time: currentEnd });
            } else {
              slotInserts.push({ start_time: new Date(currentStart), end_time: new Date(currentEnd) });
            }
            currentStart = new Date(currentEnd);
          }
        }
      }
    } else if (schedules && Array.isArray(schedules)) {
      for (const schedule of schedules) {
        if (!schedule.start_time || !schedule.end_time) {
          slotInvalids.push(schedule);
          continue;
        }
        const start_time = new Date(schedule.start_time);
        const end_time = new Date(schedule.end_time);
        const duration = (end_time - start_time) / 60000;
        if (duration < 15 || duration > 300) {
          slotInvalids.push(schedule);
          continue;
        }
        slotCount++;
        if (slotCount > MAX_SLOTS) {
          return res.status(400).json({ success: false, message: `Vượt quá số slot tối đa (${MAX_SLOTS}) trong 1 lần tạo.` });
        }
        if (await isOverlap(coach_id, start_time, end_time)) {
          slotConflicts.push({ start_time, end_time });
        } else {
          slotInserts.push({ start_time, end_time });
        }
      }
    }

    // Insert valid slots
    for (const slot of slotInserts) {
      // DEBUG: Log trước khi lưu vào database
      console.log(`=== LƯU VÀO DATABASE ===`);
      console.log(`Slot start_time: ${slot.start_time}`);
      console.log(`Slot end_time: ${slot.end_time}`);
      console.log(`Slot start_time ISO: ${slot.start_time.toISOString()}`);
      console.log(`Slot end_time ISO: ${slot.end_time.toISOString()}`);
      console.log(`========================`);

      // Sử dụng DateTime để lưu UTC (best practice)
      // Nếu không hoạt động, có thể dùng:
      // .input('start_time', sql.DateTime2, slot.start_time.toISOString())
      await pool.request()
        .input('coach_id', sql.Int, coach_id)
        .input('start_time', sql.DateTime, slot.start_time)
        .input('end_time', sql.DateTime, slot.end_time)
        .query(`
          INSERT INTO COACH_SCHEDULE (coach_id, start_time, end_time)
          VALUES (@coach_id, @start_time, @end_time)
        `);
      createdCount++;
    }

    res.status(201).json({
      success: true,
      message: `Đã tạo thành công ${createdCount} lịch cho coach. Trùng: ${slotConflicts.length}, Lỗi dữ liệu: ${slotInvalids.length}`,
      createdCount,
      slotConflicts,
      slotInvalids
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Lỗi server khi tạo lịch hàng loạt' });
  }
};

// 1.1 Admin tạo lịch cho nhiều coach cùng lúc
exports.createSchedulesForMultipleCoaches = async (req, res) => {
  try {
    const { coachIds, schedules, pattern } = req.body;

    if (!coachIds || !Array.isArray(coachIds) || coachIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu danh sách coach_ids'
      });
    }

    const pool = await sql.connect(dbConfig);
    let totalCreated = 0;
    const MAX_SLOTS = 200;
    let slotCount = 0;
    const slotConflicts = [];
    const slotInvalids = [];

    async function isOverlap(coach_id, start_time, end_time) {
      const overlap = await pool.request()
        .input('coach_id', sql.Int, coach_id)
        .input('start_time', sql.DateTime, start_time)
        .input('end_time', sql.DateTime, end_time)
        .query(`SELECT 1 FROM COACH_SCHEDULE WHERE coach_id = @coach_id AND ((@start_time < end_time) AND (@end_time > start_time))`);
      return overlap.recordset.length > 0;
    }

    for (const coachId of coachIds) {
      // Check if coach exists
      const coachCheck = await pool.request()
        .input('coach_id', sql.Int, coachId)
        .query('SELECT coach_id FROM COACH WHERE coach_id = @coach_id');

      if (coachCheck.recordset.length === 0) {
        console.warn(`Coach ID ${coachId} không tồn tại, bỏ qua`);
        continue;
      }

      let createdCount = 0;
      const slotInserts = [];

      if (pattern) {
        const {
          startDate,
          endDate,
          startTime,
          endTime,
          daysOfWeek,
          duration = 60
        } = pattern;

        if (duration < 15 || duration > 300) {
          continue;
        }

        const start = new Date(startDate);
        const end = new Date(endDate);

        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
          const date = new Date(d.getTime());
          const dayOfWeek = date.getDay();
          if (daysOfWeek.includes(dayOfWeek)) {
            const [startHour, startMinute] = startTime.split(':').map(Number);
            const [endHour, endMinute] = endTime.split(':').map(Number);

            // Tạo thời gian ở UTC+7 (Asia/Ho_Chi_Minh) và cộng thêm 7 tiếng để lưu đúng giờ Việt Nam vào SQL (UTC)
            const currentDate = date.toISOString().split('T')[0];
            const slotStart = moment.tz(`${currentDate} ${startTime}`, DEFAULT_TIMEZONE).add(7, 'hours').toDate();
            const slotEnd = moment.tz(`${currentDate} ${endTime}`, DEFAULT_TIMEZONE).add(7, 'hours').toDate();

            // DEBUG: Log slot creation chi tiết hơn
            console.log(`Creating slots for ${date.toDateString()}: ${startHour}:${startMinute} to ${endHour}:${endMinute}`);
            console.log(`Using timezone: ${DEFAULT_TIMEZONE}`);
            console.log(`Current date: ${currentDate}`);
            console.log(`Input string: ${currentDate} ${startTime}`);
            console.log(`Local time: ${slotStart.toString()}`);
            console.log(`SlotStart ISO: ${slotStart.toISOString()}`);
            console.log(`SlotEnd ISO: ${slotEnd.toISOString()}`);

            for (let currentStart = new Date(slotStart); currentStart < slotEnd;) {
              const currentEnd = new Date(currentStart.getTime() + duration * 60000);
              if (currentEnd > slotEnd) break;
              slotCount++;
              if (slotCount > MAX_SLOTS) {
                break;
              }
              if (await isOverlap(coachId, currentStart, currentEnd)) {
                slotConflicts.push({ coachId, start_time: currentStart, end_time: currentEnd });
              } else {
                slotInserts.push({ start_time: new Date(currentStart), end_time: new Date(currentEnd) });
              }
              currentStart = new Date(currentEnd);
            }
          }
        }
      } else if (schedules && Array.isArray(schedules)) {
        for (const schedule of schedules) {
          if (!schedule.start_time || !schedule.end_time) {
            slotInvalids.push({ coachId, ...schedule });
            continue;
          }
          const start_time = new Date(schedule.start_time);
          const end_time = new Date(schedule.end_time);
          const duration = (end_time - start_time) / 60000;
          if (duration < 15 || duration > 300) {
            slotInvalids.push({ coachId, ...schedule });
            continue;
          }
          slotCount++;
          if (slotCount > MAX_SLOTS) {
            break;
          }
          if (await isOverlap(coachId, start_time, end_time)) {
            slotConflicts.push({ coachId, start_time, end_time });
          } else {
            slotInserts.push({ start_time, end_time });
          }
        }
      }

      for (const slot of slotInserts) {
        await pool.request()
          .input('coach_id', sql.Int, coachId)
          .input('start_time', sql.DateTime, slot.start_time)
          .input('end_time', sql.DateTime, slot.end_time)
          .query(`
            INSERT INTO COACH_SCHEDULE (coach_id, start_time, end_time)
            VALUES (@coach_id, @start_time, @end_time)
          `);
        createdCount++;
        totalCreated++;
      }
    }

    res.status(201).json({
      success: true,
      message: `Đã tạo thành công ${totalCreated} lịch cho ${coachIds.length} coach. Trùng: ${slotConflicts.length}, Lỗi dữ liệu: ${slotInvalids.length}`,
      totalCreated,
      slotConflicts,
      slotInvalids
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Lỗi server khi tạo lịch cho nhiều coach' });
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

// 4. Coach xem lịch của chính mình
exports.getMySchedules = async (req, res) => {
  try {
    const coachId = req.user.coach_id; // Lấy từ token đã xác thực

    const pool = await sql.connect(dbConfig);
    const result = await pool.request()
      .input('coach_id', sql.Int, coachId)
      .query(`
        SELECT * FROM COACH_SCHEDULE 
        WHERE coach_id = @coach_id 
        ORDER BY start_time DESC
      `);

    res.status(200).json({
      success: true,
      data: result.recordset
    });
  } catch (err) {
    console.error('Lỗi khi coach xem lịch của mình:', err);
    res.status(500).json({ success: false, message: 'Lỗi server khi lấy lịch của coach' });
  }
};


// API: Admin xem tất cả lịch của một coach bất kỳ
exports.getAllSchedulesByCoachId = async (req, res) => {
  try {
    const coachId = req.params.coachId;
    const pool = await sql.connect(dbConfig);
    const result = await pool.request()
      .input('coach_id', sql.Int, coachId)
      .query('SELECT * FROM COACH_SCHEDULE WHERE coach_id = @coach_id ORDER BY start_time DESC');
    res.status(200).json({ success: true, data: result.recordset });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Lỗi server khi lấy lịch coach' });
  }
};