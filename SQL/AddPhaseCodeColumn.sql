-- Script để thêm cột phase_code vào bảng phases
-- Chạy script này để sửa lỗi "Invalid column name 'phase_code'"

-- 1. Thêm cột phase_code vào bảng phases
ALTER TABLE phases 
ADD phase_code NVARCHAR(10);

-- 2. Cập nhật dữ liệu phase_code cho các record hiện có
UPDATE phases SET phase_code = 'P1' WHERE phase_order = 1;
UPDATE phases SET phase_code = 'P2' WHERE phase_order = 2;
UPDATE phases SET phase_code = 'P3' WHERE phase_order = 3;
UPDATE phases SET phase_code = 'P4' WHERE phase_order = 4;
UPDATE phases SET phase_code = 'P5' WHERE phase_order = 5;

-- 3. Thêm constraint UNIQUE cho phase_code
ALTER TABLE phases 
ADD CONSTRAINT UQ_phases_phase_code UNIQUE (phase_code);

-- 4. Kiểm tra kết quả
SELECT 
    id,
    phase_name,
    phase_code,
    range_start,
    range_end,
    goal,
    phase_order
FROM phases 
ORDER BY phase_order;
