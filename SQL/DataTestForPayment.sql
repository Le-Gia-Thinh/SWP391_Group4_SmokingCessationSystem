/*===============================================================
  Tạo hoặc cập-nhật bảng SUBSCRIPTION_PACKAGE
  ===============================================================*/

SET NOCOUNT ON;

DECLARE @now DATETIME = GETDATE();

/* ---------- Gói Miễn phí (7 ngày) ---------- */
IF NOT EXISTS (SELECT 1 FROM SUBSCRIPTION_PACKAGE WHERE package_id = 1)
BEGIN
    INSERT INTO SUBSCRIPTION_PACKAGE
          (package_id, package_name, description, price,
           duration_days, coach_access, community_access,
           premium_content, created_at)
    VALUES(1,  N'Miễn phí', 
           N'Truy cập các tính năng cơ bản', 
           0, 7, 0, 1, 0, @now);
END

/* ---------- Premium 1 tháng (30 ngày) ---------- */
IF NOT EXISTS (SELECT 1 FROM SUBSCRIPTION_PACKAGE WHERE package_id = 2)
BEGIN
    INSERT INTO SUBSCRIPTION_PACKAGE
          (package_id, package_name, description, price,
           duration_days, coach_access, community_access,
           premium_content, created_at)
    VALUES(2,  N'Premium 1 tháng',
           N'Truy cập Premium trong 1 tháng',
           99000, 30, 1, 1, 1, @now);
END

/* ---------- Premium 3 tháng (90 ngày) ---------- */
IF NOT EXISTS (SELECT 1 FROM SUBSCRIPTION_PACKAGE WHERE package_id = 3)
BEGIN
    INSERT INTO SUBSCRIPTION_PACKAGE
          (package_id, package_name, description, price,
           duration_days, coach_access, community_access,
           premium_content, created_at)
    VALUES(3,  N'Premium 3 tháng',
           N'Tiết kiệm hơn khi mua 3 tháng',
           269000, 90, 1, 1, 1, @now);
END

/* ---------- Premium 6 tháng (180 ngày) ---------- */
IF NOT EXISTS (SELECT 1 FROM SUBSCRIPTION_PACKAGE WHERE package_id = 4)
BEGIN
    INSERT INTO SUBSCRIPTION_PACKAGE
          (package_id, package_name, description, price,
           duration_days, coach_access, community_access,
           premium_content, created_at)
    VALUES(4,  N'Premium 6 tháng',
           N'Tiết kiệm hơn khi mua 6 tháng',
           549000, 180, 1, 1, 1, @now);
END

/* ---------- Premium 1 năm (365 ngày) ---------- */
IF NOT EXISTS (SELECT 1 FROM SUBSCRIPTION_PACKAGE WHERE package_id = 5)
BEGIN
    INSERT INTO SUBSCRIPTION_PACKAGE
          (package_id, package_name, description, price,
           duration_days, coach_access, community_access,
           premium_content, created_at)
    VALUES(5,  N'Premium 1 năm',
           N'Tiết kiệm tối đa khi mua 1 năm',
           899000, 365, 1, 1, 1, @now);
END

/* ---------- Test 10 ngày (dùng thử) ---------- */
IF NOT EXISTS (SELECT 1 FROM SUBSCRIPTION_PACKAGE WHERE package_id = 6)
BEGIN
    INSERT INTO SUBSCRIPTION_PACKAGE
          (package_id, package_name, description, price,
           duration_days, coach_access, community_access,
           premium_content, created_at)
    VALUES(6,  N'Test 10d',
           N'Gói test 10 ngày, chỉ 20 000đ? …',
           10000, 10, 0, 0, 0, @now);
END
   





   /* chạy từng dòng nhé*/
   /* Giả sử package_id = 3  ➜ Premium 3 tháng  (duration_days = 90) */
DECLARE @today  DATE = '2025-07-10';      -- hoặc GETDATE()
DECLARE @subId  INT;

/* 1️⃣  Thêm SUBSCRIPTION cho user 13 */
INSERT INTO USER_SUBSCRIPTION
        (user_id, package_id, start_date, end_date,
         auto_renew, payment_status)
VALUES  (13, 3, @today, DATEADD(DAY, 90, @today),
         0, 'paid');          -- chú ý trạng thái = paid

SET @subId = SCOPE_IDENTITY();

/* 2️⃣  Ghi nhận PAYMENT (tùy chọn) */
INSERT INTO PAYMENT
        (subscription_id, amount, payment_date,
         transaction_id, payment_method, payment_status,
         note, order_code)
VALUES  (@subId, 2690000, @today,
         CONCAT('TEST_', NEWID()), 'redirect', 'paid',
         N'Thanh toán gói Premium 3 tháng (test)', 100000 + ABS(CHECKSUM(NEWID())) % 900000);


/* ─────────────────────────────────────────────
   1)  Thêm MEMBER mới vào CUSTOMER
   ───────────────────────────────────────────── */
INSERT INTO CUSTOMER
        (username, password_hash, full_name, email,
         registration_date, user_role, account_status,
         login_provider, created_at)
VALUES  ('member6', 'hashed_123456', N'Nguyễn Thị Test',
         'member6@test.com', GETDATE(), 'member', 'active',
         'local', GETDATE());

DECLARE @userId INT = SCOPE_IDENTITY();   -- sẽ là 15 nếu chưa có ai

/* ─────────────────────────────────────────────
   2)  Tạo subscription 6 tháng  (package_id = 4)
   ───────────────────────────────────────────── */
DECLARE @today      DATE = GETDATE();
DECLARE @pkg6Id     INT  = 4;             -- Premium 6 tháng
DECLARE @end6       DATE = DATEADD(DAY, 180, @today);
DECLARE @sub6Id INT;

INSERT INTO USER_SUBSCRIPTION
        (user_id, package_id, start_date, end_date,
         auto_renew, payment_status)
VALUES  (@userId, @pkg6Id, @today, @end6, 0, 'paid');

SET @sub6Id = SCOPE_IDENTITY();

/* Payment cho gói 6 tháng */
INSERT INTO PAYMENT
        (subscription_id, amount, payment_date,
         order_code, transaction_id, payment_method,
         payment_status, note)
VALUES  (@sub6Id, 5490000, @today,  -- giá ví dụ 5.490.000
         CAST(ABS(CHECKSUM(NEWID())) % 900000 + 100000 AS INT),
         NEWID(), 'redirect', 'paid',
         N'Thanh toán gói Premium 6 tháng (test)');

/* ─────────────────────────────────────────────
   3)  Tạo subscription 10 ngày  (package_id = 7)
   ───────────────────────────────────────────── */
DECLARE @pkg10Id    INT  = 7;             -- Test 10d
DECLARE @end10      DATE = DATEADD(DAY, 10, @today);
DECLARE @sub10Id INT;

INSERT INTO USER_SUBSCRIPTION
        (user_id, package_id, start_date, end_date,
         auto_renew, payment_status)
VALUES  (@userId, @pkg10Id, @today, @end10, 0, 'paid');

SET @sub10Id = SCOPE_IDENTITY();

/* Payment cho gói 10 ngày */
INSERT INTO PAYMENT
        (subscription_id, amount, payment_date,
         order_code, transaction_id, payment_method,
         payment_status, note)
VALUES  (@sub10Id, 10000, @today,
         CAST(ABS(CHECKSUM(NEWID())) % 900000 + 100000 AS INT),
         NEWID(), 'redirect', 'paid',
         N'Thanh toán gói Test 10 ngày (test)');

/* ─────────────────────────────────────────────
   4)  Kiểm tra nhanh
   ───────────────────────────────────────────── */
SELECT subscription_id, user_id, package_id,
       start_date, end_date, payment_status
FROM   USER_SUBSCRIPTION
WHERE  user_id = @userId;



/*chạy cái trên trước nhé*/
/* ───────────────────────────────
   1)  Tạo USER mới
   ─────────────────────────────── */
DECLARE @today  DATE = GETDATE();

INSERT INTO CUSTOMER
        (username, password_hash, full_name, email,
         registration_date, user_role, account_status,
         login_provider, created_at)
VALUES  ('member7', 'hashed_123456', N'Nguyễn Test 7',
         'member7@test.com', @today,
         'member', 'active', 'local', @today);

DECLARE @userId INT = SCOPE_IDENTITY();   -- user_id mới

/* ───────────────────────────────
   2)  Thêm SUBSCRIPTION đã paid
       – gói 1 tháng nhưng đã dùng 5 ngày
       – còn 25 ngày  (< 30)
   ─────────────────────────────── */
DECLARE @packageId INT  = 2;                  -- Premium 1 tháng
DECLARE @start     DATE = DATEADD(DAY, -5, @today);  -- đã bắt đầu 5 ngày trước
DECLARE @end       DATE = DATEADD(DAY, 25, @today);  -- còn 25 ngày
DECLARE @subId INT;

INSERT INTO USER_SUBSCRIPTION
        (user_id, package_id, start_date, end_date,
         auto_renew, payment_status)
VALUES  (@userId, @packageId, @start, @end, 0, 'paid');

SET @subId = SCOPE_IDENTITY();

/* ───────────────────────────────
   3)  Ghi nhận PAYMENT (đã thanh toán)
   ─────────────────────────────── */
INSERT INTO PAYMENT
        (subscription_id, amount, payment_date,
         order_code, transaction_id, payment_method,
         payment_status, note)
VALUES  (@subId, 99000, @start,
         CAST(ABS(CHECKSUM(NEWID())) % 900000 + 100000 AS INT),
         NEWID(), 'redirect', 'paid',
         N'Thanh toán gói Premium 1 tháng (test còn 25 ngày)');

/* ───────────────────────────────
   4)  Kiểm tra
   ─────────────────────────────── */
SELECT subscription_id, user_id, package_id,
       start_date, end_date, payment_status
FROM   USER_SUBSCRIPTION
WHERE  user_id = @userId;
