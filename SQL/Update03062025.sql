--UpdateGoogleAndPassword
ALTER TABLE CUSTOMER ADD google_id VARCHAR(255);
ALTER TABLE CUSTOMER
ALTER COLUMN password_hash VARCHAR(255) NULL;
ALTER TABLE CUSTOMER ADD login_provider VARCHAR(20) NULL;

--Merge PLAN_REASON into CESSATION_PLAN
ALTER TABLE CESSATION_PLAN
ADD quit_reason_summary TEXT NULL;
DROP TABLE IF EXISTS PLAN_REASON;

--Edit RESOURCE is admin added not CUSTOMER
EXEC sp_rename 'RESOURCE.created_by', 'admin_id', 'COLUMN';
ALTER TABLE RESOURCE
ADD added_by_role VARCHAR(20) DEFAULT 'admin';

--WEEKLY QUOTA table: track quota by week
CREATE TABLE WEEKLY_QUOTA (
  quota_id INT IDENTITY(1,1) PRIMARY KEY,
  plan_id INT NOT NULL,
  week_number INT NOT NULL,
  max_cigarettes INT NOT NULL,
  created_at DATETIME DEFAULT GETDATE(),
  CONSTRAINT fk_weeklyquota_plan FOREIGN KEY (plan_id) REFERENCES CESSATION_PLAN(plan_id) ON DELETE CASCADE
);

--Info member 
INSERT INTO CUSTOMER (
  username,
  password_hash,
  full_name,
  email,
  phone_number,
  date_of_birth,
  registration_date,
  user_role,
  account_status,
  login_provider
) VALUES (
  'member_test',
  CONVERT(VARCHAR(255), HASHBYTES('SHA1', '12345'), 2),
  'Member Test',
  'member_test@example.com',
  '0123456789',
  '2000-01-01',
  GETDATE(),
  'member',
  'active',
  'local'
);

-- Update ngày 6/6/2025
-- Nội dung: Tách login google khỏi bảng Customer
-- Tạo bảng USER_LOGIN để lưu thông tin đăng nhập
CREATE TABLE USER_LOGIN (
  login_id INT IDENTITY(1,1) PRIMARY KEY,
  user_id INT NOT NULL,
  login_provider VARCHAR(20) NOT NULL,  -- 'local' hoặc 'google'
  username VARCHAR(100) NULL,           -- Cho login_provider = 'local'
  password_hash VARCHAR(255) NULL,      -- Cho login_provider = 'local'
  google_id VARCHAR(255) NULL,          -- Cho login_provider = 'google'
  created_at DATETIME DEFAULT GETDATE(),
  CONSTRAINT fk_login_user FOREIGN KEY (user_id) REFERENCES CUSTOMER(user_id) ON DELETE CASCADE
);

-- Chèn dữ liệu local login từ CUSTOMER vào USER_LOGIN
INSERT INTO USER_LOGIN (user_id, login_provider, username, password_hash, created_at)
SELECT user_id, 'local', username, password_hash, GETDATE()
FROM CUSTOMER
WHERE login_provider = 'local';

-- Chèn dữ liệu google login từ CUSTOMER vào USER_LOGIN
INSERT INTO USER_LOGIN (user_id, login_provider, google_id, created_at)
SELECT user_id, 'google', google_id, GETDATE()
FROM CUSTOMER
WHERE login_provider = 'google';

-- Xoá các cột không còn cần thiết trong CUSTOMER
ALTER TABLE CUSTOMER
DROP COLUMN password_hash;

ALTER TABLE CUSTOMER
DROP COLUMN google_id;

ALTER TABLE CUSTOMER
DROP COLUMN login_provider;

ALTER TABLE CUSTOMER
ADD CONSTRAINT chk_account_status
CHECK (account_status IN ('active', 'inactive', 'banned'));

-- CHECK constraint
ALTER TABLE USER_LOGIN
ADD CONSTRAINT chk_login_data
CHECK (
  (login_provider = 'local' AND username IS NOT NULL AND password_hash IS NOT NULL)
  OR
  (login_provider = 'google' AND google_id IS NOT NULL)
)

--Check xem có password_hash chưa Customer
SELECT * FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'CUSTOMER'

--Thêm vào
ALTER TABLE CUSTOMER ADD password_hash VARCHAR(255);
