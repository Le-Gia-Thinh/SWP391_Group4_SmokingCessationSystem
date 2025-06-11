
-- Xóa cột month_quit cũ (nếu đang là kiểu date hoặc sai kiểu)
ALTER TABLE CESSATION_PLAN DROP COLUMN month_quit;

-- Thêm cột month_quit mới kiểu INT, NOT NULL (có thể thêm DEFAULT nếu cần)
ALTER TABLE CESSATION_PLAN ADD month_quit INT NOT NULL DEFAULT 1;

-- Xóa bản ghi cũ của user_id = 2
DELETE FROM CESSATION_PLAN
WHERE user_id = 2;