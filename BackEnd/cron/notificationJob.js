const cron = require("node-cron");
const { sql, dbConfig } = require("../config/database");
const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
const timezone = require("dayjs/plugin/timezone");
const { evaluateAndUnlockAchievements } = require("../utils/achievementService");
dayjs.extend(utc);
dayjs.extend(timezone);
// ==== 1. Behavior Plan Mapping (phase|time => behavior & replacement) ====
const BEHAVIOR_PLAN_PHASES = [
  // Phase 1: Nhận diện – Giảm nhẹ liều
  [
    {
      time: "7h",
      behavior: "Thèm do phản xạ",
      replacement: "Kẹo nicotine 2mg (NRT) + đi bộ 5 phút",
    },
    {
      time: "8h",
      behavior: "Sau ăn sáng",
      replacement: "Miếng dán nicotine (16–24h)",
    },
    {
      time: "10h",
      behavior: "Căng nhẹ",
      replacement: "Trà thảo mộc + hít sâu 3 lần",
    },
    {
      time: "12h",
      behavior: "Sau ăn trưa",
      replacement: "Đi cầu thang thay vì hút thuốc",
    },
    { time: "14h", behavior: "Buồn ngủ", replacement: "Rửa mặt, đi bộ 3 phút" },
    {
      time: "16h",
      behavior: "Stress",
      replacement: "Gửi tin nhắn cho Coach để xin hướng dẫn",
    },
    {
      time: "18h",
      behavior: "Chờ ăn",
      replacement: "Kẹo ngậm không đường + 1 ly nước lạnh",
    },
    {
      time: "20h",
      behavior: "Sau ăn tối",
      replacement: "Đọc tài liệu bỏ thuốc trong hệ thống",
    },
    {
      time: "22h",
      behavior: "Trống trải",
      replacement: "Ghi nhật ký cảm xúc trong web",
    },
  ],
  // Phase 2: Cắt giảm quyết liệt
  [
    {
      time: "7h",
      behavior: "Thèm sáng",
      replacement: "Kẹo nicotine + thiền 3 phút",
    },
    {
      time: "8h",
      behavior: "Sau ăn sáng",
      replacement: "Miếng dán + viết nhật ký trên hệ thống",
    },
    {
      time: "10h",
      behavior: "Stress nhẹ",
      replacement: "Gửi Coach để hỏi cách kiểm soát cảm xúc",
    },
    {
      time: "12h",
      behavior: "Thèm sau ăn",
      replacement: "Mở khung chat hỏi nhanh Coach",
    },
    {
      time: "14h",
      behavior: "Buồn ngủ",
      replacement: "Tập thể dục nhẹ tại chỗ",
    },
    {
      time: "16h",
      behavior: "Cáu gắt",
      replacement: "Xem bài thở/vươn vai trong hệ thống",
    },
    {
      time: "18h",
      behavior: "Rảnh",
      replacement: "Làm nhiệm vụ trong kế hoạch hệ thống",
    },
    {
      time: "20h",
      behavior: "Sau ăn tối",
      replacement: "Nhắn tin cho Coach chia sẻ cảm giác",
    },
    {
      time: "22h",
      behavior: "Tự trách",
      replacement: "Đọc phản hồi động viên từ Coach",
    },
  ],
  // Phase 3: Chuẩn bị cai hoàn toàn
  [
    {
      time: "7h",
      behavior: "Còn thèm nhẹ",
      replacement: "Xịt nicotine hoặc bài tập thở trong hệ thống",
    },
    {
      time: "8h",
      behavior: "Sau ăn",
      replacement: "Viết lại tiến trình trong nhật ký hệ thống",
    },
    {
      time: "10h",
      behavior: "Stress nhẹ",
      replacement: "Gửi Coach nhờ hướng dẫn ứng phó",
    },
    {
      time: "12h",
      behavior: "Ăn no",
      replacement: "Tìm video hỗ trợ trong thư viện",
    },
    {
      time: "14h",
      behavior: "Mỏi đầu",
      replacement: "Chợp mắt ngắn + nhắn Coach báo tình trạng",
    },
    {
      time: "16h",
      behavior: "Thèm mạnh",
      replacement: "Bấm SOS Coach khẩn cấp nếu hệ thống có",
    },
    {
      time: "18h",
      behavior: "Chán",
      replacement: "Xem lại lý do bỏ thuốc đã ghi",
    },
    {
      time: "20h",
      behavior: "Sau ăn",
      replacement: "Nghe bài âm thanh thư giãn hệ thống cung cấp",
    },
    {
      time: "22h",
      behavior: "Cảm giác thiếu",
      replacement: "Xem lại phản hồi khích lệ từ Coach",
    },
  ],
  // Phase 4: Cai hoàn toàn – vẫn khó chịu
  [
    {
      time: "7h",
      behavior: "Thèm nhẹ",
      replacement: "Miếng dán duy trì hoặc bài thở ứng phó",
    },
    {
      time: "8h",
      behavior: "Sau ăn sáng",
      replacement: "Đánh răng + nhắn tin cảm ơn Coach hỗ trợ",
    },
    {
      time: "10h",
      behavior: "Lo lắng",
      replacement: "Gọi Coach video (nếu có) hoặc chat trực tiếp",
    },
    {
      time: "12h",
      behavior: "Ăn xong",
      replacement: "Gửi báo cáo cảm xúc cho Coach",
    },
    {
      time: "14h",
      behavior: "Mỏi",
      replacement: "Ra ngoài 5 phút hoặc mở app thư giãn",
    },
    {
      time: "16h",
      behavior: "Căng thẳng",
      replacement: "Coach hướng dẫn bài tập 3 bước chống tái nghiện",
    },
    {
      time: "18h",
      behavior: "Muốn thư giãn",
      replacement: "Xem video hướng dẫn thư giãn do Coach gửi",
    },
    {
      time: "20h",
      behavior: "Trống trải",
      replacement: "Trò chuyện lại nhật ký & Coach đọc phản hồi",
    },
    {
      time: "22h",
      behavior: "Mất ngủ",
      replacement: "Nghe podcast Coach gợi ý trước khi ngủ",
    },
  ],
  // Phase 5: Củng cố không tái nghiện
  [
    {
      time: "7h",
      behavior: "Thói quen cũ",
      replacement: "Mở app Coach & đọc lại mục tiêu đặt ra",
    },
    {
      time: "8h",
      behavior: "Gặp người hút",
      replacement: "Gửi Coach chia sẻ tình huống khó",
    },
    {
      time: "10h",
      behavior: "Căng đầu",
      replacement: "Xem lời động viên cá nhân Coach đã ghi",
    },
    {
      time: "12h",
      behavior: "Sau ăn",
      replacement: "Hoạt động thay thế: báo lại hệ thống",
    },
    {
      time: "14h",
      behavior: "Thèm nhẹ",
      replacement: "Chơi game kiểm soát cơn thèm (nếu có trong hệ thống)",
    },
    {
      time: "16h",
      behavior: "Bất chợt nhớ",
      replacement: "Mở lại nhật ký Coach từng đọc và phản hồi",
    },
    {
      time: "18h",
      behavior: "Tự thưởng",
      replacement: "Chia sẻ với Coach về việc bạn chọn phần thưởng mới",
    },
    {
      time: "20h",
      behavior: "Cô đơn",
      replacement: "Mở chat Coach và chia sẻ tâm sự",
    },
    {
      time: "22h",
      behavior: "Thèm nhẹ",
      replacement: "Xem báo cáo không hút liên tục của mình",
    },
  ],
];

const behaviorPlanMap = {};
BEHAVIOR_PLAN_PHASES.forEach((phase, phaseIndex) => {
  phase.forEach((item) => {
    const timeFormatted = item.time.replace("h", "").padStart(2, "0") + ":00";
    behaviorPlanMap[`${phaseIndex + 1}|${timeFormatted}`] = {
      behavior: item.behavior,
      replacement: item.replacement,
    };
  });
});

// ==== 2. Cron job: gửi thông báo hành vi 2 lần (trước 10p và 5p) ====
cron.schedule("* * * * *", async () => {
  try {
    const pool = await sql.connect(dbConfig);
    const now = dayjs().tz("Asia/Ho_Chi_Minh");
    //test thong bao
    //const now = dayjs().hour(7).minute(50).second(0);
    const nowDate = now.format("YYYY-MM-DD");

    // ==== Cập nhật current_stage mỗi ngày ==== // de tam
    const plans = await pool.request().query(`
      SELECT user_id, start_date, month_quit
      FROM CESSATION_PLAN
      WHERE is_active = 1
    `);

    for (const plan of plans.recordset) {
      const { user_id, start_date, month_quit } = plan;
      const daysSinceStart = dayjs().diff(dayjs(start_date), "day");
      const totalDays = month_quit * 30;
      const percent = (daysSinceStart / totalDays) * 100;

      let newStage = 1;
      if (percent >= 80) newStage = 5;
      else if (percent >= 60) newStage = 4;
      else if (percent >= 40) newStage = 3;
      else if (percent >= 20) newStage = 2;

      await pool
        .request()
        .input("user_id", sql.Int, user_id)
        .input("current_stage", sql.Int, newStage).query(`
      UPDATE CESSATION_PLAN
      SET current_stage = @current_stage
      WHERE user_id = @user_id AND is_active = 1
    `);
    }

    // Chỉ cho phép gửi tại mốc trước 10 phút hoặc 5 phút
    const validTimes = [
      now.add(10, "minute").format("HH:mm"),
      now.add(5, "minute").format("HH:mm"),
    ];

    // 1. Lấy các thông báo đã gửi hôm nay
    const sentTodayRes = await pool.request().input("today", sql.Date, nowDate)
      .query(`
        SELECT user_id, content
        FROM NOTIFICATION
        WHERE CAST(created_at AS DATE) = @today
      `);
    const sentMap = new Set(
      sentTodayRes.recordset.map((n) => `${n.user_id}|${n.content}`)
    );

    // 2. Lấy current_stage của từng user
    const stateRes = await pool.request().query(`
      SELECT user_id, current_stage FROM CESSATION_PLAN
    `);

    const notifications = [];

    for (const row of stateRes.recordset) {
      const userId = row.user_id;
      const stage = row.current_stage;

       await evaluateAndUnlockAchievements(userId);

      for (const targetTime of validTimes) {
        const key = `${stage}|${targetTime}`;
        const plan = behaviorPlanMap[key];

        if (plan) {
          const content = `🔔 ${plan.behavior} có thể xảy ra lúc ${targetTime}. Gợi ý: ${plan.replacement}`;
          if (!sentMap.has(`${userId}|${content}`)) {
            notifications.push({ user_id: userId, content });
          }
        }
      }
    }

    const sessionRes = await pool.request().query(`
      SELECT 
        s.session_id, 
        s.user_id, 
        s.scheduled_time, 
        cu.full_name AS coach_name
      FROM COACHING_SESSION s
      JOIN COACH c ON s.coach_id = c.coach_id
      JOIN CUSTOMER cu ON c.user_id = cu.user_id
      WHERE s.session_status = 'accepted';
    `);

    sessionRes.recordset.forEach((session) => {
      const scheduled = dayjs(session.scheduled_time).subtract(7, 'hour');
      const nowVN = dayjs().tz('Asia/Ho_Chi_Minh').second(0).millisecond(0);

      const diffSec = scheduled.diff(nowVN, "second");
      
      if (diffSec >= 870 && diffSec < 930) {
        const content = `📅 Bạn có cuộc hẹn với Coach ${
          session.coach_name
        } lúc ${scheduled.format("HH:mm")} hôm nay. Hãy chuẩn bị nhé!`;
        const key = `${session.user_id}|${content}`;
        if (!sentMap.has(key)) {
          notifications.push({ user_id: session.user_id, content });
        }
      }
    });

    // 3. Lưu thông báo
    for (const noti of notifications) {
      await pool
        .request()
        .input("user_id", sql.Int, noti.user_id)
        .input("content", sql.NVarChar, noti.content)
        .input("created_at", sql.DateTime, new Date())
        .input("is_read", sql.Bit, 0).query(`
          INSERT INTO NOTIFICATION (user_id, content, created_at, is_read)
          VALUES (@user_id, @content, @created_at, @is_read)
        `);
    }

    if (notifications.length > 0) {
      console.log(
        `✅ Sent ${notifications.length} notifications at ${now.format(
          "HH:mm:ss"
        )}`
      );
    }
  } catch (err) {
    console.error("❌ Notification job failed:", err);
  }
});
