IF DB_ID('SmokingSessation') IS NULL
BEGIN
    CREATE DATABASE SmokingSessation;
END
GO
USE SmokingSessation;
GO

-- 1. CUSTOMER: Bảng chính lưu thông tin người dùng (admin, member, coach)
    CREATE TABLE CUSTOMER (
        user_id INT IDENTITY(1,1) PRIMARY KEY,                       -- Khóa chính tự động tăng

        -- Thông tin cá nhân
        username NVARCHAR(100) NOT NULL UNIQUE,                     -- Tên đăng nhập (local)
        password_hash VARCHAR(255) NULL,                            -- Mật khẩu (local) – NULL nếu dùng Google
        full_name NVARCHAR(100) NOT NULL,                           -- Họ tên
        email VARCHAR(100) NOT NULL UNIQUE,                         -- Email duy nhất
        avatar_url VARCHAR(255) NULL,                               -- Avatar URL
        phone_number VARCHAR(20) NULL,                              -- Số điện thoại
        date_of_birth DATE NULL,                                    -- Ngày sinh
        registration_date DATE NOT NULL,                            -- Ngày đăng ký

        -- Vai trò & trạng thái
        user_role VARCHAR(20) NOT NULL CHECK (
            user_role IN ('admin', 'member', 'coach')
        ),
        account_status VARCHAR(20) NOT NULL CHECK (
            account_status IN ('active', 'inactive', 'banned')
        ),
        ftnd_level NVARCHAR(20) NULL CHECK (
            ftnd_level IN (N'Low', N'Medium', N'High')
        ),

        -- Thông tin đăng nhập (gộp từ USER_LOGIN)
        login_provider NVARCHAR(20) NOT NULL CHECK (
            login_provider IN ('local', 'google')
        ),                                                          -- Xác định loại đăng nhập
        google_id VARCHAR(255),                                     -- ID Google nếu login bằng Google
        created_at DATETIME DEFAULT GETDATE(),                      -- Ngày tạo tài khoản

        -- Ràng buộc logic cho đăng nhập: hoặc local (username + password) hoặc google (google_id)
        CONSTRAINT chk_login_combination CHECK (
            (login_provider = 'local' AND username IS NOT NULL AND password_hash IS NOT NULL)
            OR
            (login_provider = 'google' AND google_id IS NOT NULL)
        )
    );
-- Unique constraint và chỉ mục (dùng sau CREATE TABLE)
        -- Dành cho tài khoản local (username phải unique)
        CREATE UNIQUE INDEX idx_unique_username_local ON CUSTOMER(username) WHERE login_provider = 'local';

        -- Dành cho tài khoản Google (google_id phải unique nếu có)
        CREATE UNIQUE INDEX idx_unique_google_id ON CUSTOMER(google_id) WHERE google_id IS NOT NULL;

        -- Tăng tốc tìm kiếm login
        CREATE INDEX idx_login_email_provider ON CUSTOMER(email, login_provider);

-- 1.1 DATA User
INSERT INTO CUSTOMER (username, password_hash, full_name, email, phone_number, date_of_birth, registration_date, user_role, account_status, ftnd_level, login_provider, google_id)
VALUES
-- Admins
('sysadmin_swp391', 'hashed_123456', N'Admin', 'admin1@gmail.com', '0987654321', '1990-01-01', GETDATE(), 'admin', 'active', NULL, 'local', NULL),
('manage', 'hashed_123456', N'Quản Trị Viên', 'admin2@gmail.com', '0934567890', '1998-11-01', GETDATE(), 'admin', 'active', NULL, 'local', NULL),
('qtv', 'hashed_123456', N'Điều Hành viên', 'admin3@gmail.com', '0905378126', '1995-09-22', GETDATE(), 'admin', 'active', NULL, 'local', NULL),

-- Coaches
('coach Thinh', 'hashed_123456', N'Lê Gia Thịnh', 'coach1@gmail.com', '0938695041', '1985-05-20', GETDATE(), 'coach', 'active', NULL, 'local', NULL),
('coach Bao', 'hashed_123456', N'Nguyễn Quốc Bảo', 'coach2@gmail.com', '0973154982', '1980-07-10', GETDATE(), 'coach', 'active', NULL, 'local', NULL),
('coach Chinh', 'hashed_123456', N'Huỳnh Trung Chính', 'coach3@gmail.com', '0982047639', '1999-02-20', GETDATE(), 'coach', 'active', NULL, 'local', NULL),
('coach Anh', 'hashed_123456', N'Nghiem Tuan Anh', 'coach4@gmail.com', '0947586201', '1990-04-28', GETDATE(), 'coach', 'active', NULL, 'local', NULL),
('coach Khoa', 'hashed_123456', N'Nguyễn Văn Khoa', 'coach5@gmail.com', '0896371528', '1987-12-05', GETDATE(), 'coach', 'active', NULL, 'local', NULL),
('coach Vinh', 'hashed_123456', N'Nguyễn Quang Vinh', 'coach6@gmail.com', '0889407265', '1993-01-07', GETDATE(), 'coach', 'active', NULL, 'local', NULL),
('coach Phuc', 'hashed_123456', N'Phạm Vạn Phúc', 'coach7@gmail.com', '0926813479', '1996-03-23', GETDATE(), 'coach', 'inactive', NULL, 'local', NULL),
('coach Kha', 'hashed_123456', N'Nguyễn Tuấn Kha', 'coach8@gmail.com', '0857962430', '1997-12-21', GETDATE(), 'coach', 'inactive', NULL, 'local', NULL),
('coach Chuong', 'hashed_123456', N'Chung Nguyên Chương', 'coach9@gmail.com', '0358392674', '1995-08-13', GETDATE(), 'coach', 'banned', NULL, 'local', NULL),
('coach Ai', 'hashed_123456', N'Nguyễn Bảo Ái', 'coach10@gmail.com', '0379453081', '1992-06-04', GETDATE(), 'coach', 'banned', NULL, 'local', NULL),

-- Members
('member1', 'hashed_123456', N'Nghiêm Tuấn Anh', 'member1@gmail.com', '0795018426', '1995-03-10', GETDATE(), 'member', 'active', N'Medium', 'local', NULL),
('member2', 'hashed_123456', N'Nguyễn Văn Khoa', 'member2@gmail.com', '0779153468', '1993-07-20', GETDATE(), 'member', 'active', N'High', 'local', NULL),
('member3', 'hashed_123456', N'Hoàng Văn Chung', 'member3@gmail.com', '0382167945', '1992-02-02', GETDATE(), 'member', 'active', N'Medium', 'local', NULL),
('member4', 'hashed_123456', N'Phạm Thị Dung', 'member4@gmail.com', '0901782346', '1991-11-11', GETDATE(), 'member', 'active', N'High', 'local', NULL),
('member5', 'hashed_123456', N'Vũ Minh Anh', 'member5@gmail.com', '0963478901', '1990-12-12', GETDATE(), 'member', 'active', N'Low', 'local', NULL),
('member6', 'hashed_123456', N'Nguyễn Thị Thiên Huyền', 'member6@gmail.com', '0918453062', '1990-12-10', GETDATE(), 'member', 'active', N'Low', 'local', NULL),
('member7', 'hashed_123456', N'Vũ Đào Hoa', 'member7@test.com', '0937162059', '1997-03-16', GETDATE(), 'member', 'active', N'Low', 'local', NULL),
('member8', 'hashed_123456', N'Nguyễn Đức Bảo', 'member8@gmail.com', '0974123098', '1998-09-06', GETDATE(), 'member', 'active', N'Low', 'local', NULL),
('member9', 'hashed_123456', N'Hoàng Tuấn Huy', 'member9@gmail.com', '0934768512', '2002-04-03', GETDATE(), 'member', 'active', N'Medium', 'local', NULL),
('member10', 'hashed_123456', N'Nguyễn Trung Châu', 'member10@gmail.com', '0916847290', '1997-12-21', GETDATE(), 'member', 'banned', N'Medium', 'local', NULL),
('member11', 'hashed_123456', N'Lê Minh Đức', 'member11@gmail.com', '0968203745', '2000-01-14', GETDATE(), 'member', 'active', N'High', 'local', NULL),
('member12', 'hashed_123456', N'Phan Huyền Trân', 'member12@gmail.com', '0982374659', '1999-03-29', GETDATE(), 'member', 'inactive', N'High', 'local', NULL),
('member13', 'hashed_123456', N'Ngô Minh Khôi', 'member13@gmail.com', '0906427185', '1996-07-07', GETDATE(), 'member', 'active', N'Low', 'local', NULL),
('member14', 'hashed_123456', N'Huỳnh Thảo Ly', 'member14@gmail.com', '0941827345', '1995-10-10', GETDATE(), 'member', 'inactive', N'Medium', 'local', NULL),
('member15', 'hashed_123456', N'Đặng Văn Tâm', 'member15@gmail.com', '0932748591', '1998-06-18', GETDATE(), 'member', 'active', N'Medium', 'local', NULL),
('member16', 'hashed_123456', N'Trần Kim Tuyến', 'member16@gmail.com', '0957623409', '2001-11-02', GETDATE(), 'member', 'banned', N'High', 'local', NULL),
('member17', 'hashed_123456', N'Lâm Thanh Huyền', 'member17@gmail.com', '0964812973', '2000-05-25', GETDATE(), 'member', 'active', N'Medium', 'local', NULL),
('member18', 'hashed_123456', N'Tống Hữu Nghĩa', 'member18@gmail.com', '0917246830', '2003-04-14', GETDATE(), 'member', 'inactive', N'Low', 'local', NULL),
('member19', 'hashed_123456', N'Tạ Như Hảo', 'member19@gmail.com', '0928365472', '1999-02-27', GETDATE(), 'member', 'banned', N'High', 'local', NULL),
('member20', 'hashed_123456', N'Lê Quốc Bảo', 'member20@gmail.com', '0973842501', '2001-08-08', GETDATE(), 'member', 'inactive', N'Medium', 'local', NULL);


-- 3. SUBSCRIPTION_PACKAGE: Các gói dịch vụ người dùng có thể đăng ký
    CREATE TABLE SUBSCRIPTION_PACKAGE (
        package_id INT IDENTITY(1,1) PRIMARY KEY,                -- Khóa chính tự tăng
        package_name NVARCHAR(100) NOT NULL,                     -- Tên gói (ví dụ: Gói Cơ Bản, Gói Premium)
        description NVARCHAR(MAX),                               -- Mô tả chi tiết về gói
        price DECIMAL(10,2) NOT NULL,                            -- Giá gói (đơn vị: VND hoặc USD)
        duration_days INT NOT NULL,                              -- Thời gian hiệu lực tính theo ngày
        coach_access BIT DEFAULT 0,                              -- Có được quyền truy cập huấn luyện viên không
        community_access BIT DEFAULT 0,                          -- Có quyền vào cộng đồng hỗ trợ không
        premium_content BIT DEFAULT 0,                           -- Có quyền truy cập nội dung nâng cao không
        created_at DATETIME2(0) NOT NULL DEFAULT SYSUTCDATETIME(),-- Ngày tạo gói
        update_at DATETIME2(0) NULL                              -- Ngày cập nhập gói

        CONSTRAINT DF_SUBSCRIPTION_PACKAGE_update_at DEFAULT SYSUTCDATETIME() -- Thời gian cập nhật cuối (UTC)
    );
-- 3.1 Thêm các gói mặc định
INSERT INTO SUBSCRIPTION_PACKAGE
  (package_name, description, price, duration_days, coach_access, community_access, premium_content, created_at)
VALUES
  (N'Test 10d',            N'Gói test 10 ngày, chỉ 10 000đ? …',         10000,    10, 0, 0, 0, CAST(GETDATE() AS DATE)),
  (N'Miễn phí',            N'Truy cập các tính năng cơ bản',             0.00,    7,  0, 1, 0, CAST(GETDATE() AS DATE)),
  (N'Premium 1 tháng',     N'Truy cập Premium trong 1 tháng',        99000.00,    30, 1, 1, 1, CAST(GETDATE() AS DATE)),
  (N'Premium 3 tháng',     N'Tiết kiệm hơn khi mua 3 tháng',        269000.00,    90, 1, 1, 1, CAST(GETDATE() AS DATE)),
  (N'Premium 6 tháng',     N'Tiết kiệm hơn khi mua 6 tháng',        549000.00,   180, 1, 1, 1, CAST(GETDATE() AS DATE)),
  (N'Premium 1 năm',       N'Tiết kiệm tối đa khi mua 1 năm',       899000.00,   365, 1, 1, 1, CAST(GETDATE() AS DATE));
 

-- 4. USER_SUBSCRIPTION: Lưu thông tin đăng ký gói của người dùng
    CREATE TABLE USER_SUBSCRIPTION (
        subscription_id INT IDENTITY(1,1) PRIMARY KEY,         -- Khóa chính tự tăng
        user_id INT NULL,                                      -- Cho phép NULL để tránh lỗi cascade
        package_id INT NOT NULL,                               -- FK: Gói đã đăng ký
        start_date DATETIME2(0) NOT NULL,                      -- Ngày bắt đầu (đầy đủ thời gian, chính xác đến giây)
        end_date DATETIME2(0) NOT NULL,                        -- Ngày kết thúc (đầy đủ thời gian, chính xác đến giây)
        auto_renew BIT DEFAULT 0,                              -- Có tự gia hạn hay không (1: Có, 0: Không)
        payment_status NVARCHAR(20) CHECK (payment_status IN (
            'pending', 'paid', 'failed', 'expired'
        )),                                                    -- Trạng thái thanh toán hợp lệ

        CONSTRAINT fk_usersub_customer FOREIGN KEY (user_id) REFERENCES CUSTOMER(user_id) ON DELETE SET NULL,
        CONSTRAINT fk_usersub_package FOREIGN KEY (package_id) REFERENCES SUBSCRIPTION_PACKAGE(package_id)
    );
    CREATE INDEX idx_usersub_user_status ON USER_SUBSCRIPTION(user_id, payment_status);

-- 5. PAYMENT: Lưu thông tin thanh toán của người dùng
    CREATE TABLE PAYMENT (
        payment_id INT IDENTITY(1,1) PRIMARY KEY,              -- Khóa chính tự tăng       
        subscription_id INT NULL,                              -- Cho phép NULL nếu subscription bị xóa
        amount DECIMAL(10,2) NOT NULL CHECK (amount >= 0),     -- Số tiền ≥ 0
        payment_date DATETIME2(0) NOT NULL,                    -- Ngày thực hiện thanh toán (đầy đủ thời gian, chính xác đến giây)        
        transaction_id VARCHAR(100) UNIQUE,                    -- Mã giao dịch
        payment_method NVARCHAR(50),                           -- Phương thức: 'QR-Momo', 'ZaloPay', 'BankTransfer',...
        payment_status NVARCHAR(20) CHECK (
            payment_status IN ('pending', 'paid', 'failed')
        ),                                                     -- Trạng thái hợp lệ        
        note NVARCHAR(255),                                    -- Ghi chú
        order_code VARCHAR(50),                              -- Mã đơn hàng (PayOS sinh hoặc hệ thống)

        CONSTRAINT fk_payment_subscription 
            FOREIGN KEY (subscription_id) REFERENCES USER_SUBSCRIPTION(subscription_id) ON DELETE SET NULL
    );

    CREATE INDEX idx_payment_status ON PAYMENT(payment_status);
    CREATE INDEX idx_payment_transaction_id ON PAYMENT(transaction_id);
    -- CREATE INDEX idx_payment_order_code ON PAYMENT(order_code); Kiểm tra tra cứu theo mã đơn hàng

-- 6. COACH: Thông tin của huấn luyện viên
    CREATE TABLE COACH (
        coach_id INT IDENTITY(1,1) PRIMARY KEY,                 -- Khóa chính
        user_id INT NULL UNIQUE,                                -- Mỗi coach tương ứng 1 user duy nhất
        specialization NVARCHAR(100),                          -- Chuyên môn cai thuốc
        bio NVARCHAR(MAX),                                     -- Giới thiệu bản thân
        experience_years INT CHECK (experience_years >= 0),    -- Số năm kinh nghiệm không âm
        status NVARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')), -- Trạng thái hợp lệ
        rating DECIMAL(3,2) CHECK (rating >= 0 AND rating <= 5), -- Đánh giá trung bình (0–5)
        google_meet_link NVARCHAR(255),                        -- Link Google Meet

        CONSTRAINT fk_coach_customer 
            FOREIGN KEY (user_id) REFERENCES CUSTOMER(user_id) ON DELETE SET NULL
    );

    -- Gợi ý: nếu thường lọc theo trạng thái
    CREATE INDEX idx_coach_status ON COACH(status);

-- 6.1 DATA COACH
INSERT INTO COACH (user_id, specialization, bio, experience_years, google_meet_link)
SELECT user_id, N'Tâm lý – Hành vi', N'Tôi đã hỗ trợ hơn 100 người cai nghiện thành công.', 7, 'https://meet.google.com/uxs-zjor-ajz'
FROM CUSTOMER WHERE username = 'coach Thinh';
INSERT INTO COACH (user_id, specialization, bio, experience_years, google_meet_link)
SELECT user_id, N'Kỹ thuật thay thế thói quen', N'Tôi giúp học viên sử dụng hành vi thay thế tích cực để giảm cảm giác thèm thuốc.', 6, 'https://meet.google.com/obd-mfkr-wkf'
FROM CUSTOMER WHERE username = 'coach Bao';
INSERT INTO COACH (user_id, specialization, bio, experience_years, google_meet_link)
SELECT user_id, N'Dinh dưỡng – Lối sống lành mạnh', N'Tôi hỗ trợ người dùng cải thiện sức khỏe thông qua chế độ ăn và sinh hoạt.', 5, 'https://meet.google.com/jtp-sptw-zon'
FROM CUSTOMER WHERE username = 'coach Chinh';
INSERT INTO COACH (user_id, specialization, bio, experience_years, google_meet_link)
SELECT user_id, N'Động lực cá nhân', N'Tôi đồng hành và giúp học viên giữ vững cam kết bỏ thuốc.', 4, 'https://meet.google.com/hte-jnuw-wih'
FROM CUSTOMER WHERE username = 'coach Anh';
INSERT INTO COACH (user_id, specialization, bio, experience_years, google_meet_link)
SELECT user_id, N'Quản lý cảm xúc', N'Giúp học viên kiểm soát căng thẳng và cảm xúc trong quá trình cai thuốc.', 6, 'https://meet.google.com/coach5'
FROM CUSTOMER WHERE username = 'coach Khoa';
INSERT INTO COACH (user_id, specialization, bio, experience_years, google_meet_link)
SELECT user_id, N'Thể thao – vận động', N'Kết hợp thể dục giúp giảm cảm giác thèm thuốc hiệu quả.', 3, 'https://meet.google.com/coach6'
FROM CUSTOMER WHERE username = 'coach Vinh';
INSERT INTO COACH (user_id, specialization, bio, experience_years, google_meet_link)
SELECT user_id, N'Tư duy tích cực', N'Tôi hỗ trợ học viên thay đổi tư duy để bền vững trong hành trình cai thuốc.', 5, 'https://meet.google.com/coach7'
FROM CUSTOMER WHERE username = 'coach Phuc';
INSERT INTO COACH (user_id, specialization, bio, experience_years, google_meet_link)
SELECT user_id, N'Thư giãn – Thiền định', N'Giúp học viên ứng dụng thiền và thư giãn để vượt qua cơn thèm thuốc.', 4, 'https://meet.google.com/coach8'
FROM CUSTOMER WHERE username = 'coach Kha';
INSERT INTO COACH (user_id, specialization, bio, experience_years, google_meet_link)
SELECT user_id, N'Công nghệ hỗ trợ', N'Hướng dẫn sử dụng app và công cụ kỹ thuật số để theo dõi tiến trình cai thuốc.', 2, 'https://meet.google.com/coach9'
FROM CUSTOMER WHERE username = 'coach Chuong';
INSERT INTO COACH (user_id, specialization, bio, experience_years, google_meet_link)
SELECT user_id, N'Tư vấn nhóm', N'Tôi dẫn dắt các nhóm hỗ trợ cùng nhau bỏ thuốc.', 6, 'https://meet.google.com/coach10'
FROM CUSTOMER WHERE username = 'coach Ai';


-- 8. CESSATION_PLAN: Lưu thông tin kế hoạch cai thuốc của người dùng
    CREATE TABLE CESSATION_PLAN (
        plan_id INT IDENTITY(1,1) PRIMARY KEY,                     -- Khóa chính
        user_id INT NULL,                                          -- Cho phép null nếu CUSTOMER bị xóa
        plan_name NVARCHAR(100) NOT NULL,                         -- Tên kế hoạch hỗ trợ tiếng Việt
        start_date DATE NOT NULL,                                 -- Ngày bắt đầu
        end_date DATE NOT NULL,                                   -- Ngày kết thúc
        month_quit INT NOT NULL DEFAULT 0,                        -- Số tháng đã cai thuốc (tính từ start đến end)
        target_quit_date DATE,                                    -- Ngày mục tiêu bỏ thuốc            
        plan_type NVARCHAR(20),                                   -- Loại kế hoạch: 'custom', 'template'
        current_stage NVARCHAR(20),                               -- Giai đoạn hiện tại
        is_active BIT DEFAULT 1,                                  -- Đang hoạt động?
        created_at DATE NOT NULL,                                 -- Ngày tạo

        CONSTRAINT fk_plan_customer FOREIGN KEY (user_id) REFERENCES CUSTOMER(user_id) ON DELETE SET NULL,
        CONSTRAINT chk_date_range CHECK (end_date >= start_date)
    );
    CREATE INDEX idx_plan_user_active ON CESSATION_PLAN(user_id, is_active);

-- 8.1 Data CESSATION_PLAN - 
-- Mẫu 1: Giảm hút trong 14 ngày
INSERT INTO CESSATION_PLAN (user_id, plan_name, start_date, end_date, month_quit, target_quit_date, plan_type, current_stage, is_active, created_at)
SELECT user_id, N'Giảm hút trong 14 ngày', '2025-06-10', '2025-06-24', 1, '2025-06-24',
       'template', 'Phase 1', 1, GETDATE()
FROM CUSTOMER WHERE username IN ('member1', 'member6', 'member11', 'member16');

-- Mẫu 2: Tránh kích thích hút thuốc
INSERT INTO CESSATION_PLAN (user_id, plan_name, start_date, end_date, month_quit, target_quit_date, plan_type, current_stage, is_active, created_at )
SELECT user_id, N'Tránh kích thích hút thuốc', '2025-06-15', '2025-07-15', 1, '2025-07-15',
       'custom', 'Phase 1', 1, GETDATE()
FROM CUSTOMER WHERE username IN ('member2', 'member7', 'member12', 'member17');

-- Mẫu 3: Tập trung thể dục thay thế
INSERT INTO CESSATION_PLAN (user_id, plan_name, start_date, end_date, month_quit, target_quit_date, plan_type, current_stage, is_active, created_at )
SELECT user_id, N'Tập trung vào thể dục thay thế', '2025-06-20', '2025-07-10', 1, '2025-07-10',
       'template', 'Phase 2', 1, GETDATE()
FROM CUSTOMER WHERE username IN ('member3', 'member8', 'member13', 'member18');

-- Mẫu 4: Thiền định & kiểm soát cảm xúc
INSERT INTO CESSATION_PLAN (user_id, plan_name, start_date, end_date, month_quit, target_quit_date, plan_type, current_stage, is_active, created_at )
SELECT user_id, N'Thiền định & kiểm soát cảm xúc', '2025-07-01', '2025-07-20', 1, '2025-07-20',
       'custom', 'Phase 1', 1, GETDATE()
FROM CUSTOMER WHERE username IN ('member4', 'member9', 'member14', 'member19');

-- Mẫu 5: Kế hoạch ban đầu
INSERT INTO CESSATION_PLAN (user_id, plan_name, start_date, end_date, month_quit, target_quit_date, plan_type, current_stage, is_active, created_at )
SELECT user_id, N'Kế hoạch ban đầu', '2025-06-05', '2025-06-19', 1, '2025-06-19',
       'template', 'Phase 1', 1, GETDATE()
FROM CUSTOMER WHERE username IN ('member5', 'member10', 'member15', 'member20');


-- 13. DAILY_SMOKING_SUMMARY: Tổng hợp số điếu thuốc mỗi ngày theo user và kế hoạch
    CREATE TABLE DAILY_SMOKING_SUMMARY (
        id INT IDENTITY(1,1) PRIMARY KEY,                      -- Khóa chính tự tăng
        user_id INT NULL,                                      -- Cho phép null nếu user bị xóa
        date DATE NOT NULL,                                    -- Ngày cụ thể
        total_cigarettes INT CHECK (total_cigarettes >= 0),    -- Tổng số điếu hút
        -- plan_id INT, x                                             -- Liên kết kế hoạch (có thể null)

        CONSTRAINT fk_dsm_summary_customer FOREIGN KEY (user_id) REFERENCES CUSTOMER(user_id) ON DELETE SET NULL,
        -- CONSTRAINT fk_dsm_summary_plan FOREIGN KEY (plan_id) REFERENCES CESSATION_PLAN(plan_id) ON DELETE SET NULL
    );
-- DATA
INSERT INTO DAILY_SMOKING_SUMMARY (user_id, date )
SELECT user_id, CAST(GETDATE() AS DATE)
FROM CUSTOMER WHERE username = 'member5';



-- 15. FTND_RESULT: Lưu kết quả bài test FTND đánh giá mức độ nghiện
    CREATE TABLE FTND_RESULT (
        result_id INT IDENTITY(1,1) PRIMARY KEY,                               -- Khóa chính tự tăng
        user_id INT NULL,                                                      -- Cho phép null nếu user bị xóa
        level NVARCHAR(20) NOT NULL CHECK (level IN (N'Low', N'Medium', N'High')),  -- Mức độ nghiện
        submitted_at DATETIME DEFAULT GETDATE(),                               -- Thời gian nộp

        CONSTRAINT fk_ftnd_user FOREIGN KEY (user_id) REFERENCES CUSTOMER(user_id) ON DELETE SET NULL
    );

-- 15.1 FTND_RESULT: Gán kết quả bài test FTND cho 20 member
INSERT INTO FTND_RESULT (user_id, level, submitted_at)
SELECT user_id, ftnd_level, GETDATE()
FROM CUSTOMER
WHERE user_role = 'member' AND ftnd_level IS NOT NULL;


-- 16. COACH_SCHEDULE: Lịch làm việc của huấn luyện viên
    CREATE TABLE COACH_SCHEDULE (
        schedule_id INT IDENTITY(1,1) PRIMARY KEY,                   -- Khóa chính tự tăng
        coach_id INT NULL,                                           -- Cho phép null nếu coach bị xóa
        start_time DATETIME NOT NULL,                                -- Giờ bắt đầu
        end_time DATETIME NOT NULL,                                  -- Giờ kết thúc
        is_booked BIT DEFAULT 0,                                     -- Đã được đặt hay chưa
        status NVARCHAR(20) DEFAULT N'available'                     -- Trạng thái hợp lệ
            CHECK (status IN (N'available', N'booked', N'cancelled')),
        created_at DATETIME DEFAULT GETDATE(),                       -- Ngày tạo

        CONSTRAINT fk_schedule_coach FOREIGN KEY (coach_id) REFERENCES COACH(coach_id) ON DELETE SET NULL,
        CONSTRAINT chk_schedule_time CHECK (end_time > start_time)
    );
    CREATE INDEX idx_schedule_coach_status ON COACH_SCHEDULE(coach_id, status);
-- DATA
DECLARE @start1 DATETIME = DATEADD(DAY, -2, DATEADD(HOUR, 9, CONVERT(DATETIME, CONVERT(DATE, GETDATE()))));
DECLARE @end1   DATETIME = DATEADD(HOUR, 1, @start1);

DECLARE @start2 DATETIME = DATEADD(DAY, -1, DATEADD(HOUR, 14, CONVERT(DATETIME, CONVERT(DATE, GETDATE()))));
DECLARE @end2   DATETIME = DATEADD(HOUR, 1, @start2);

INSERT INTO COACH_SCHEDULE (coach_id, start_time, end_time)
SELECT coach_id, @start1, @end1
FROM COACH WHERE user_id = (SELECT user_id FROM CUSTOMER WHERE username = 'coach Thinh');

INSERT INTO COACH_SCHEDULE (coach_id, start_time, end_time)
SELECT coach_id, @start2, @end2
FROM COACH WHERE user_id = (SELECT user_id FROM CUSTOMER WHERE username = 'coach Thinh');


-- 17. COACHING_SESSION: Lưu thông tin các phiên làm việc giữa Coach và Member
    CREATE TABLE COACHING_SESSION (
        session_id INT IDENTITY(1,1) PRIMARY KEY,                          -- Khóa chính tự tăng cho mỗi phiên
        user_id INT NULL,                                                 -- Người dùng tham gia (có thể null nếu user bị xóa)
        coach_id INT NULL,                                                -- Huấn luyện viên thực hiện phiên (null nếu coach bị xóa)
        schedule_id INT NULL,                                             -- Lịch làm việc được chọn (nếu có, null nếu ngoài lịch)
        scheduled_time DATETIME NOT NULL,                                 -- Thời gian bắt đầu phiên
        duration_minutes INT CHECK (duration_minutes > 0),                -- Thời lượng phiên (phải > 0 phút)

        session_status VARCHAR(30) NOT NULL CHECK (                       -- Trạng thái phiên làm việc
            session_status IN (
                'pending',               -- Chờ duyệt
                'accepted',              -- Đã chấp nhận
                'rejected',              -- Bị từ chối
                'canceled_by_member',    -- Hủy bởi người dùng
                'canceled_by_coach',     -- Hủy bởi coach
                'completed'              -- Đã hoàn thành
            )
        ),

        session_type VARCHAR(20),                                         -- Loại phiên: online, offline,...
        session_notes TEXT,                                               -- Ghi chú sau phiên
        created_at DATETIME DEFAULT GETDATE(),                            -- Ngày tạo phiên

        CONSTRAINT fk_coaching_user FOREIGN KEY (user_id) REFERENCES CUSTOMER(user_id) ON DELETE SET NULL,     
        CONSTRAINT fk_coaching_coach FOREIGN KEY (coach_id) REFERENCES COACH(coach_id) ON DELETE SET NULL,   
        CONSTRAINT fk_session_schedule FOREIGN KEY (schedule_id) REFERENCES COACH_SCHEDULE(schedule_id) ON DELETE SET NULL
    );
    -- Chỉ mục phục vụ truy vấn nhanh theo trạng thái và thời gian
    CREATE INDEX idx_session_user_status ON COACHING_SESSION(user_id, session_status);
    CREATE INDEX idx_session_coach_time ON COACHING_SESSION(coach_id, scheduled_time);
-- DATA
-- Phiên accepted (member2)
INSERT INTO COACHING_SESSION (
    user_id, coach_id, schedule_id, scheduled_time,
    duration_minutes, session_status, session_type
)
SELECT u.user_id, c.coach_id, s.schedule_id, s.start_time,
       DATEDIFF(MINUTE, s.start_time, s.end_time),
       'accepted', 'online'
FROM CUSTOMER u
JOIN COACH c ON c.user_id = (SELECT user_id FROM CUSTOMER WHERE username = 'coach Thinh')
JOIN COACH_SCHEDULE s ON s.coach_id = c.coach_id
WHERE u.username = 'member2' AND s.start_time = @start1;

-- Phiên pending (member3)
INSERT INTO COACHING_SESSION (
    user_id, coach_id, schedule_id, scheduled_time,
    duration_minutes, session_status, session_type
)
SELECT u.user_id, c.coach_id, s.schedule_id, s.start_time,
       DATEDIFF(MINUTE, s.start_time, s.end_time),
       'pending', 'online'
FROM CUSTOMER u
JOIN COACH c ON c.user_id = (SELECT user_id FROM CUSTOMER WHERE username = 'coach Thinh')
JOIN COACH_SCHEDULE s ON s.coach_id = c.coach_id
WHERE u.username = 'member3' AND s.start_time = @start2;


-- 18. COACHING_MESSAGE: Lưu tin nhắn giữa Member và Coach trong hoặc ngoài phiên làm việc
    CREATE TABLE COACHING_MESSAGE (
        message_id INT IDENTITY(1,1) PRIMARY KEY,                   -- Khóa chính tự tăng cho mỗi tin nhắn
        user_id INT NULL,                                          -- Người gửi (thành viên) – null nếu bị xóa
        coach_id INT NULL,                                         -- Người nhận (coach) – null nếu bị xóa
        content NVARCHAR(MAX),                                     -- Nội dung tin nhắn
        sent_at DATETIME NOT NULL,                                 -- Thời điểm gửi
        is_read BIT DEFAULT 0,                                     -- Trạng thái đã đọc (0: chưa, 1: đã)
        session_id INT NULL,                                       -- Gắn với phiên coaching nếu có

        CONSTRAINT fk_msg_user FOREIGN KEY (user_id) REFERENCES CUSTOMER(user_id) ON DELETE SET NULL,
        CONSTRAINT fk_msg_coach FOREIGN KEY (coach_id) REFERENCES COACH(coach_id) ON DELETE SET NULL,
        CONSTRAINT fk_msg_session FOREIGN KEY (session_id) REFERENCES COACHING_SESSION(session_id) ON DELETE SET NULL
    );
    -- Chỉ mục lọc theo trạng thái đọc của user
    CREATE INDEX idx_msg_user_read ON COACHING_MESSAGE(user_id, is_read);
    -- Chỉ mục lọc theo thời gian gửi và coach
    CREATE INDEX idx_msg_coach_time ON COACHING_MESSAGE(coach_id, sent_at);
-- DATA
DECLARE @session_id1 INT;
-- Gán session_id của buổi hẹn giữa member2 và coach Thinh vào biến
SELECT @session_id1 = session_id
FROM COACHING_SESSION
WHERE user_id = (SELECT user_id FROM CUSTOMER WHERE username = 'member2')
  AND scheduled_time = @start1;

-- Chèn tin nhắn vào bảng COACHING_MESSAGE
INSERT INTO COACHING_MESSAGE (session_id, user_id, coach_id, content, sent_at)
SELECT @session_id1, u.user_id, c.coach_id,
       N'Lịch hẹn đã được duyệt. Link Meet: ' + c.google_meet_link, GETDATE()
FROM CUSTOMER u
JOIN COACH c ON c.user_id = (SELECT user_id FROM CUSTOMER WHERE username = 'coach Thinh')
WHERE u.username = 'member2';



-- 19. ACHIEVEMENT: Lưu các loại huy hiệu / thành tích có thể nhận được
    CREATE TABLE ACHIEVEMENT (
        achievement_id INT IDENTITY(1,1) PRIMARY KEY,                       -- Khóa chính tự tăng
        title NVARCHAR(100) NOT NULL,                                       -- Tiêu đề thành tích (ví dụ: '7 ngày không hút thuốc')
        description NVARCHAR(MAX),                                          -- Mô tả chi tiết về ý nghĩa thành tựu
        achievement_type NVARCHAR(20),                                      -- Loại thành tích: 'daily', 'milestone', 'event'...
        difficulty_level INT CHECK (difficulty_level BETWEEN 1 AND 5),      -- Mức độ khó: 1 (dễ) → 5 (rất khó)
        phase TINYINT CHECK (phase BETWEEN 1 AND 4),                        -- Giai đoạn (1 → 4) tương ứng với tiến trình cai thuốc
        check_code VARCHAR(100)                                -- Mã kiểm tra điều kiện mở khóa (dùng trong backend)
    );
    -- Chỉ mục gợi ý nếu thường lọc theo loại hoặc mức độ khó
    CREATE INDEX idx_achievement_type_level ON ACHIEVEMENT(achievement_type, difficulty_level);
-- 19.1 Data Achiviment
INSERT INTO ACHIEVEMENT (title, description, achievement_type, difficulty_level, phase, check_code)
VALUES
(N'Hoàn thành FTND', N'“Biết mình biết ta, trăm trận trăm thắng.”', 'milestone', 1, 1, 'ftnd_submitted'),
(N'Tạo kế hoạch đầu tiên', N'“Bạn đã bắt đầu hành trình.”', 'milestone', 1, 1, 'plan_created'),
(N'Ngày đầu không thuốc', N'“Một ngày sạch thuốc đầu tiên!”', 'daily', 1, 1, 'first_day_clean'),
(N'Thành thật với bản thân', N'“Ghi nhận cơn thèm đầu tiên.”', 'blog', 1, 1, 'blog_first_post'),
(N'Bắt đầu thay đổi', N'“Bạn đã thử hành vi thay thế đầu tiên.”','daily', 1, 1, 'task_first'),
-- GIAI ĐOẠN 2
(N'Chiến binh một ngày', N'“Hoàn thành tất cả hành vi thay thế trong một ngày!”', 'daily', 2, 2, 'task_full_day'),
(N'Liên tục 3 ngày sạch thuốc', N'“Bạn đang tạo nền móng vững chắc.”', 'milestone', 2, 2, 'clean_3_days'),
(N'Hoàn thành 10 nhiệm vụ hành vi', N'“10 bước nhỏ, 1 bước lớn cho sức khỏe.”','daily', 2, 2, 'task_10_total'),
(N'5 ngày viết blog liên tiếp', N'“Mỗi ngày một bước tiến.”', 'blog', 2, 2, 'blog_5_in_7days'),
(N'Chiến binh tuần đầu', N'“Bạn đã không hút thuốc 7 ngày liên tiếp.”', 'milestone', 2, 2, 'clean_7_days'),
-- GIAI ĐOẠN 3
(N'Thành tựu 15 ngày', N'“Một nửa tháng đầy ý chí.”', 'milestone', 3, 3, 'clean_15_days'),
(N'Đồng hành cùng Coach', N'“Bạn đã tham gia buổi tư vấn đầu tiên.”', 'coach', 2, 3, 'coach_session_done'),
(N'Hoàn thành 20 nhiệm vụ hành vi', N'“Thói quen mới đang hình thành.”', 'daily', 3, 3, 'task_20_total'),
(N'7 ngày liên tiếp hoàn thành tối thiểu 5 nhiệm vụ mỗi ngày', N'“Bạn đã giữ vững nhịp độ thay đổi trong cả tuần.”', 'daily', 3, 3, 'task_7days_consistent'),
(N'Chiến binh 30 ngày', N'“Một tháng – một đời khác biệt.”', 'milestone', 3, 3, 'clean_30_days'),
-- GIAI ĐOẠN 4–5
(N'Hoàn thành 40 nhiệm vụ hành vi', N'“Bạn đang xây dựng lại chính mình từng chút một.”', 'daily', 4, 4, 'task_40_total'),
(N'Chiến binh 60 ngày', N'“Hai tháng kiên cường – sức khỏe bền vững.”', 'milestone', 4, 4, 'clean_60_days'),
(N'Người truyền cảm hứng', N'“Bài viết của bạn đã chạm đến nhiều người.”', 'community', 4, 4, 'inspiring_post'),
(N'Chiến thắng bản thân', N'“Bạn đã vượt mốc 90 ngày không thuốc!”', 'milestone', 5, 4, 'clean_90_days'),
(N'Mỗi mốc giờ một lựa chọn', N'“Bạn đã thử đủ mọi cách phù hợp với bản thân.”', 'daily', 4, 4, 'tried_all_slots');


-- 20. USER_ACHIEVEMENT: Ghi nhận những thành tích mà người dùng đã đạt được
    CREATE TABLE USER_ACHIEVEMENT (
        user_achievement_id INT IDENTITY(1,1) PRIMARY KEY,        -- Khóa chính tự tăng
        user_id INT NOT NULL,                                     -- Người dùng đạt thành tích
        achievement_id INT NULL,                                  -- Thành tích đạt được (NULL nếu thành tích gốc bị xóa)
        earned_date DATE,                                         -- Ngày đạt được thành tích
        is_shared BIT DEFAULT 0,                                  -- Có chia sẻ không? (0: Không, 1: Có)

        CONSTRAINT fk_userachievement_customer FOREIGN KEY (user_id) REFERENCES CUSTOMER(user_id) ON DELETE CASCADE,        -- Nếu xóa user → xóa ACHIEVEMENT này
        CONSTRAINT fk_userachievement_achievement FOREIGN KEY (achievement_id) REFERENCES ACHIEVEMENT(achievement_id) ON DELETE SET NULL  -- Nếu xóa huy hiệu → giữ ACHIEVEMENT
    );
-- 20. Data USER_ACHIEVEMENT
INSERT INTO USER_ACHIEVEMENT (user_id, achievement_id, earned_date, is_shared)
SELECT user_id, 1, GETDATE(), 1
FROM CUSTOMER WHERE username = 'member2';

INSERT INTO USER_ACHIEVEMENT (user_id, achievement_id, earned_date, is_shared)
SELECT user_id, 2, GETDATE(), 1
FROM CUSTOMER WHERE username = 'member3';


-- 21. NOTIFICATION: Lưu các thông báo gửi đến người dùng
    CREATE TABLE NOTIFICATION (
        notification_id INT IDENTITY(1,1) PRIMARY KEY,       -- Khóa chính tự tăng
        user_id INT NOT NULL,                                -- Mã người dùng nhận thông báo
        title NVARCHAR(100),                                 -- Tiêu đề thông báo
        content NVARCHAR(MAX),                               -- Nội dung chi tiết
        created_at DATETIME2(0) NOT NULL,                    -- Ngày giờ tạo thông báo
        is_read BIT DEFAULT 0,                               -- Trạng thái đã đọc (0: chưa đọc, 1: đã đọc)
        notification_type NVARCHAR(20),                      -- Loại thông báo: 'system', 'reminder', 'coach_msg',...

        CONSTRAINT fk_notification_customer 
            FOREIGN KEY (user_id) REFERENCES CUSTOMER(user_id) ON DELETE CASCADE
    );


-- 23. COMMUNITY_POST: Bảng lưu bài viết của người dùng trong cộng đồng
    CREATE TABLE COMMUNITY_POST (
        post_id INT IDENTITY(1,1) PRIMARY KEY,             -- Khóa chính tự tăng
        user_id INT NULL,                                  -- Tác giả bài viết, liên kết đến CUSTOMER
        title NVARCHAR(100),                               -- Tiêu đề bài viết
        content NVARCHAR(MAX),                             -- Nội dung chi tiết
        like_count INT DEFAULT 0,
        created_at DATETIME NOT NULL,                      -- Thời điểm đăng bài
        view_count INT DEFAULT 0,                          -- Lượt xem bài viết
        is_pinned BIT DEFAULT 0,                           -- Bài được ghim (1: có, 0: không)
        is_approved BIT DEFAULT 0,                         -- 0: chưa duyệt, 1: đã duyệt

        CONSTRAINT fk_post_user FOREIGN KEY (user_id) REFERENCES CUSTOMER(user_id) ON DELETE SET NULL -- Xóa user sẽ xóa bài
    );
-- DATA
INSERT INTO COMMUNITY_POST (user_id, title, content, created_at)
SELECT user_id, N'Câu chuyện bỏ thuốc thành công của tôi',
       N'Tôi đã bỏ thuốc nhờ sự hỗ trợ của kế hoạch và huấn luyện viên.', GETDATE()
FROM CUSTOMER WHERE username = 'member2';
-- Test đạt thành tựu
INSERT INTO COMMUNITY_POST (user_id, title, content, created_at)
SELECT user_id, N'Bài viết test thành tựu', N'Mình đang test hệ thống đạt thành tựu', GETDATE()
FROM CUSTOMER WHERE username = 'member5';

-- 24. POST_COMMENT: Bảng lưu bình luận trong bài viết cộng đồng
    CREATE TABLE POST_COMMENT (
        comment_id INT IDENTITY(1,1) PRIMARY KEY,                   -- Khóa chính tự tăng
        post_id INT NOT NULL,                                       -- Bình luận thuộc bài viết nào
        user_id INT NULL,                                           -- Người viết bình luận
        content NVARCHAR(MAX),                                      -- Nội dung bình luận
        created_at DATETIME NOT NULL,                               -- Thời điểm tạo
        parent_comment_id INT NULL,                                 -- Nếu là trả lời bình luận khác

        CONSTRAINT fk_comment_post FOREIGN KEY (post_id) REFERENCES COMMUNITY_POST(post_id) ON DELETE CASCADE,
        CONSTRAINT fk_comment_user FOREIGN KEY (user_id) REFERENCES CUSTOMER(user_id) ON DELETE SET NULL,
        CONSTRAINT fk_comment_parent FOREIGN KEY (parent_comment_id) REFERENCES POST_COMMENT(comment_id) ON DELETE NO ACTION
    );
-- DATA
INSERT INTO POST_COMMENT (post_id, user_id, content, created_at)
SELECT p.post_id, c.user_id, N'Bạn làm rất tốt! Hãy tiếp tục cố gắng và kiên trì nhé 💪', GETDATE()
FROM COMMUNITY_POST p
JOIN CUSTOMER c ON c.username = 'coach Thinh'
WHERE p.title = N'Câu chuyện bỏ thuốc thành công của tôi';


-- 26. FEEDBACK: Thu thập đánh giá và phản hồi người dùng về hệ thống hoặc tính năng cụ thể
    CREATE TABLE FEEDBACK (
        feedback_id INT IDENTITY(1,1) PRIMARY KEY,              -- Khóa chính tự tăng
        user_id INT NOT NULL,                                   -- Người gửi phản hồi (liên kết đến CUSTOMER)
        rating INT CHECK (rating >= 1 AND rating <= 5),         -- Mức đánh giá từ 1 đến 5 sao (tùy chọn)
        content NVARCHAR(MAX),                                  -- Nội dung phản hồi
        feedback_type VARCHAR(20),                              -- Loại phản hồi: 'system', 'coach', 'feature', etc.
        submitted_at DATETIME NOT NULL,                         -- Ngày gửi phản hồi
        feature_id INT,                                         -- ID tính năng cụ thể (nếu phản hồi gắn với 1 tính năng)
        
        CONSTRAINT fk_feedback_user FOREIGN KEY (user_id) REFERENCES CUSTOMER(user_id) ON DELETE CASCADE
    );


-- 27. RESET_TOKENS: Lưu mã đặt lại mật khẩu được gửi tới người dùng (qua email)
    CREATE TABLE RESET_TOKENS (
        id INT IDENTITY(1,1) PRIMARY KEY,                   -- Khóa chính tự tăng
        user_id INT NOT NULL,                               -- Người yêu cầu đặt lại mật khẩu
        token VARCHAR(255) NOT NULL UNIQUE,                 -- Mã token đặt lại (phải duy nhất)
        expires_at DATETIME NOT NULL,                       -- Thời điểm token hết hạn
        used BIT DEFAULT 0,                                 -- Đã sử dụng hay chưa (0: chưa, 1: đã)
        created_at DATETIME DEFAULT GETDATE(),              -- Ngày tạo token

        FOREIGN KEY (user_id) REFERENCES CUSTOMER(user_id) ON DELETE CASCADE
    );


-- 28. HABIT_LOG: Ghi nhận hành vi không hút thuốc theo từng mốc giờ trong ngày
    CREATE TABLE HABIT_LOG (
        log_id INT IDENTITY(1,1) PRIMARY KEY,                  -- Khóa chính tự tăng
        user_id INT NOT NULL,                                 -- Người dùng thực hiện hành vi
        log_date DATE NOT NULL,                               -- Ngày ghi nhận
        time_slot INT NOT NULL CHECK (time_slot BETWEEN 0 AND 8), -- Mốc thời gian (0: 7h, ..., 8: 22h)
        completed BIT NOT NULL DEFAULT 0,                     -- Đã hoàn thành không hút tại slot đó hay chưa
        points_awarded FLOAT DEFAULT 0,                         -- Điểm thưởng cho hành vi này
        created_at DATETIME DEFAULT GETDATE(),                -- Ngày tạo bản ghi

        CONSTRAINT fk_habitlog_user FOREIGN KEY (user_id) REFERENCES CUSTOMER(user_id) ON DELETE CASCADE,
        UNIQUE(user_id, log_date, time_slot)                  -- Một người chỉ có 1 bản ghi/slot/ngày
    );
-- Data HABIT_LOG
-- member2
INSERT INTO HABIT_LOG (user_id, log_date, time_slot, completed, points_awarded)
SELECT c.user_id, '2025-06-20', 2, 1, 5
FROM CUSTOMER c WHERE c.username = 'member2';
-- member3
INSERT INTO HABIT_LOG (user_id, log_date, time_slot, completed, points_awarded)
SELECT c.user_id, '2025-06-20', 3, 1, 5
FROM CUSTOMER c WHERE c.username = 'member3';
-- member4
INSERT INTO HABIT_LOG (user_id, log_date, time_slot, completed, points_awarded)
SELECT c.user_id, '2025-06-20', 4, 1, 5
FROM CUSTOMER c WHERE c.username = 'member4';


-- 29. USER_SCORE: Tổng điểm và cấp bậc hiện tại của người dùng trong hệ thống
    CREATE TABLE USER_SCORE (
        user_id INT PRIMARY KEY,                              -- Mỗi user có 1 dòng duy nhất
        total_points FlOAT NOT NULL DEFAULT 0,                  -- Tổng điểm tích lũy
        current_level VARCHAR(50) DEFAULT 'Beginner',         -- Cấp độ (Beginner, Intermediate, Expert...)
        last_updated DATETIME DEFAULT GETDATE(),              -- Thời điểm cập nhật gần nhất

        CONSTRAINT fk_score_user FOREIGN KEY (user_id) REFERENCES CUSTOMER(user_id) ON DELETE CASCADE
    );
-- 29.1 DATA USER_SCORE
-- member1
MERGE USER_SCORE AS target USING (SELECT user_id FROM CUSTOMER WHERE username = 'member1') AS source ON target.user_id = source.user_id
WHEN MATCHED THEN UPDATE SET total_points = 120, current_level = 'Intermediate', last_updated = GETDATE()
WHEN NOT MATCHED THEN INSERT (user_id, total_points, current_level, last_updated) VALUES (source.user_id, 120, 'Intermediate', GETDATE());

-- member2
MERGE USER_SCORE AS target USING (SELECT user_id FROM CUSTOMER WHERE username = 'member2') AS source ON target.user_id = source.user_id
WHEN MATCHED THEN UPDATE SET total_points = 500, current_level = 'Advanced', last_updated = GETDATE()
WHEN NOT MATCHED THEN INSERT (user_id, total_points, current_level, last_updated)
  VALUES (source.user_id, 500, 'Advanced', GETDATE());

-- member3
MERGE USER_SCORE AS target USING (SELECT user_id FROM CUSTOMER WHERE username = 'member3') AS source ON target.user_id = source.user_id
WHEN MATCHED THEN UPDATE SET total_points = 1200, current_level = 'Master', last_updated = GETDATE()
WHEN NOT MATCHED THEN INSERT (user_id, total_points, current_level, last_updated)
  VALUES (source.user_id, 1200, 'Master', GETDATE());

-- member4
MERGE USER_SCORE AS target USING (SELECT user_id FROM CUSTOMER WHERE username = 'member4') AS source ON target.user_id = source.user_id
WHEN MATCHED THEN UPDATE SET total_points = 50, current_level = 'Beginner', last_updated = GETDATE()
WHEN NOT MATCHED THEN INSERT (user_id, total_points, current_level, last_updated)
  VALUES (source.user_id, 50, 'Beginner', GETDATE());

-- member5
MERGE USER_SCORE AS target USING (SELECT user_id FROM CUSTOMER WHERE username = 'member5') AS source ON target.user_id = source.user_id
WHEN MATCHED THEN UPDATE SET total_points = 300, current_level = 'Intermediate', last_updated = GETDATE()
WHEN NOT MATCHED THEN INSERT (user_id, total_points, current_level, last_updated)
  VALUES (source.user_id, 300, 'Intermediate', GETDATE());

-- member6
MERGE USER_SCORE AS target USING (SELECT user_id FROM CUSTOMER WHERE username = 'member6') AS source ON target.user_id = source.user_id
WHEN MATCHED THEN UPDATE SET total_points = 80, current_level = 'Beginner', last_updated = GETDATE()
WHEN NOT MATCHED THEN INSERT (user_id, total_points, current_level, last_updated)
  VALUES (source.user_id, 80, 'Beginner', GETDATE());

-- member7
MERGE USER_SCORE AS target USING (SELECT user_id FROM CUSTOMER WHERE username = 'member7') AS source ON target.user_id = source.user_id
WHEN MATCHED THEN UPDATE SET total_points = 950, current_level = 'Expert', last_updated = GETDATE()
WHEN NOT MATCHED THEN INSERT (user_id, total_points, current_level, last_updated)
  VALUES (source.user_id, 950, 'Expert', GETDATE());

-- member8
MERGE USER_SCORE AS target USING (SELECT user_id FROM CUSTOMER WHERE username = 'member8') AS source ON target.user_id = source.user_id
WHEN MATCHED THEN UPDATE SET total_points = 150, current_level = 'Intermediate', last_updated = GETDATE()
WHEN NOT MATCHED THEN INSERT (user_id, total_points, current_level, last_updated)
  VALUES (source.user_id, 150, 'Intermediate', GETDATE());

-- member9
MERGE USER_SCORE AS target USING (SELECT user_id FROM CUSTOMER WHERE username = 'member9') AS source ON target.user_id = source.user_id
WHEN MATCHED THEN UPDATE SET total_points = 410, current_level = 'Advanced', last_updated = GETDATE()
WHEN NOT MATCHED THEN INSERT (user_id, total_points, current_level, last_updated)
  VALUES (source.user_id, 410, 'Advanced', GETDATE());

-- member10
MERGE USER_SCORE AS target USING (SELECT user_id FROM CUSTOMER WHERE username = 'member10') AS source ON target.user_id = source.user_id
WHEN MATCHED THEN UPDATE SET total_points = 0, current_level = 'Beginner', last_updated = GETDATE()
WHEN NOT MATCHED THEN INSERT (user_id, total_points, current_level, last_updated)
  VALUES (source.user_id, 0, 'Beginner', GETDATE());

-- member11
MERGE USER_SCORE AS target USING (SELECT user_id FROM CUSTOMER WHERE username = 'member11') AS source ON target.user_id = source.user_id
WHEN MATCHED THEN UPDATE SET total_points = 700, current_level = 'Expert', last_updated = GETDATE()
WHEN NOT MATCHED THEN INSERT (user_id, total_points, current_level, last_updated)
  VALUES (source.user_id, 700, 'Expert', GETDATE());

-- member12
MERGE USER_SCORE AS target USING (SELECT user_id FROM CUSTOMER WHERE username = 'member12') AS source ON target.user_id = source.user_id
WHEN MATCHED THEN UPDATE SET total_points = 220, current_level = 'Intermediate', last_updated = GETDATE()
WHEN NOT MATCHED THEN INSERT (user_id, total_points, current_level, last_updated)
  VALUES (source.user_id, 220, 'Intermediate', GETDATE());

-- member13
MERGE USER_SCORE AS target USING (SELECT user_id FROM CUSTOMER WHERE username = 'member13') AS source ON target.user_id = source.user_id
WHEN MATCHED THEN UPDATE SET total_points = 60, current_level = 'Beginner', last_updated = GETDATE()
WHEN NOT MATCHED THEN INSERT (user_id, total_points, current_level, last_updated) VALUES (source.user_id, 60, 'Beginner', GETDATE());

-- member14
MERGE USER_SCORE AS target USING (SELECT user_id FROM CUSTOMER WHERE username = 'member14') AS source ON target.user_id = source.user_id
WHEN MATCHED THEN UPDATE SET total_points = 350, current_level = 'Intermediate', last_updated = GETDATE()
WHEN NOT MATCHED THEN INSERT (user_id, total_points, current_level, last_updated)
  VALUES (source.user_id, 350, 'Intermediate', GETDATE());

-- member15
MERGE USER_SCORE AS target USING (SELECT user_id FROM CUSTOMER WHERE username = 'member15') AS source ON target.user_id = source.user_id
WHEN MATCHED THEN UPDATE SET total_points = 540, current_level = 'Advanced', last_updated = GETDATE()
WHEN NOT MATCHED THEN INSERT (user_id, total_points, current_level, last_updated)
  VALUES (source.user_id, 540, 'Advanced', GETDATE());

-- member16
MERGE USER_SCORE AS target USING (SELECT user_id FROM CUSTOMER WHERE username = 'member16') AS source ON target.user_id = source.user_id
WHEN MATCHED THEN UPDATE SET total_points = 0, current_level = 'Beginner', last_updated = GETDATE()
WHEN NOT MATCHED THEN INSERT (user_id, total_points, current_level, last_updated)
  VALUES (source.user_id, 0, 'Beginner', GETDATE());

-- member17
MERGE USER_SCORE AS target USING (SELECT user_id FROM CUSTOMER WHERE username = 'member17') AS source ON target.user_id = source.user_id
WHEN MATCHED THEN UPDATE SET total_points = 650, current_level = 'Expert', last_updated = GETDATE()
WHEN NOT MATCHED THEN INSERT (user_id, total_points, current_level, last_updated)
  VALUES (source.user_id, 650, 'Expert', GETDATE());

-- member18
MERGE USER_SCORE AS target USING (SELECT user_id FROM CUSTOMER WHERE username = 'member18') AS source ON target.user_id = source.user_id
WHEN MATCHED THEN UPDATE SET total_points = 100, current_level = 'Beginner', last_updated = GETDATE()
WHEN NOT MATCHED THEN INSERT (user_id, total_points, current_level, last_updated)
  VALUES (source.user_id, 100, 'Beginner', GETDATE());

-- member19
MERGE USER_SCORE AS target USING (SELECT user_id FROM CUSTOMER WHERE username = 'member19') AS source ON target.user_id = source.user_id
WHEN MATCHED THEN UPDATE SET total_points = 890, current_level = 'Expert', last_updated = GETDATE()
WHEN NOT MATCHED THEN INSERT (user_id, total_points, current_level, last_updated)
  VALUES (source.user_id, 890, 'Expert', GETDATE());

-- member20
MERGE USER_SCORE AS target USING (SELECT user_id FROM CUSTOMER WHERE username = 'member20') AS source ON target.user_id = source.user_id
WHEN MATCHED THEN UPDATE SET total_points = 430, current_level = 'Advanced', last_updated = GETDATE()
WHEN NOT MATCHED THEN INSERT (user_id, total_points, current_level, last_updated)
  VALUES (source.user_id, 430, 'Advanced', GETDATE());



 -- 31. COMMUNITY_CHAT: Lưu tin nhắn trong phòng trò chuyện chung của cộng đồng
CREATE TABLE COMMUNITY_CHAT (
    message_id INT IDENTITY PRIMARY KEY,                       -- Khóa chính tự tăng cho mỗi tin nhắn
    user_id INT,                                               -- Người gửi tin nhắn (liên kết đến CUSTOMER)
    content NVARCHAR(MAX),                                     -- Nội dung tin nhắn
    sent_at DATETIME DEFAULT GETDATE(),                        -- Thời điểm gửi tin nhắn

    CONSTRAINT fk_communitychat_user FOREIGN KEY (user_id) REFERENCES CUSTOMER(user_id) -- Khóa ngoại đến bảng CUSTOMER
);
-- DATA
INSERT INTO COMMUNITY_CHAT (user_id, content)
SELECT user_id, N'Chào mọi người, mình vừa bắt đầu hành trình cai thuốc hôm nay!'
FROM CUSTOMER WHERE username = 'member1';

INSERT INTO COMMUNITY_CHAT (user_id, content)
SELECT user_id, N'Chúc mừng bạn nhé! Cố lên 💪'
FROM CUSTOMER WHERE username = 'coach Thinh';

INSERT INTO COMMUNITY_CHAT (user_id, content)
SELECT user_id, N'Mọi người có mẹo nào giúp vượt qua cơn thèm thuốc không?'
FROM CUSTOMER WHERE username = 'member3';


-- 32. CHAT_TOPIC: Chủ đề thảo luận do người dùng tạo trong cộng đồng
CREATE TABLE CHAT_TOPIC (
    topic_id INT IDENTITY PRIMARY KEY,                         -- Khóa chính tự tăng cho mỗi chủ đề
    creator_id INT,                                            -- Người tạo chủ đề (liên kết đến CUSTOMER)
    title NVARCHAR(200),                                       -- Tiêu đề chủ đề
    description NVARCHAR(MAX),                                 -- Mô tả nội dung của chủ đề
    created_at DATETIME DEFAULT GETDATE(),                     -- Ngày tạo chủ đề

    CONSTRAINT fk_chattopic_creator FOREIGN KEY (creator_id) REFERENCES CUSTOMER(user_id) -- Khóa ngoại đến bảng CUSTOMER
);
-- DATA
INSERT INTO CHAT_TOPIC (creator_id, title, description)
SELECT user_id, N'Giảm căng thẳng khi bỏ thuốc',
       N'Chia sẻ cách bạn thư giãn, thiền, vận động giúp vượt qua cảm giác thèm thuốc.'
FROM CUSTOMER WHERE username = 'member2';

INSERT INTO CHAT_TOPIC (creator_id, title, description)
SELECT user_id, N'Bí quyết giữ vững tinh thần mỗi sáng',
       N'Hãy chia sẻ thói quen buổi sáng lành mạnh giúp bạn không nghĩ đến thuốc lá.'
FROM CUSTOMER WHERE username = 'coach Bao ';


-- 33. TOPIC_MESSAGE: Tin nhắn trong từng chủ đề cụ thể
CREATE TABLE TOPIC_MESSAGE (
    message_id INT IDENTITY PRIMARY KEY,                       -- Khóa chính tự tăng cho mỗi tin nhắn
    topic_id INT,                                              -- Chủ đề mà tin nhắn thuộc về (liên kết đến CHAT_TOPIC)
    user_id INT,                                               -- Người gửi tin nhắn (liên kết đến CUSTOMER)
    content NVARCHAR(MAX),                                     -- Nội dung tin nhắn
    sent_at DATETIME DEFAULT GETDATE(),                        -- Thời điểm gửi tin nhắn

    CONSTRAINT fk_topicmsg_topic FOREIGN KEY (topic_id) REFERENCES CHAT_TOPIC(topic_id), -- Khóa ngoại đến CHAT_TOPIC
    CONSTRAINT fk_topicmsg_user FOREIGN KEY (user_id) REFERENCES CUSTOMER(user_id)       -- Khóa ngoại đến CUSTOMER
);
-- DATA
-- Chủ đề 1
INSERT INTO TOPIC_MESSAGE (topic_id, user_id, content)
SELECT 1, user_id, N'Tôi thường nghe nhạc nhẹ và đi dạo khi cảm thấy thèm thuốc.'
FROM CUSTOMER WHERE username = 'member3';

INSERT INTO TOPIC_MESSAGE (topic_id, user_id, content)
SELECT 1, user_id, N'Thiền 10 phút mỗi sáng giúp mình rất nhiều. Mọi người nên thử!'
FROM CUSTOMER WHERE username = 'coach Thinh ';

-- Chủ đề 2
INSERT INTO TOPIC_MESSAGE (topic_id, user_id, content)
SELECT 2, user_id, N'Mỗi sáng mình uống nước chanh ấm và đọc 10 phút sách.'
FROM CUSTOMER WHERE username = 'member4';


-- 34. USER_BEHAVIOR_TASK_LOG: Lưu nhật ký các nhiệm vụ hành vi của người dùng
CREATE TABLE USER_BEHAVIOR_TASK_LOG (
    log_id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT NOT NULL,
    log_date DATE NOT NULL,
    time_slot INT NOT NULL CHECK (time_slot BETWEEN 0 AND 8),
    task_id NVARCHAR(20) NOT NULL,       -- Ví dụ: 'P3_10_2'
    is_completed BIT DEFAULT 1,          -- Mặc định là đã chọn xong (chỉ chọn 1)
    points_awarded FLOAT DEFAULT 0,      -- ⚠️ Luôn có điểm mặc định là 0
    created_at DATETIME DEFAULT GETDATE(),

    CONSTRAINT fk_behavior_user FOREIGN KEY (user_id)
        REFERENCES CUSTOMER(user_id) ON DELETE CASCADE,

    UNIQUE(user_id, log_date, time_slot) -- Mỗi user chỉ chọn 1 task/slot/ngày
);
-- DATA
INSERT INTO USER_BEHAVIOR_TASK_LOG (user_id, log_date, time_slot, task_id, is_completed, points_awarded)
SELECT user_id, CAST(GETDATE() AS DATE), 0, 'P1_test', 1, 5
FROM CUSTOMER WHERE username = 'member5';


-- 35. DIRECT_CHAT_THREAD: Quản lí từng box chat
CREATE TABLE DIRECT_CHAT_THREAD (
    thread_id INT IDENTITY(1,1) PRIMARY KEY,       -- Mã luồng chat
    member_id INT NOT NULL,                        -- Người dùng là member
    coach_id INT NOT NULL,                         -- Người dùng là coach
    created_at DATETIME DEFAULT GETDATE(),         -- Ngày tạo luồng chat

    UNIQUE(member_id, coach_id),                   -- Mỗi cặp chỉ có 1 luồng duy nhất

    FOREIGN KEY (member_id) REFERENCES CUSTOMER(user_id) ON DELETE CASCADE,
    FOREIGN KEY (coach_id) REFERENCES COACH(coach_id) ON DELETE CASCADE
);
-- DATA
DECLARE @member_id INT = (SELECT user_id FROM CUSTOMER WHERE username = 'member2');

DECLARE @coach_user_id INT = (SELECT user_id FROM CUSTOMER WHERE username = 'coach Thinh');
DECLARE @coach_id INT = (SELECT coach_id FROM COACH WHERE user_id = @coach_user_id);

-- Kiểm tra nếu chưa có thread thì mới tạo
IF NOT EXISTS (
    SELECT 1 FROM DIRECT_CHAT_THREAD WHERE member_id = @member_id AND coach_id = @coach_id
)
BEGIN
    INSERT INTO DIRECT_CHAT_THREAD (member_id, coach_id, created_at)
    VALUES (@member_id, @coach_id, GETDATE());
END;

	
-- 36. DIRECT_MESSAGE: Lưu nội dung, thời gian, file chat tư vấn Coach - Member
CREATE TABLE DIRECT_MESSAGE (
    message_id INT IDENTITY PRIMARY KEY,         -- Khóa chính tự tăng
    thread_id INT NULL,                          -- Liên kết đến DIRECT_CHAT_THREAD
    sender_id INT NULL,                          -- ID người gửi
    sender_role VARCHAR(20) NOT NULL CHECK (
        sender_role IN ('member', 'coach')
    ),
    message NVARCHAR(MAX) NOT NULL,              -- Nội dung
    file_url NVARCHAR(MAX) NULL,                 -- File đính kèm
    sent_at DATETIME DEFAULT GETDATE(),          -- Thời điểm gửi
    is_read BIT DEFAULT 0,                       -- Đã đọc hay chưa

    CONSTRAINT fk_directmsg_thread FOREIGN KEY (thread_id) REFERENCES DIRECT_CHAT_THREAD(thread_id) ON DELETE SET NULL,
    CONSTRAINT fk_directmsg_sender FOREIGN KEY (sender_id) REFERENCES CUSTOMER(user_id) ON DELETE NO ACTION
);
-- DATA
DECLARE @thread_id1 INT;
-- Lấy thread_id vừa tạo hoặc đã tồn tại
SELECT @thread_id1 = thread_id
FROM DIRECT_CHAT_THREAD
WHERE member_id = @member_id AND coach_id = @coach_id;
-- Coach → Member
INSERT INTO DIRECT_MESSAGE (thread_id, sender_id, sender_role, message, file_url)
VALUES (
    @thread_id1,
    @coach_user_id,
    'coach',
    N'Chào bạn, chúng ta sẽ bắt đầu buổi tư vấn lúc 9h nhé!',
    NULL
);
-- Member → Coach
INSERT INTO DIRECT_MESSAGE (thread_id, sender_id, sender_role, message, file_url)
VALUES (
    @thread_id1,
    @member_id,
    'member',
    N'Dạ vâng, em đã sẵn sàng!',
    NULL
);


-- 37. BEHAVIOR_PHASES: Lưu mã và tên giai đoạn hành vi (P1–P5)
CREATE TABLE BEHAVIOR_PHASES (
    id INT IDENTITY(1,1) PRIMARY KEY,                    -- Khóa chính tự tăng
    phase_code NVARCHAR(10) NOT NULL UNIQUE,             -- Mã giai đoạn (P1, P2, ...)
    phase_name NVARCHAR(255) NOT NULL,                   -- Tên giai đoạn (trùng với phases.goal)
    phase_order INT NOT NULL,                            -- Thứ tự giai đoạn
    created_at DATETIME2 DEFAULT GETDATE(),              -- Ngày tạo
    updated_at DATETIME2 DEFAULT GETDATE()               -- Ngày cập nhật
);
-- 37.1 Add Data 
INSERT INTO BEHAVIOR_PHASES (phase_code, phase_name, phase_order) 
VALUES
(N'P1', N'Nhận diện – Giảm nhẹ liều', 1),
(N'P2', N'Cắt giảm quyết liệt', 2),
(N'P3', N'Còn hút ít, chuẩn bị cai', 3),
(N'P4', N'Cai hoàn toàn – vẫn khó chịu', 4),
(N'P5', N'Củng cố, không hút trở lại', 5);


-- 38. PHASES: Lưu thông tin giai đoạn theo % quá trình cai thuốc
CREATE TABLE PHASES (
    id INT IDENTITY(1,1) PRIMARY KEY,                    -- Khóa chính tự tăng
    phase_name NVARCHAR(255) NOT NULL,                   -- Tên giai đoạn (ví dụ: Giai đoạn 1)
    range_start INT NOT NULL,                            -- % bắt đầu giai đoạn (ví dụ: 0)
    range_end INT NOT NULL,                              -- % kết thúc giai đoạn (ví dụ: 20)
    goal NVARCHAR(MAX) NOT NULL,                         -- Mục tiêu giai đoạn (ví dụ: Nhận diện – Giảm nhẹ liều)
    phase_order INT NOT NULL,                            -- Thứ tự giai đoạn (1–5)
    phase_code NVARCHAR(10) NOT NULL,                     -- Mã phase tương ứng với behavior_phases (P1–P5)
    created_at DATETIME2 DEFAULT GETDATE(),              -- Ngày tạo bản ghi
    updated_at DATETIME2 DEFAULT GETDATE()               -- Ngày cập nhật bản ghi

    CONSTRAINT FK_PHASES_BEHAVIOR_CODE FOREIGN KEY (phase_code) REFERENCES BEHAVIOR_PHASES(phase_code) ON DELETE NO ACTION
);
-- 38.1 Add Data PHASES
INSERT INTO PHASES (phase_name, range_start, range_end, goal, phase_order, phase_code)
VALUES
(N'Giai đoạn 1', 0, 20, N'Nhận diện – Giảm nhẹ liều', 1, 'P1'),
(N'Giai đoạn 2', 20, 40, N'Cắt giảm quyết liệt', 2, 'P2'),
(N'Giai đoạn 3', 40, 60, N'Còn hút ít, chuẩn bị cai', 3, 'P3'),
(N'Giai đoạn 4', 60, 80, N'Cai hoàn toàn – vẫn khó chịu', 4, 'P4'),
(N'Giai đoạn 5', 80, 100, N'Củng cố, không hút trở lại', 5, 'P5');


-- 39. BEHAVIOR_TASKS: Lưu danh sách nhiệm vụ theo từng phase_code và khung giờ
CREATE TABLE BEHAVIOR_TASKS (
    id INT IDENTITY(1,1) PRIMARY KEY,                    -- Khóa chính tự tăng
    phase_code NVARCHAR(10) NOT NULL,                    -- Mã giai đoạn (P1, P2, ...)
    time_slot NVARCHAR(10) NOT NULL,                     -- Khung giờ thực hiện (ví dụ: 07:00)
    task_id NVARCHAR(20) NOT NULL UNIQUE,                -- Mã nhiệm vụ duy nhất (ví dụ: P1_07_1)
    task_description NVARCHAR(MAX) NOT NULL,             -- Mô tả nhiệm vụ chi tiết
    task_order INT NOT NULL,                             -- Thứ tự hiển thị trong cùng time_slot
    created_at DATETIME2 DEFAULT GETDATE(),              -- Ngày tạo
    updated_at DATETIME2 DEFAULT GETDATE(),              -- Ngày cập nhật

    FOREIGN KEY (phase_code) REFERENCES BEHAVIOR_PHASES(phase_code) ON DELETE CASCADE -- Xoá behavior_phase → xoá toàn bộ task liên quan
);
-- 39.1 DATA BEHAVIOR_TASKS
-- PHASE 1: Nhận diện – Giảm nhẹ liều
INSERT INTO BEHAVIOR_TASKS (phase_code, time_slot, task_id, task_description, task_order) 
VALUES
-- 07:00
(N'P1', N'07:00', N'P1_07_1', N'Ngậm kẹo nicotine 2mg + đi bộ nhanh 3 phút + ghi 3 từ mô tả cảm giác thèm', 1),
(N'P1', N'07:00', N'P1_07_2', N'Thiền quan sát cảm giác thèm 5 phút + rửa mặt lạnh + ghi thang craving 1–10', 2),
(N'P1', N'07:00', N'P1_07_3', N'Chạy tại chỗ 2 phút + xịt nicotine 1 lần + vẽ nhanh khuôn mặt thèm thuốc', 3),
-- 08:00
(N'P1', N'08:00', N'P1_08_1', N'Dán nicotine 16h + đi bộ nhẹ 3 phút + uống nước lọc', 1),
(N'P1', N'08:00', N'P1_08_2', N'Thiền hơi thở 5 phút sau ăn + viết 3 điều biết ơn', 2),
(N'P1', N'08:00', N'P1_08_3', N'Nghe podcast Coach hướng dẫn xử lý sau ăn + ghi cảm xúc', 3),
-- 10:00
(N'P1', N'10:00', N'P1_10_1', N'Ghi nhanh lý do hút thuốc + vẽ mũi tên hướng thay thế', 1),
(N'P1', N'10:00', N'P1_10_2', N'Uống trà thảo mộc + vươn vai + ghi 1 điều đang lo', 2),
(N'P1', N'10:00', N'P1_10_3', N'Thiền kiểm soát cảm xúc 5 phút + đánh giá thèm thuốc', 3),
-- 12:00
(N'P1', N'12:00', N'P1_12_1', N'Đi cầu thang 2 tầng sau ăn + chụp ảnh báo Coach', 1),
(N'P1', N'12:00', N'P1_12_2', N'Viết nhật ký cảm giác sau ăn khi không hút', 2),
(N'P1', N'12:00', N'P1_12_3', N'Nghe âm thanh thư giãn 4 phút + uống nước lọc', 3),
-- 14:00
(N'P1', N'14:00', N'P1_14_1', N'Uống nước lạnh + đi bộ nhẹ 3 phút + thở sâu 3 lần', 1),
(N'P1', N'14:00', N'P1_14_2', N'Thiền tỉnh táo 5 phút + ghi nhật ký lý do muốn bỏ thuốc', 2),
(N'P1', N'14:00', N'P1_14_3', N'Vẽ tranh đơn giản về trạng thái cảm xúc lúc đó + viết 1 câu miêu tả', 3),
-- 16:00
(N'P1', N'16:00', N'P1_16_1', N'Gửi tin nhắn cho Coach xin hướng dẫn + uống trà', 1),
(N'P1', N'16:00', N'P1_16_2', N'Viết lại tình huống khiến bạn stress + 1 cách đối phó', 2),
(N'P1', N'16:00', N'P1_16_3', N'Thực hiện 5 phút yoga cổ vai gáy theo video Coach cung cấp', 3),
-- 18:00
(N'P1', N'18:00', N'P1_18_1', N'Ngậm kẹo bạc hà + uống nước lạnh + đi bộ 2 phút', 1),
(N'P1', N'18:00', N'P1_18_2', N'Chuẩn bị bữa ăn nhẹ lành mạnh + ghi lại cảm xúc trước/sau', 2),
(N'P1', N'18:00', N'P1_18_3', N'Làm nhiệm vụ hệ thống chọn sẵn (nút ngẫu nhiên)', 3),
-- 20:00
(N'P1', N'20:00', N'P1_20_1', N'Đọc 1 bài viết ngắn về lợi ích bỏ thuốc + ghi cảm nhận', 1),
(N'P1', N'20:00', N'P1_20_2', N'Ghi lại cảm xúc của bạn sau bữa tối', 2),
(N'P1', N'20:00', N'P1_20_3', N'Xem lại ảnh đồ ăn/hoạt động khỏe mạnh đã thực hiện trong ngày', 3),
-- 22:00
(N'P1', N'22:00', N'P1_22_1', N'Viết 1 dòng nhật ký cảm xúc cuối ngày + đánh giá 1–10', 1),
(N'P1', N'22:00', N'P1_22_2', N'Thiền thư giãn 7 phút trước khi ngủ', 2),
(N'P1', N'22:00', N'P1_22_3', N'Đọc lại nhật ký lý do bỏ thuốc đã viết', 3);

-- PHASE 2: Cắt giảm quyết liệt
INSERT INTO BEHAVIOR_TASKS (phase_code, time_slot, task_id, task_description, task_order) 
VALUES
-- 07:00
(N'P2', N'07:00', N'P2_07_1', N'Chạy bộ nhẹ 5 phút + uống nước ấm + ghi cảm xúc đầu ngày', 1),
(N'P2', N'07:00', N'P2_07_2', N'Thiền định buổi sáng 7 phút + viết mục tiêu hôm nay', 2),
(N'P2', N'07:00', N'P2_07_3', N'Tập thể dục tại chỗ 5 phút + ăn 1 trái chuối (giàu dopamine)', 3),
-- 08:00
(N'P2', N'08:00', N'P2_08_1', N'Ăn sáng với trứng + trái cây + ghi lại cảm giác sau ăn', 1),
(N'P2', N'08:00', N'P2_08_2', N'Nghe nhạc thư giãn 5 phút + đi bộ chậm 4 phút', 2),
(N'P2', N'08:00', N'P2_08_3', N'Tự massage cổ vai gáy 3 phút + viết 3 điều mong chờ trong ngày', 3),
-- 10:00
(N'P2', N'10:00', N'P2_10_1', N'Ghi lại 1 lần muốn hút thuốc gần đây + viết cách vượt qua', 1),
(N'P2', N'10:00', N'P2_10_2', N'Thiền thở sâu 6 phút + uống trà gừng', 2),
(N'P2', N'10:00', N'P2_10_3', N'Vẽ cảm xúc + chia sẻ lên nhật ký hệ thống', 3),
-- 12:00
(N'P2', N'12:00', N'P2_12_1', N'Ăn trưa chay nhẹ + đi bộ 3 phút sau ăn', 1),
(N'P2', N'12:00', N'P2_12_2', N'Đọc bài viết về tác hại thuốc lá + ghi lại 1 điều ấn tượng', 2),
(N'P2', N'12:00', N'P2_12_3', N'Tập động tác yoga nhẹ nhàng 5 phút', 3),
-- 14:00
(N'P2', N'14:00', N'P2_14_1', N'Chạy tại chỗ 3 phút + uống nước + đánh giá cảm giác', 1),
(N'P2', N'14:00', N'P2_14_2', N'Thiền kiểm soát cảm xúc 5 phút + ghi nhật ký', 2),
(N'P2', N'14:00', N'P2_14_3', N'Gọi điện cho người ủng hộ + chia sẻ tiến trình', 3),
-- 16:00
(N'P2', N'16:00', N'P2_16_1', N'Bơi/đạp xe 10 phút (nếu có điều kiện) + ghi nhật ký', 1),
(N'P2', N'16:00', N'P2_16_2', N'Vẽ bản đồ tiến trình cai thuốc + đánh dấu ngày hiện tại', 2),
(N'P2', N'16:00', N'P2_16_3', N'Làm 1 việc thiện nhỏ trong ngày + viết cảm nhận', 3),
-- 18:00
(N'P2', N'18:00', N'P2_18_1', N'Chuẩn bị bữa tối lành mạnh giàu đạm + chụp ảnh lưu giữ', 1),
(N'P2', N'18:00', N'P2_18_2', N'Lắng nghe 1 đoạn audio truyền động lực Coach', 2),
(N'P2', N'18:00', N'P2_18_3', N'Viết thư cho bản thân tương lai không hút thuốc', 3),
-- 20:00
(N'P2', N'20:00', N'P2_20_1', N'Đi bộ thư giãn 5 phút + ngửi tinh dầu cam/quế', 1),
(N'P2', N'20:00', N'P2_20_2', N'Ghi lại cảm xúc cuối ngày và điều thành công nhỏ', 2),
(N'P2', N'20:00', N'P2_20_3', N'Thiền buông thư cơ thể 7 phút', 3),
-- 22:00
(N'P2', N'22:00', N'P2_22_1', N'Tắm nước ấm + uống sữa ấm (giảm thèm) + ngủ sớm', 1),
(N'P2', N'22:00', N'P2_22_2', N'Ghi nhật ký lý do mình xứng đáng được sống khỏe', 2),
(N'P2', N'22:00', N'P2_22_3', N'Nghe nhạc nhẹ thư giãn 10 phút', 3);

-- PHASE 3: Còn hút ít, chuẩn bị cai
INSERT INTO BEHAVIOR_TASKS (phase_code, time_slot, task_id, task_description, task_order) 
VALUES
-- 07:00
(N'P3', N'07:00', N'P3_07_1', N'Chạy bộ nhẹ 5 phút + uống nước ấm + ghi cảm xúc đầu ngày', 1),
(N'P3', N'07:00', N'P3_07_2', N'Thiền định buổi sáng 7 phút + viết mục tiêu hôm nay', 2),
(N'P3', N'07:00', N'P3_07_3', N'Tập thể dục tại chỗ 5 phút + ăn 1 trái chuối (giàu dopamine)', 3),
-- 08:00
(N'P3', N'08:00', N'P3_08_1', N'Ăn sáng với trứng + trái cây + ghi lại cảm giác sau ăn', 1),
(N'P3', N'08:00', N'P3_08_2', N'Nghe nhạc thư giãn 5 phút + đi bộ chậm 4 phút', 2),
(N'P3', N'08:00', N'P3_08_3', N'Tự massage cổ vai gáy 3 phút + viết 3 điều mong chờ trong ngày', 3),
-- 10:00
(N'P3', N'10:00', N'P3_10_1', N'Ghi lại 1 lần muốn hút thuốc gần đây + viết cách vượt qua', 1),
(N'P3', N'10:00', N'P3_10_2', N'Thiền thở sâu 6 phút + uống trà gừng', 2),
(N'P3', N'10:00', N'P3_10_3', N'Vẽ cảm xúc + chia sẻ lên nhật ký hệ thống', 3),
-- 12:00
(N'P3', N'12:00', N'P3_12_1', N'Ăn trưa chay nhẹ + đi bộ 3 phút sau ăn', 1),
(N'P3', N'12:00', N'P3_12_2', N'Đọc bài viết về tác hại thuốc lá + ghi lại 1 điều ấn tượng', 2),
(N'P3', N'12:00', N'P3_12_3', N'Tập động tác yoga nhẹ nhàng 5 phút', 3),
-- 14:00
(N'P3', N'14:00', N'P3_14_1', N'Chạy tại chỗ 3 phút + uống nước + đánh giá cảm giác', 1),
(N'P3', N'14:00', N'P3_14_2', N'Thiền kiểm soát cảm xúc 5 phút + ghi nhật ký', 2),
(N'P3', N'14:00', N'P3_14_3', N'Gọi điện cho người ủng hộ + chia sẻ tiến trình', 3),
-- 16:00
(N'P3', N'16:00', N'P3_16_1', N'Bơi/đạp xe 10 phút (nếu có điều kiện) + ghi nhật ký', 1),
(N'P3', N'16:00', N'P3_16_2', N'Vẽ bản đồ tiến trình cai thuốc + đánh dấu ngày hiện tại', 2),
(N'P3', N'16:00', N'P3_16_3', N'Làm 1 việc thiện nhỏ trong ngày + viết cảm nhận', 3),
-- 18:00
(N'P3', N'18:00', N'P3_18_1', N'Chuẩn bị bữa tối lành mạnh giàu đạm + chụp ảnh lưu giữ', 1),
(N'P3', N'18:00', N'P3_18_2', N'Lắng nghe 1 đoạn audio truyền động lực Coach', 2),
(N'P3', N'18:00', N'P3_18_3', N'Viết thư cho bản thân tương lai không hút thuốc', 3),
-- 20:00
(N'P3', N'20:00', N'P3_20_1', N'Đi bộ thư giãn 5 phút + ngửi tinh dầu cam/quế', 1),
(N'P3', N'20:00', N'P3_20_2', N'Ghi lại cảm xúc cuối ngày và điều thành công nhỏ', 2),
(N'P3', N'20:00', N'P3_20_3', N'Thiền buông thư cơ thể 7 phút', 3),
-- 22:00
(N'P3', N'22:00', N'P3_22_1', N'Tắm nước ấm + uống sữa ấm (giảm thèm) + ngủ sớm', 1),
(N'P3', N'22:00', N'P3_22_2', N'Ghi nhật ký lý do mình xứng đáng được sống khỏe', 2),
(N'P3', N'22:00', N'P3_22_3', N'Nghe nhạc nhẹ thư giãn 10 phút', 3);

-- PHASE 4: Cai hoàn toàn – vẫn khó chịu
INSERT INTO BEHAVIOR_TASKS (phase_code, time_slot, task_id, task_description, task_order) 
VALUES
-- 07:00
(N'P4', N'07:00', N'P4_07_1', N'Chạy bộ nhẹ 5 phút + uống nước ấm + ghi cảm xúc đầu ngày', 1),
(N'P4', N'07:00', N'P4_07_2', N'Thiền định buổi sáng 7 phút + viết mục tiêu hôm nay', 2),
(N'P4', N'07:00', N'P4_07_3', N'Tập thể dục tại chỗ 5 phút + ăn 1 trái chuối (giàu dopamine)', 3),
-- 08:00
(N'P4', N'08:00', N'P4_08_1', N'Ăn sáng với trứng + trái cây + ghi lại cảm giác sau ăn', 1),
(N'P4', N'08:00', N'P4_08_2', N'Nghe nhạc thư giãn 5 phút + đi bộ chậm 4 phút', 2),
(N'P4', N'08:00', N'P4_08_3', N'Tự massage cổ vai gáy 3 phút + viết 3 điều mong chờ trong ngày', 3),
-- 10:00
(N'P4', N'10:00', N'P4_10_1', N'Ghi lại 1 lần muốn hút thuốc gần đây + viết cách vượt qua', 1),
(N'P4', N'10:00', N'P4_10_2', N'Thiền thở sâu 6 phút + uống trà gừng', 2),
(N'P4', N'10:00', N'P4_10_3', N'Vẽ cảm xúc + chia sẻ lên nhật ký hệ thống', 3),
-- 12:00
(N'P4', N'12:00', N'P4_12_1', N'Ăn trưa chay nhẹ + đi bộ 3 phút sau ăn', 1),
(N'P4', N'12:00', N'P4_12_2', N'Đọc bài viết về tác hại thuốc lá + ghi lại 1 điều ấn tượng', 2),
(N'P4', N'12:00', N'P4_12_3', N'Tập động tác yoga nhẹ nhàng 5 phút', 3),
-- 14:00
(N'P4', N'14:00', N'P4_14_1', N'Chạy tại chỗ 3 phút + uống nước + đánh giá cảm giác', 1),
(N'P4', N'14:00', N'P4_14_2', N'Thiền kiểm soát cảm xúc 5 phút + ghi nhật ký', 2),
(N'P4', N'14:00', N'P4_14_3', N'Gọi điện cho người ủng hộ + chia sẻ tiến trình', 3),
-- 16:00
(N'P4', N'16:00', N'P4_16_1', N'Bơi/đạp xe 10 phút (nếu có điều kiện) + ghi nhật ký', 1),
(N'P4', N'16:00', N'P4_16_2', N'Vẽ bản đồ tiến trình cai thuốc + đánh dấu ngày hiện tại', 2),
(N'P4', N'16:00', N'P4_16_3', N'Làm 1 việc thiện nhỏ trong ngày + viết cảm nhận', 3),
-- 18:00
(N'P4', N'18:00', N'P4_18_1', N'Chuẩn bị bữa tối lành mạnh giàu đạm + chụp ảnh lưu giữ', 1),
(N'P4', N'18:00', N'P4_18_2', N'Lắng nghe 1 đoạn audio truyền động lực Coach', 2),
(N'P4', N'18:00', N'P4_18_3', N'Viết thư cho bản thân tương lai không hút thuốc', 3),
-- 20:00
(N'P4', N'20:00', N'P4_20_1', N'Đi bộ thư giãn 5 phút + ngửi tinh dầu cam/quế', 1),
(N'P4', N'20:00', N'P4_20_2', N'Ghi lại cảm xúc cuối ngày và điều thành công nhỏ', 2),
(N'P4', N'20:00', N'P4_20_3', N'Thiền buông thư cơ thể 7 phút', 3),
-- 22:00
(N'P4', N'22:00', N'P4_22_1', N'Tắm nước ấm + uống sữa ấm (giảm thèm) + ngủ sớm', 1),
(N'P4', N'22:00', N'P4_22_2', N'Ghi nhật ký lý do mình xứng đáng được sống khỏe', 2),
(N'P4', N'22:00', N'P4_22_3', N'Nghe nhạc nhẹ thư giãn 10 phút', 3);

-- PHASE 5: Củng cố, không hút trở lại
INSERT INTO BEHAVIOR_TASKS (phase_code, time_slot, task_id, task_description, task_order) 
VALUES
-- 07:00
(N'P5', N'07:00', N'P5_07_1', N'Chạy bộ nhẹ 5 phút + uống nước ấm + ghi cảm xúc đầu ngày', 1),
(N'P5', N'07:00', N'P5_07_2', N'Thiền định buổi sáng 7 phút + viết mục tiêu hôm nay', 2),
(N'P5', N'07:00', N'P5_07_3', N'Tập thể dục tại chỗ 5 phút + ăn 1 trái chuối (giàu dopamine)', 3),
-- 08:00
(N'P5', N'08:00', N'P5_08_1', N'Ăn sáng với trứng + trái cây + ghi lại cảm giác sau ăn', 1),
(N'P5', N'08:00', N'P5_08_2', N'Nghe nhạc thư giãn 5 phút + đi bộ chậm 4 phút', 2),
(N'P5', N'08:00', N'P5_08_3', N'Tự massage cổ vai gáy 3 phút + viết 3 điều mong chờ trong ngày', 3),
-- 10:00
(N'P5', N'10:00', N'P5_10_1', N'Ghi lại 1 lần bạn vượt qua cơn thèm gần đây + ăn mừng nhẹ', 1),
(N'P5', N'10:00', N'P5_10_2', N'Thiền duy trì động lực 5 phút + ghi lại lý do bạn làm được', 2),
(N'P5', N'10:00', N'P5_10_3', N'Tạo infographic về hành trình đã qua + chia sẻ với Coach', 3),
-- 12:00
(N'P5', N'12:00', N'P5_12_1', N'Ăn trưa lành mạnh + uống nước sau ăn + đi bộ 3 phút', 1),
(N'P5', N'12:00', N'P5_12_2', N'Xem lại nhật ký cảm xúc các tuần trước', 2),
(N'P5', N'12:00', N'P5_12_3', N'Thực hiện vài động tác yoga hoặc giãn cơ nhẹ nhàng', 3),
-- 14:00
(N'P5', N'14:00', N'P5_14_1', N'Chạy tại chỗ 3 phút + đánh giá trạng thái hiện tại', 1),
(N'P5', N'14:00', N'P5_14_2', N'Thiền buông bỏ lo lắng + viết 1 câu nhắn gửi cho bản thân', 2),
(N'P5', N'14:00', N'P5_14_3', N'Lập kế hoạch cho hoạt động lành mạnh cuối tuần', 3),
-- 16:00
(N'P5', N'16:00', N'P5_16_1', N'Bơi/đạp xe nhẹ 10 phút + uống nước', 1),
(N'P5', N'16:00', N'P5_16_2', N'Xem video truyền cảm hứng từ người bỏ thuốc thành công', 2),
(N'P5', N'16:00', N'P5_16_3', N'Ghi lại mục tiêu mới không còn liên quan đến thuốc lá', 3),
-- 18:00
(N'P5', N'18:00', N'P5_18_1', N'Chuẩn bị bữa tối cân bằng dinh dưỡng + ngồi ăn không dùng điện thoại', 1),
(N'P5', N'18:00', N'P5_18_2', N'Chia sẻ 1 bài học bạn rút ra hôm nay', 2),
(N'P5', N'18:00', N'P5_18_3', N'Ghi lại điều bạn tự hào nhất trong quá trình cai thuốc', 3),
-- 20:00
(N'P5', N'20:00', N'P5_20_1', N'Đi bộ nhẹ sau bữa tối + hít thở sâu', 1),
(N'P5', N'20:00', N'P5_20_2', N'Viết thư cảm ơn cho người đã hỗ trợ bạn bỏ thuốc', 2),
(N'P5', N'20:00', N'P5_20_3', N'Ghi chép về cách bạn sẽ duy trì lối sống không thuốc', 3),
-- 22:00
(N'P5', N'22:00', N'P5_22_1', N'Tắm nước ấm thư giãn + hít tinh dầu nhẹ', 1),
(N'P5', N'22:00', N'P5_22_2', N'Ghi nhận 3 điều bạn biết ơn trong ngày', 2),
(N'P5', N'22:00', N'P5_22_3', N'Nghe nhạc nhẹ trước khi ngủ + viết 1 dòng truyền cảm hứng cho ngày mai', 3);


-- ================================================
-- 21. SUBSCRIPTION & PAYMENT – Test cho member6 (4 gói)
-- ================================================

SET NOCOUNT ON;

DECLARE @now     DATETIME = GETDATE();
DECLARE @today   DATE = GETDATE();
DECLARE @userId  INT;
DECLARE @subId   INT;

-- Lấy user_id từ username
SELECT @userId = user_id FROM CUSTOMER WHERE username = 'member6';

-- ─────────────────────────────────────────────
-- (1) Tạo subscription 3 tháng – package_id = 3
-- ─────────────────────────────────────────────
INSERT INTO USER_SUBSCRIPTION
    (user_id, package_id, start_date, end_date,
     auto_renew, payment_status)
VALUES
    (@userId, 3, @today, DATEADD(DAY, 90, @today),
     0, 'paid');

SET @subId = SCOPE_IDENTITY();

INSERT INTO PAYMENT
    (subscription_id, amount, payment_date,
     transaction_id, payment_method, payment_status,
     note, order_code)
VALUES
    (@subId, 2690000, @today,
     CONCAT('TEST_', NEWID()), 'redirect', 'paid',
     N'Thanh toán gói Premium 3 tháng (test)',
     100000 + ABS(CHECKSUM(NEWID())) % 900000);

-- ─────────────────────────────────────────────
-- (2) Tạo subscription 6 tháng – package_id = 4
-- ─────────────────────────────────────────────
DECLARE @sub6Id INT;

INSERT INTO USER_SUBSCRIPTION
    (user_id, package_id, start_date, end_date,
     auto_renew, payment_status)
VALUES
    (@userId, 4, @today, DATEADD(DAY, 180, @today),
     0, 'paid');

SET @sub6Id = SCOPE_IDENTITY();

INSERT INTO PAYMENT
    (subscription_id, amount, payment_date,
     order_code, transaction_id, payment_method,
     payment_status, note)
VALUES
    (@sub6Id, 5490000, @today,
     100000 + ABS(CHECKSUM(NEWID())) % 900000,
     NEWID(), 'redirect', 'paid',
     N'Thanh toán gói Premium 6 tháng (test)');

-- ─────────────────────────────────────────────
-- (3) Tạo subscription 10 ngày – package_id = 7
-- ─────────────────────────────────────────────
DECLARE @sub10Id INT;

INSERT INTO USER_SUBSCRIPTION
    (user_id, package_id, start_date, end_date,
     auto_renew, payment_status)
VALUES
    (@userId, 1, @today, DATEADD(DAY, 10, @today),
     0, 'paid');

SET @sub10Id = SCOPE_IDENTITY();

INSERT INTO PAYMENT
    (subscription_id, amount, payment_date,
     order_code, transaction_id, payment_method,
     payment_status, note)
VALUES
    (@sub10Id, 10000, @today,
     100000 + ABS(CHECKSUM(NEWID())) % 900000,
     NEWID(), 'redirect', 'paid',
     N'Thanh toán gói Test 10 ngày (test)');

-- ─────────────────────────────────────────────
-- (4) Tạo subscription 1 tháng đã dùng 5 ngày – package_id = 2
-- ─────────────────────────────────────────────
DECLARE @sub30Id INT;
DECLARE @start DATE = DATEADD(DAY, -5, @today);
DECLARE @end   DATE = DATEADD(DAY, 25, @today);

INSERT INTO USER_SUBSCRIPTION
    (user_id, package_id, start_date, end_date,
     auto_renew, payment_status)
VALUES
    (@userId, 2, @start, @end, 0, 'paid');

SET @sub30Id = SCOPE_IDENTITY();

INSERT INTO PAYMENT
    (subscription_id, amount, payment_date,
     order_code, transaction_id, payment_method,
     payment_status, note)
VALUES
    (@sub30Id, 99000, @start,
     100000 + ABS(CHECKSUM(NEWID())) % 900000,
     NEWID(), 'redirect', 'paid',
     N'Thanh toán gói Premium 1 tháng (test còn 25 ngày)');