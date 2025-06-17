-- Bảng HABIT_LOG – Ghi nhận mốc giờ không hút
CREATE TABLE HABIT_LOG (
    log_id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT NOT NULL,
    plan_id INT NOT NULL,
    log_date DATE NOT NULL,
    time_slot INT NOT NULL CHECK (time_slot BETWEEN 0 AND 8), -- 0: 7h, ..., 8: 22h
    completed BIT NOT NULL DEFAULT 0,
    points_awarded INT DEFAULT 0,
    created_at DATETIME DEFAULT GETDATE(),

    CONSTRAINT fk_habitlog_user FOREIGN KEY (user_id) REFERENCES CUSTOMER(user_id) ON DELETE CASCADE,
    CONSTRAINT fk_habitlog_plan FOREIGN KEY (plan_id) REFERENCES CESSATION_PLAN(plan_id),
    UNIQUE(user_id, log_date, time_slot)  -- mỗi slot 1 lần/ngày
);

-- Bảng USER_SCORE – Lưu tổng điểm và cấp độ
sql
CREATE TABLE USER_SCORE (
    user_id INT PRIMARY KEY,
    total_points INT NOT NULL DEFAULT 0,
    current_level VARCHAR(50) DEFAULT 'Beginner',
    last_updated DATETIME DEFAULT GETDATE(),

    CONSTRAINT fk_score_user FOREIGN KEY (user_id) REFERENCES CUSTOMER(user_id) ON DELETE CASCADE
);

-- Bảng USER_SCORE_LOG – Lưu chi tiết từng điểm đã cộng (theo ngày & timeSlot):
CREATE TABLE USER_SCORE_LOG (
  id INT IDENTITY(1,1) PRIMARY KEY,
  user_id INT NOT NULL,
  log_date DATE NOT NULL,
  time_slot INT NOT NULL CHECK (time_slot BETWEEN 0 AND 8),
  created_at DATETIME DEFAULT GETDATE(),
  CONSTRAINT fk_scorelog_user FOREIGN KEY (user_id) REFERENCES CUSTOMER(user_id),
  UNIQUE(user_id, log_date, time_slot)
);