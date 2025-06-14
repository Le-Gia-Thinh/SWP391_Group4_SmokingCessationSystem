-- CHUA CHINH THUC

-- Table: Lịch trống của Coach (Coach tạo trước)
CREATE TABLE COACH_SCHEDULE (
  schedule_id INT IDENTITY(1,1) PRIMARY KEY,
  coach_id INT NOT NULL,
  start_time DATETIME NOT NULL,
  end_time DATETIME NOT NULL,
  is_booked BIT DEFAULT 0,
  created_at DATETIME DEFAULT GETDATE(),
  CONSTRAINT fk_schedule_coach FOREIGN KEY (coach_id) REFERENCES COACH(coach_id)
);

-- Table: Phiên tư vấn giữa Member và Coach
ALTER TABLE COACHING_SESSION
ADD schedule_id INT NULL,
    google_meet_link VARCHAR(255) NULL,
    session_notes TEXT NULL,
    created_at DATETIME DEFAULT GETDATE();

-- Trạng thái hợp lệ cho phiên tư vấn
-- 'pending' - chờ duyệt, 'accepted' - đã duyệt, 'rejected' - từ chối, 
-- 'canceled_by_member'/'canceled_by_coach' - huỷ, 'completed' - đã xong
ALTER TABLE COACHING_SESSION
ADD CHECK (session_status IN (
  'pending', 'accepted', 'rejected', 'canceled_by_member', 'canceled_by_coach', 'completed'
));

-- Khoá ngoại liên kết với lịch rảnh nếu có
ALTER TABLE COACHING_SESSION
ADD CONSTRAINT fk_session_schedule FOREIGN KEY (schedule_id) REFERENCES COACH_SCHEDULE(schedule_id);

-- Kiểm tra hợp lệ: chỉ Coach có quyền tạo lịch rảnh
-- Thực hiện trong middleware backend bằng cách kiểm tra `user_role = 'coach'`

-- Khi member đặt lịch:
-- 1. Check lịch chưa được đặt (is_booked = 0)
-- 2. Tạo COACHING_SESSION
-- 3. Đánh dấu COACH_SCHEDULE.is_booked = 1

-- Khi Coach duyệt lịch:
-- 1. Kiểm tra quyền sở hữu lịch (coach_id == req.user.id)
-- 2. Gán link Meet từ CUSTOMER.google_meet_link
-- 3. Update session_status = 'accepted'

-- Khi huỷ:
-- 1. Update session_status tương ứng
-- 2. Set COACH_SCHEDULE.is_booked = 0 nếu là huỷ

-- Tuỳ chọn: Gửi NOTIFICATION khi lịch được duyệt hoặc từ chối
-- Có thể dùng bảng NOTIFICATION đã có sẵn