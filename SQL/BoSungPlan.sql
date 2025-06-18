-- Nếu vẫn còn khóa ngoại:
ALTER TABLE HABIT_LOG DROP CONSTRAINT fk_habitlog_plan;
-- Xóa cột:
ALTER TABLE HABIT_LOG DROP COLUMN plan_id;