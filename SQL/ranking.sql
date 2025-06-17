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

-- Cập nhật bảng CUSTOMER để thêm cột avatar_url
ALTER TABLE CUSTOMER
ADD avatar_url VARCHAR(255) NULL;

-- Xóa bảng HABIT_LOG nếu đã tồn tại
DROP TABLE USER_SCORE_LOG;

-- đổi int thành float
ALTER TABLE USER_SCORE
ALTER COLUMN total_points FLOAT

ALTER TABLE HABIT_LOG
ALTER COLUMN points_awarded FLOAT

-- test
-- Intermediate (100–399)
UPDATE USER_SCORE SET total_points = 150, current_level = 'Intermediate', last_updated = GETDATE() WHERE user_id = 5;

-- Advanced (400–999)
UPDATE USER_SCORE SET total_points = 500, current_level = 'Advanced', last_updated = GETDATE() WHERE user_id = 6;

-- Master (1000+)
UPDATE USER_SCORE SET total_points = 1200, current_level = 'Master', last_updated = GETDATE() WHERE user_id = 7;

-- Intermediate: mem2 (user_id = 5)
MERGE USER_SCORE AS target
USING (SELECT 5 AS user_id) AS source
ON target.user_id = source.user_id
WHEN MATCHED THEN
  UPDATE SET total_points = 150, current_level = 'Intermediate', last_updated = GETDATE()
WHEN NOT MATCHED THEN
  INSERT (user_id, total_points, current_level, last_updated)
  VALUES (5, 150, 'Intermediate', GETDATE());

-- Advanced: mem3 (user_id = 6)
MERGE USER_SCORE AS target
USING (SELECT 6 AS user_id) AS source
ON target.user_id = source.user_id
WHEN MATCHED THEN
  UPDATE SET total_points = 500, current_level = 'Advanced', last_updated = GETDATE()
WHEN NOT MATCHED THEN
  INSERT (user_id, total_points, current_level, last_updated)
  VALUES (6, 500, 'Advanced', GETDATE());

-- Master: mem4 (user_id = 7)
MERGE USER_SCORE AS target
USING (SELECT 7 AS user_id) AS source
ON target.user_id = source.user_id
WHEN MATCHED THEN
  UPDATE SET total_points = 1200, current_level = 'Master', last_updated = GETDATE()
WHEN NOT MATCHED THEN
  INSERT (user_id, total_points, current_level, last_updated)
  VALUES (7, 1200, 'Master', GETDATE());


