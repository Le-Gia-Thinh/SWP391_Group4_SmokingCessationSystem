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
INSERT INTO COACH_SCHEDULE (coach_id, start_time, end_time)
SELECT coach_id, '2025-06-25 09:00:00', '2025-06-25 10:00:00'
FROM COACH WHERE user_id = (SELECT user_id FROM CUSTOMER WHERE username = 'coach1');

INSERT INTO COACH_SCHEDULE (coach_id, start_time, end_time)
SELECT coach_id, '2025-06-25 14:00:00', '2025-06-25 15:00:00'
FROM COACH WHERE user_id = (SELECT user_id FROM CUSTOMER WHERE username = 'coach1');

INSERT INTO COACH_SCHEDULE (coach_id, start_time, end_time)
SELECT coach_id, '2025-06-26 08:00:00', '2025-06-26 09:00:00'
FROM COACH WHERE user_id = (SELECT user_id FROM CUSTOMER WHERE username = 'coach1');

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

-- 9. ACHIEVEMENT mẫu
INSERT INTO ACHIEVEMENT (title, description, badge_image, achievement_type, difficulty_level)
VALUES 
(N'7 ngày không hút thuốc', N'Chúc mừng bạn đã không hút thuốc trong 7 ngày liên tiếp!', NULL, 'daily', 1),
(N'30 ngày không hút thuốc', N'Bạn đã vượt qua cơn thèm thuốc suốt 1 tháng. Rất tuyệt!', NULL, 'milestone', 2);

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
