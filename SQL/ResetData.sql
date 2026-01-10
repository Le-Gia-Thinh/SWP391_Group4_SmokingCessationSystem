----------------------------------------------------------- COMMAND DROP -----------------------------------------------------------
USE master;
GO
IF DB_ID('SmokingSessation') IS NOT NULL
BEGIN
    ALTER DATABASE SmokingSessation SET MULTI_USER WITH ROLLBACK IMMEDIATE;
    ALTER DATABASE SmokingSessation SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
    DROP DATABASE SmokingSessation;
END
GO


----------------------------------------------------------- CHECK COMMAND -----------------------------------------------------------

--                   1. Kiểm tra CUSTOMER
-- Tổng số người dùng
SELECT COUNT(*) AS total_users FROM CUSTOMER;
-- Thống kê theo vai trò
SELECT user_role, COUNT(*) AS count 
FROM CUSTOMER 
GROUP BY user_role;
-- Thống kê theo trạng thái tài khoản
SELECT account_status, COUNT(*) AS count 
FROM CUSTOMER 
GROUP BY account_status;
-- Thống kê theo mức độ FTND (chỉ áp dụng cho member)
SELECT ftnd_level, COUNT(*) AS count 
FROM CUSTOMER 
WHERE user_role = 'member'
GROUP BY ftnd_level;
-- Danh sách người dùng (rút gọn)
SELECT user_id, username, full_name, user_role, account_status, ftnd_level 
FROM CUSTOMER 
ORDER BY user_role, account_status;

--                      Tổng cộng:
--   3 admin + 10 coach + 20 member = 33 người dùng
--   Trạng thái: 6 active + 4 inactive + 3 banned
--   FTND member: 5 Low + 5 Medium + 3 High


--                  2. Kiểm tra PHASES - BEHAVIOR_PHASES - BEHAVIOR_TASKS
-- Kiểm tra số lượng records
SELECT N'phases' as table_name, COUNT(*) as count FROM phases
UNION ALL
SELECT N'behavior_phases' as table_name, COUNT(*) as count FROM behavior_phases  
UNION ALL
SELECT N'behavior_tasks' as table_name, COUNT(*) as count FROM behavior_tasks;
-- Kiểm tra cấu trúc phases
SELECT * FROM phases ORDER BY phase_order;
-- Kiểm tra cấu trúc behavior_phases
SELECT * FROM behavior_phases ORDER BY phase_order;
-- Kiểm tra tasks theo phase và time slot
SELECT phase_code, time_slot,
    COUNT(*) as task_count
FROM behavior_tasks 
GROUP BY phase_code, time_slot 
ORDER BY phase_code, time_slot;

--  Đã tạo 3 bảng: phases, behavior_phases, behavior_tasks
--  Đã insert đầy đủ dữ liệu từ constants
--  Tổng cộng: 5 phases + 5 behavior_phases + 135 behavior_tasks
--  Sẵn sàng để tạo API endpoints!


 --                 2.1  Kiểm tra theo id

SELECT subscription_id, user_id, package_id,
       start_date, end_date, payment_status
FROM   USER_SUBSCRIPTION
WHERE  user_id = @userId;


 --                 3  Kiểm tra FTND
-- Kiểm tra tổng số bản ghi
SELECT COUNT(*) AS total FROM FTND_RESULT;
-- Kiểm tra phân bổ mức độ FTND
SELECT level, COUNT(*) AS count FROM FTND_RESULT GROUP BY level;
-- Kiểm tra từng username
SELECT C.username, F.level, F.submitted_at
FROM FTND_RESULT F
JOIN CUSTOMER C ON C.user_id = F.user_id
ORDER BY C.username;