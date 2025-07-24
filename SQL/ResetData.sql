-- Chuyển context về master để tránh khóa
USE master;
GO

-- Xóa database SmokingSessation nếu tồn tại
IF DB_ID('SmokingSessation') IS NOT NULL
BEGIN
    ALTER DATABASE SmokingSessation SET MULTI_USER WITH ROLLBACK IMMEDIATE;
    ALTER DATABASE SmokingSessation SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
    DROP DATABASE SmokingSessation;
END
GO

/* ───────────────────────────────
   4)  Kiểm tra
   ─────────────────────────────── */
SELECT subscription_id, user_id, package_id,
       start_date, end_date, payment_status
FROM   USER_SUBSCRIPTION
WHERE  user_id = @userId;
