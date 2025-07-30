const cron = require("node-cron");
const { sql, dbConfig } = require("../config/database");
const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
const timezone = require("dayjs/plugin/timezone");

dayjs.extend(utc);
dayjs.extend(timezone);

const typeMap = {
  '📅': 'appointment',
};

cron.schedule("* * * * *", async () => {
  try {
    const pool = await sql.connect(dbConfig);
    const now = dayjs().tz("Asia/Ho_Chi_Minh").second(0).millisecond(0);
    const nowDate = now.toDate();

    // 1. Lấy danh sách thông báo đã gửi hôm nay
    const sentTodayRes = await pool.request()
      .input("today", sql.DateTime, nowDate)
      .query(`
        SELECT user_id, content
        FROM NOTIFICATION
        WHERE CAST(created_at AS DATE) = CAST(@today AS DATE)
      `);
    const sentSet = new Set(sentTodayRes.recordset.map(n => `${n.user_id}|${n.content}`));

    const notifications = [];

    // 2. Gửi thông báo lịch hẹn coaching
    const sessionRes = await pool.request().query(`
      SELECT 
        s.session_id, s.user_id, s.scheduled_time,
        cu.full_name AS coach_name
      FROM COACHING_SESSION s
      JOIN COACH c ON s.coach_id = c.coach_id
      JOIN CUSTOMER cu ON c.user_id = cu.user_id
      WHERE s.session_status = 'accepted'
    `);

    sessionRes.recordset.forEach((session) => {
      const scheduled = dayjs(session.scheduled_time).subtract(7, 'hour');
      const diffSec = scheduled.diff(now, 'second');

      if (diffSec >= 870 && diffSec < 930) {
        const content = `📅 Bạn có cuộc hẹn với Coach ${session.coach_name} lúc ${scheduled.format("HH:mm")} hôm nay. Hãy chuẩn bị nhé!`;
        const key = `${session.user_id}|${content}`;
        if (!sentSet.has(key)) {
          const emoji = content[0];
          const notificationType = typeMap[emoji] || 'general';
          notifications.push({ user_id: session.user_id, content, type: notificationType });
        }
      }
    });

    // 3. Ghi lại thông báo mới vào database
    for (const noti of notifications) {
      await pool.request()
        .input("user_id", sql.Int, noti.user_id)
        .input("content", sql.NVarChar, noti.content)
        .input("created_at", sql.DateTime, now.toDate())
        .input("is_read", sql.Bit, 0)
        .input("notification_type", sql.VarChar, noti.type)
        .query(`
          INSERT INTO NOTIFICATION (user_id, content, created_at, is_read, notification_type)
          VALUES (@user_id, @content, @created_at, @is_read, @notification_type)
        `);
    }

    if (notifications.length > 0) {
      console.log(`✅ Sent ${notifications.length} notifications at ${now.format("HH:mm:ss")}`);
    }
  } catch (err) {
    console.error("❌ Notification job failed:", err);
  }
});
