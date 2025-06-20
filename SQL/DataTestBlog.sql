-- Giả sử bạn đang sử dụng mật khẩu đã được mã hóa (bcrypt/hashbytes thì dùng hàm phù hợp)
INSERT INTO CUSTOMER (
    username, password_hash, full_name, email, phone_number, date_of_birth,
    registration_date, user_role, account_status, ftnd_level
)
VALUES
('admin1', 'hashed_123456', N'Admin One', 'admin1@example.com', '0901234567', '1990-01-01', GETDATE(), 'admin', 'active', NULL),
('member1', 'hashed_123456', N'Trần Văn A', 'member1@example.com', '0902345678', '1995-03-10', GETDATE(), 'member', 'active', N'Medium'),
('coach1', 'hashed_123456', N'Nguyễn Văn B', 'coach1@example.com', '0903456789', '1985-05-20', GETDATE(), 'coach', 'active', NULL);

-- Giả sử user_id của admin1, member1, coach1 là 1001, 1002, 1003
INSERT INTO USER_LOGIN (user_id, login_provider, username, password_hash)
VALUES
(1, 'local', 'admin1', 'hashed_123456'),
(2, 'local', 'member1', 'hashed_123456'),
(3, 'local', 'coach1', 'hashed_123456');

--  Coach, thêm vào bảng COACH
INSERT INTO COACH (user_id, specialization, bio, experience_years, google_meet_link)
VALUES (3, N'Tâm lý – Hành vi', N'Tôi đã hỗ trợ hơn 100 người cai nghiện thành công.', 7, 'https://meet.google.com/test-link-coach1');

-- Member đăng bài viết 
INSERT INTO COMMUNITY_POST (user_id, title, content, created_at)
VALUES 
(2, N'Câu chuyện bỏ thuốc thành công của tôi', N'Tôi đã bỏ thuốc nhờ sự hỗ trợ của kế hoạch và huấn luyện viên.', GETDATE());

-- Coach bình luận vào bài viết của member
INSERT INTO POST_COMMENT (post_id, user_id, content, created_at)
VALUES 
(1, 3, N'Bạn làm rất tốt! Hãy tiếp tục cố gắng và kiên trì nhé 💪', GETDATE());

INSERT INTO COACH_SCHEDULE (coach_id, start_time, end_time)
VALUES 
(2, '2025-06-25 09:00:00', '2025-06-25 10:00:00'),
(2, '2025-06-25 14:00:00', '2025-06-25 15:00:00'),
(2, '2025-06-26 08:00:00', '2025-06-26 09:00:00');

-- Gán coach vào COACH_SCHEDULE để test booking
INSERT INTO COACH_SCHEDULE (coach_id, start_time, end_time)
VALUES (1, '2025-06-25 09:00:00', '2025-06-25 10:00:00');

SELECT * FROM COMMUNITY_POST WHERE post_id = 3;
SELECT * FROM CUSTOMER WHERE user_id = 2;