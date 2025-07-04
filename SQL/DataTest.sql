-- ===============================
-- TEST DATA – SMOKING CESSATION
-- ===============================

-- 1. CUSTOMER
INSERT INTO CUSTOMER (
    username, password_hash, full_name, email, phone_number, date_of_birth,
    registration_date, user_role, account_status, ftnd_level, login_provider, google_id
)
VALUES
-- Admins
('sysadmin_swp391', 'hashed_123456', N'Admin', 'admin1@gmail.com', '0901234567', '1990-01-01', GETDATE(), 'admin', 'active', NULL, 'local', NULL),
('manage', 'hashed_123456', N'Nguyễn Thị Quản Trị', 'admin2@gmail.com', '0905555555', '1982-04-15', GETDATE(), 'admin', 'active', NULL, 'local', NULL),
('qtv', 'hashed_123456', N'Lê Văn Điều Hành', 'admin3@gmail.com', '0906666666', '1983-08-22', GETDATE(), 'admin', 'active', NULL, 'local', NULL),

-- Coaches
('coach1', 'hashed_123456', N'Thịnh Lừa Đảo', 'coach1@gmail.com', '0903456789', '1985-05-20', GETDATE(), 'coach', 'active', NULL, 'local', NULL),
('coach2', 'hashed_123456', N'Nguyễn Quốc Bảo', 'coach2@gmail.com', '0907777777', '1980-07-10', GETDATE(), 'coach', 'active', NULL, 'local', NULL),
('coach3', 'hashed_123456', N'Huỳnh Trung Chính', 'coach3@gmail.com', '0908888888', '1987-12-05', GETDATE(), 'coach', 'active', NULL, 'local', NULL),

-- Members
('member1', 'hashed_123456', N'Nghiêm Tuấn Anh', 'member1@gmail.com', '0902345678', '1995-03-10', GETDATE(), 'member', 'active', N'Medium', 'local', NULL),
('member2', 'hashed_123456', N'Nguyễn Văn Khoa', 'member2@gmail.com', '0911111111', '1993-07-20', GETDATE(), 'member', 'active', N'High', 'local', NULL),
('member3', 'hashed_123456', N'Hoàng Văn C', 'mem3@gmail.com', '0922222222', '1992-02-02', GETDATE(), 'member', 'active', N'Medium', 'local', NULL),
('member4', 'hashed_123456', N'Phạm Thị D', 'mem4@gmail.com', '0933333333', '1991-11-11', GETDATE(), 'member', 'active', N'High', 'local', NULL),
('member5', 'hashed_123456', N'Vũ Minh E', 'mem5@gmail.com', '0944444444', '1990-12-12', GETDATE(), 'member', 'active', N'Low', 'local', NULL);


-- 2. COACH
INSERT INTO COACH (user_id, specialization, bio, experience_years, google_meet_link)
SELECT user_id, N'Tâm lý – Hành vi', N'Tôi đã hỗ trợ hơn 100 người cai nghiện thành công.', 7, 'https://meet.google.com/test-link-coach1'
FROM CUSTOMER WHERE username = 'coach1';

INSERT INTO COACH (user_id, specialization, bio, experience_years, google_meet_link)
SELECT user_id, N'Kỹ thuật thay thế thói quen', N'Tôi giúp học viên sử dụng hành vi thay thế tích cực để giảm cảm giác thèm thuốc.', 5, 'https://meet.google.com/test-link-coach2'
FROM CUSTOMER WHERE username = 'coach2';

INSERT INTO COACH (user_id, specialization, bio, experience_years, google_meet_link)
SELECT user_id, N'Dinh dưỡng – Lối sống lành mạnh', N'Tôi hỗ trợ người dùng cải thiện sức khỏe thông qua chế độ ăn và sinh hoạt.', 4, 'https://meet.google.com/test-link-coach3'
FROM CUSTOMER WHERE username = 'coach3';

-- 3. COMMUNITY_POST
INSERT INTO COMMUNITY_POST (user_id, title, content, created_at)
SELECT user_id, N'Câu chuyện bỏ thuốc thành công của tôi',
       N'Tôi đã bỏ thuốc nhờ sự hỗ trợ của kế hoạch và huấn luyện viên.', GETDATE()
FROM CUSTOMER WHERE username = 'member2';

-- 4. POST_COMMENT
INSERT INTO POST_COMMENT (post_id, user_id, content, created_at)
SELECT p.post_id, c.user_id, N'Bạn làm rất tốt! Hãy tiếp tục cố gắng và kiên trì nhé 💪', GETDATE()
FROM COMMUNITY_POST p
JOIN CUSTOMER c ON c.username = 'coach1'
WHERE p.title = N'Câu chuyện bỏ thuốc thành công của tôi';


-- 5. COACH_SCHEDULE
DECLARE @start1 DATETIME = DATEADD(DAY, -2, DATEADD(HOUR, 9, CONVERT(DATETIME, CONVERT(DATE, GETDATE()))));
DECLARE @end1   DATETIME = DATEADD(HOUR, 1, @start1); -- từ 9h đến 10h

DECLARE @start2 DATETIME = DATEADD(DAY, -1, DATEADD(HOUR, 14, CONVERT(DATETIME, CONVERT(DATE, GETDATE()))));
DECLARE @end2   DATETIME = DATEADD(HOUR, 1, @start2); -- từ 14h đến 15h

-- Trước 2 ngày lúc 9h sáng
INSERT INTO COACH_SCHEDULE (coach_id, start_time, end_time)
SELECT coach_id, @start1, @end1
FROM COACH
WHERE user_id = (SELECT user_id FROM CUSTOMER WHERE username = 'coach1');

-- Trước 1 ngày lúc 14h chiều
INSERT INTO COACH_SCHEDULE (coach_id, start_time, end_time)
SELECT coach_id, @start2, @end2
FROM COACH
WHERE user_id = (SELECT user_id FROM CUSTOMER WHERE username = 'coach1');

-- 6. FTND_RESULT
INSERT INTO FTND_RESULT (user_id, level, submitted_at)
SELECT user_id, N'High', GETDATE() FROM CUSTOMER WHERE username = 'member1';
INSERT INTO FTND_RESULT (user_id, level, submitted_at)
SELECT user_id, N'Medium', GETDATE() FROM CUSTOMER WHERE username = 'member2';
INSERT INTO FTND_RESULT (user_id, level, submitted_at)
SELECT user_id, N'High', GETDATE() FROM CUSTOMER WHERE username = 'member3';
INSERT INTO FTND_RESULT (user_id, level, submitted_at)
SELECT user_id, N'Low', GETDATE() FROM CUSTOMER WHERE username = 'member4';

-- 7. CESSATION_PLAN
INSERT INTO CESSATION_PLAN (
    user_id, plan_name, start_date, end_date, month_quit,
    target_quit_date, frequency_per_day, plan_type, plan_source,
    current_stage, strategy, is_active, created_at, last_updated, template_id,
    quit_reason_summary
)
SELECT user_id, N'Giảm hút trong 14 ngày', '2025-06-10', '2025-06-24', 1, '2025-06-24', 8,
       'template', 'user', 'Phase 1', 
       N'Bắt đầu giảm từ từ và ghi nhận cảm xúc mỗi ngày.', 1, GETDATE(), GETDATE(), NULL, 
       N'Vì sức khỏe con cái'
FROM CUSTOMER WHERE username = 'member2';

INSERT INTO CESSATION_PLAN (
    user_id, plan_name, start_date, end_date, month_quit,
    target_quit_date, frequency_per_day, plan_type, plan_source,
    current_stage, strategy, is_active, created_at, last_updated, template_id,
    quit_reason_summary
)
SELECT user_id, N'Tránh kích thích hút thuốc', '2025-06-15', '2025-07-15', 1, '2025-07-15', 12,
       'custom', 'user', 'Phase 1', 
       N'Ghi chú môi trường dễ hút thuốc và thay đổi không gian sống.', 1, GETDATE(), GETDATE(), NULL,
       N'Tôi muốn kiểm soát bản thân tốt hơn'
FROM CUSTOMER WHERE username = 'member3';

INSERT INTO CESSATION_PLAN (
    user_id, plan_name, start_date, end_date, month_quit,
    target_quit_date, frequency_per_day, plan_type, plan_source,
    current_stage, strategy, is_active, created_at, last_updated, template_id,
    quit_reason_summary
)
SELECT user_id, N'Tập trung vào thể dục thay thế', '2025-06-20', '2025-07-10', 1, '2025-07-10', 10,
       'template', 'user', 'Phase 2', 
       N'Tập luyện mỗi sáng để thay thế cảm giác thèm hút.', 1, GETDATE(), GETDATE(), NULL, 
       N'Tôi đang cải thiện thể lực'
FROM CUSTOMER WHERE username = 'member4';

-- 8. USER_SCORE
-- USER_SCORE cho member1
MERGE USER_SCORE AS target
USING (
  SELECT user_id FROM CUSTOMER WHERE username = 'member1'
) AS source
ON target.user_id = source.user_id
WHEN MATCHED THEN
  UPDATE SET total_points = 120, current_level = 'Intermediate', last_updated = GETDATE()
WHEN NOT MATCHED THEN
  INSERT (user_id, total_points, current_level, last_updated)
  VALUES (source.user_id, 120, 'Intermediate', GETDATE());

-- USER_SCORE cho member2
MERGE USER_SCORE AS target
USING (
  SELECT user_id FROM CUSTOMER WHERE username = 'member2'
) AS source
ON target.user_id = source.user_id
WHEN MATCHED THEN
  UPDATE SET total_points = 500, current_level = 'Advanced', last_updated = GETDATE()
WHEN NOT MATCHED THEN
  INSERT (user_id, total_points, current_level, last_updated)
  VALUES (source.user_id, 500, 'Advanced', GETDATE());

-- USER_SCORE cho member3
MERGE USER_SCORE AS target
USING (
  SELECT user_id FROM CUSTOMER WHERE username = 'member3'
) AS source
ON target.user_id = source.user_id
WHEN MATCHED THEN
  UPDATE SET total_points = 1200, current_level = 'Master', last_updated = GETDATE()
WHEN NOT MATCHED THEN
  INSERT (user_id, total_points, current_level, last_updated)
  VALUES (source.user_id, 1200, 'Master', GETDATE());

-- USER_SCORE cho member4
MERGE USER_SCORE AS target
USING (
  SELECT user_id FROM CUSTOMER WHERE username = 'member4'
) AS source
ON target.user_id = source.user_id
WHEN MATCHED THEN
  UPDATE SET total_points = 50, current_level = 'Beginner', last_updated = GETDATE()
WHEN NOT MATCHED THEN
  INSERT (user_id, total_points, current_level, last_updated)
  VALUES (source.user_id, 50, 'Beginner', GETDATE());




-- 10. USER_ACHIEVEMENT
INSERT INTO USER_ACHIEVEMENT (user_id, achievement_id, earned_date, is_shared)
SELECT user_id, 1, GETDATE(), 1
FROM CUSTOMER WHERE username = 'member2';

INSERT INTO USER_ACHIEVEMENT (user_id, achievement_id, earned_date, is_shared)
SELECT user_id, 2, GETDATE(), 1
FROM CUSTOMER WHERE username = 'member3';

-- 11. HABIT_LOG – dùng truy vấn lấy plan_id
-- member2
INSERT INTO HABIT_LOG (user_id, plan_id, log_date, time_slot, completed, points_awarded)
SELECT c.user_id, p.plan_id, '2025-06-20', 2, 1, 5
FROM CUSTOMER c
JOIN CESSATION_PLAN p ON p.user_id = c.user_id
WHERE c.username = 'member2';

-- member3
INSERT INTO HABIT_LOG (user_id, plan_id, log_date, time_slot, completed, points_awarded)
SELECT c.user_id, p.plan_id, '2025-06-20', 3, 1, 5
FROM CUSTOMER c
JOIN CESSATION_PLAN p ON p.user_id = c.user_id
WHERE c.username = 'member3';

-- member4
INSERT INTO HABIT_LOG (user_id, plan_id, log_date, time_slot, completed, points_awarded)
SELECT c.user_id, p.plan_id, '2025-06-20', 4, 1, 5
FROM CUSTOMER c
JOIN CESSATION_PLAN p ON p.user_id = c.user_id
WHERE c.username = 'member4';

-- 12. COMMUNITY_CHAT – Group chat cộng đồng
INSERT INTO COMMUNITY_CHAT (user_id, content)
SELECT user_id, N'Chào mọi người, mình vừa bắt đầu hành trình cai thuốc hôm nay!'
FROM CUSTOMER WHERE username = 'member1';

INSERT INTO COMMUNITY_CHAT (user_id, content)
SELECT user_id, N'Chúc mừng bạn nhé! Cố lên 💪'
FROM CUSTOMER WHERE username = 'coach1';

INSERT INTO COMMUNITY_CHAT (user_id, content)
SELECT user_id, N'Mọi người có mẹo nào giúp vượt qua cơn thèm thuốc không?'
FROM CUSTOMER WHERE username = 'member3';

-- 13. CHAT_TOPIC – Topic Member tạo
INSERT INTO CHAT_TOPIC (creator_id, title, description)
SELECT user_id, N'Giảm căng thẳng khi bỏ thuốc', N'Chia sẻ cách bạn thư giãn, thiền, vận động giúp vượt qua cảm giác thèm thuốc.'
FROM CUSTOMER WHERE username = 'member2';

INSERT INTO CHAT_TOPIC (creator_id, title, description)
SELECT user_id, N'Bí quyết giữ vững tinh thần mỗi sáng', N'Hãy chia sẻ thói quen buổi sáng lành mạnh giúp bạn không nghĩ đến thuốc lá.'
FROM CUSTOMER WHERE username = 'coach2';

-- 14. TOPIC_MESSAGE – Nhắn tin trong từng Topic
-- Chủ đề 1
INSERT INTO TOPIC_MESSAGE (topic_id, user_id, content)
SELECT 1, user_id, N'Tôi thường nghe nhạc nhẹ và đi dạo khi cảm thấy thèm thuốc.'
FROM CUSTOMER WHERE username = 'member3';

INSERT INTO TOPIC_MESSAGE (topic_id, user_id, content)
SELECT 1, user_id, N'Thiền 10 phút mỗi sáng giúp mình rất nhiều. Mọi người nên thử!'
FROM CUSTOMER WHERE username = 'coach1';

-- Chủ đề 2
INSERT INTO TOPIC_MESSAGE (topic_id, user_id, content)
SELECT 2, user_id, N'Mỗi sáng mình uống nước chanh ấm và đọc 10 phút sách.'
FROM CUSTOMER WHERE username = 'member4';


-- 15. USER_PROFILE
INSERT INTO USER_PROFILE (user_id, smoking_years, daily_cigarettes, monthly_expense, preferred_brand, quit_reasons, health_issues, target_quit_date)
SELECT user_id, 5, 15, 100000, N'Vinataba', N'Vì gia đình', N'Ho nhiều, khó thở', '2025-07-01'
FROM CUSTOMER WHERE username = 'member2';

-- 16. COACHING_SESSION (dùng lại @start1, @start2 đã khai báo trước đó)

-- Member2 đặt phiên tư vấn với Coach1 (đã được duyệt)
INSERT INTO COACHING_SESSION (
    user_id, coach_id, schedule_id, scheduled_time,
    duration_minutes, session_status, session_type, google_meet_link
)
SELECT
    u.user_id,
    c.coach_id,
    s.schedule_id,
    s.start_time,
    DATEDIFF(MINUTE, s.start_time, s.end_time),
    'accepted',
    'online',
    c.google_meet_link
FROM CUSTOMER u
JOIN COACH c ON c.user_id = (SELECT user_id FROM CUSTOMER WHERE username = 'coach1')
JOIN COACH_SCHEDULE s ON s.coach_id = c.coach_id
WHERE u.username = 'member2' AND s.start_time = @start1;

-- Member3 đặt phiên tư vấn với Coach1 (pending)
INSERT INTO COACHING_SESSION (
    user_id, coach_id, schedule_id, scheduled_time,
    duration_minutes, session_status, session_type
)
SELECT
    u.user_id,
    c.coach_id,
    s.schedule_id,
    s.start_time,
    DATEDIFF(MINUTE, s.start_time, s.end_time),
    'pending',
    'online'
FROM CUSTOMER u
JOIN COACH c ON c.user_id = (SELECT user_id FROM CUSTOMER WHERE username = 'coach1')
JOIN COACH_SCHEDULE s ON s.coach_id = c.coach_id
WHERE u.username = 'member3' AND s.start_time = @start2;

-- 17. DIRECT_MESSAGE
DECLARE @session_id1 INT;

SELECT @session_id1 = session_id
FROM COACHING_SESSION
WHERE user_id = (SELECT user_id FROM CUSTOMER WHERE username = 'member2')
  AND scheduled_time = @start1;

-- Gửi tin nhắn
INSERT INTO DIRECT_MESSAGE (session_id, sender_id, sender_role, message, file_url)
SELECT @session_id1, user_id, 'coach', N'Chào bạn, chúng ta sẽ bắt đầu buổi tư vấn lúc 9h nhé!', NULL
FROM CUSTOMER WHERE username = 'coach1';

INSERT INTO DIRECT_MESSAGE (session_id, sender_id, sender_role, message, file_url)
SELECT @session_id1, user_id, 'member', N'Dạ vâng, em đã sẵn sàng!', NULL
FROM CUSTOMER WHERE username = 'member2';

-- 18. COACHING_MESSAGE
INSERT INTO COACHING_MESSAGE (session_id, user_id, coach_id, content, sent_at)
SELECT @session_id1, u.user_id, c.coach_id,
       N'Lịch hẹn đã được duyệt. Link Meet: ' + c.google_meet_link, GETDATE()
FROM CUSTOMER u
JOIN COACH c ON c.user_id = (SELECT user_id FROM CUSTOMER WHERE username = 'coach1')
WHERE u.username = 'member2';


-- ACHIEVEMENT
-- ACHIEVEMENT (với mô tả hướng dẫn cụ thể)
INSERT INTO ACHIEVEMENT (title, description, badge_image, achievement_type, difficulty_level, phase)
VALUES
(N'Hoàn thành FTND', N'Hoàn thành bài đánh giá mức độ nghiện thuốc lá FTND.', NULL, 'milestone', 1, 1),
(N'Tạo kế hoạch đầu tiên', N'Tạo kế hoạch cai thuốc cá nhân đầu tiên của bạn.', NULL, 'milestone', 1, 1),
(N'Ngày đầu không thuốc', N'Không hút bất kỳ điếu thuốc nào trong ngày đầu tiên.', NULL, 'daily', 1, 1),
(N'Thành thật với bản thân', N'Ghi lại ít nhất 1 cơn thèm thuốc đầu tiên trong nhật ký hoặc hệ thống.', NULL, 'blog', 1, 1),
(N'Bắt đầu thay đổi', N'Thực hiện 1 hành vi thay thế đầu tiên để vượt qua cơn thèm.', NULL, 'daily', 1, 1),

(N'Chiến binh một ngày', N'Hoàn thành tất cả hành vi thay thế trong mọi mốc thời gian trong 1 ngày.', NULL, 'daily', 2, 2),
(N'Liên tục 3 ngày sạch thuốc', N'Không hút thuốc liên tiếp trong 3 ngày.', NULL, 'milestone', 2, 2),
(N'Hoàn thành 10 nhiệm vụ hành vi', N'Thực hiện tổng cộng 10 hành vi thay thế khác nhau.', NULL, 'daily', 2, 2),
(N'5 ngày viết blog liên tiếp', N'Viết bài chia sẻ liên tục trong 5 ngày.', NULL, 'blog', 2, 2),
(N'Chiến binh tuần đầu', N'Không hút thuốc liên tục trong 7 ngày đầu.', NULL, 'milestone', 2, 2),

(N'Thành tựu 15 ngày', N'Không hút thuốc trong 15 ngày liên tục.', NULL, 'milestone', 3, 3),
(N'Đồng hành cùng Coach', N'Tham gia ít nhất 1 buổi tư vấn trực tuyến cùng huấn luyện viên.', NULL, 'coach', 2, 3),
(N'Hoàn thành 20 nhiệm vụ hành vi', N'Thực hiện 20 hành vi thay thế bất kỳ.', NULL, 'daily', 3, 3),
(N'7 ngày liên tiếp hoàn thành tối thiểu 5 nhiệm vụ mỗi ngày', N'Mỗi ngày hoàn thành ít nhất 5 hành vi thay thế trong 7 ngày liên tục.', NULL, 'daily', 3, 3),
(N'Chiến binh 30 ngày', N'Không hút thuốc trong 30 ngày liên tiếp.', NULL, 'milestone', 3, 3),

(N'Hoàn thành 40 nhiệm vụ hành vi', N'Thực hiện tổng cộng 40 hành vi thay thế.', NULL, 'daily', 4, 4),
(N'Chiến binh 60 ngày', N'Không hút thuốc trong 60 ngày liên tục.', NULL, 'milestone', 4, 4),
(N'Người truyền cảm hứng', N'Có bài viết nhận được tối thiểu 10 lượt thích hoặc bình luận.', NULL, 'community', 4, 4),
(N'Chiến thắng bản thân', N'Không hút thuốc trong 90 ngày liên tiếp.', NULL, 'milestone', 5, 4),
(N'Mỗi mốc giờ một lựa chọn', N'Thử ít nhất 1 hành vi thay thế ở tất cả các mốc giờ trong ngày.', NULL, 'daily', 4, 4);

