-- 1. Bổ sung bảng COACH_SCHEDULE: lịch trống của Coach
CREATE TABLE COACH_SCHEDULE (
  schedule_id INT IDENTITY(1,1) PRIMARY KEY,
  coach_id INT NOT NULL,
  start_time DATETIME NOT NULL,
  end_time DATETIME NOT NULL,
  is_booked BIT DEFAULT 0,
  created_at DATETIME DEFAULT GETDATE(),
  CONSTRAINT fk_schedule_coach FOREIGN KEY (coach_id) REFERENCES COACH(coach_id)
);
GO

-- 2. Cập nhật bảng COACHING_SESSION để bổ sung các thông tin phục vụ phiên tư vấn
ALTER TABLE COACHING_SESSION
ADD 
  schedule_id INT NULL,
  google_meet_link VARCHAR(255) NULL,
  session_notes TEXT NULL,
  created_at DATETIME DEFAULT GETDATE();
GO

-- 3. Ràng buộc các giá trị hợp lệ cho session_status
ALTER TABLE COACHING_SESSION
ADD CONSTRAINT chk_session_status_valid
CHECK (session_status IN (
  'pending', 'accepted', 'rejected', 'canceled_by_member', 'canceled_by_coach', 'completed'
));
GO

-- 4. Khóa ngoại từ COACHING_SESSION -> COACH_SCHEDULE
ALTER TABLE COACHING_SESSION
ADD CONSTRAINT fk_session_schedule FOREIGN KEY (schedule_id) REFERENCES COACH_SCHEDULE(schedule_id);
GO

-- 5. Cập nhật bảng COACH để thêm link Google Meet cố định
ALTER TABLE COACH
ADD google_meet_link VARCHAR(255);
GO
