IF DB_ID('SmokingSessation') IS NULL
BEGIN
    CREATE DATABASE SmokingSessation;
END
GO
USE SmokingSessation;
GO

-- 1. CUSTOMER: Bảng chính lưu thông tin người dùng (admin, member, coach)
IF OBJECT_ID('CUSTOMER', 'U') IS NULL
BEGIN
    CREATE TABLE CUSTOMER (
        user_id INT IDENTITY(1,1) PRIMARY KEY,                       -- Khóa chính tự động tăng
        username NVARCHAR(100) NOT NULL UNIQUE,                     -- Tên đăng nhập (cho phép tiếng Việt, không trùng lặp)
        password_hash VARCHAR(255) NULL,                            -- Mật khẩu mã hóa (null nếu dùng Google Login)
        full_name NVARCHAR(100) NOT NULL,                           -- Họ tên đầy đủ (có dấu, tiếng Việt)
        email VARCHAR(100) NOT NULL UNIQUE,                         -- Email duy nhất
        phone_number VARCHAR(20) NULL,                              -- Số điện thoại (có thể null)
        date_of_birth DATE NULL,                                    -- Ngày sinh (có thể bỏ qua)
        registration_date DATE NOT NULL,                            -- Ngày đăng ký
        user_role VARCHAR(20) NOT NULL CHECK (                      -- Vai trò: 'admin', 'member', 'coach'
            user_role IN ('admin', 'member', 'coach')
        ),
        account_status VARCHAR(20) NOT NULL,                        -- Trạng thái: 'active', 'inactive', 'banned'
        ftnd_level NVARCHAR(20) NULL CHECK (                        -- Mức độ nghiện (theo FTND): 'Low', 'Medium', 'High'
            ftnd_level IN (N'Low', N'Medium', N'High')
        )
    );
END
GO

-- 2. USER_LOGIN: Bảng lưu thông tin đăng nhập Local và Google OAuth
IF OBJECT_ID('USER_LOGIN', 'U') IS NULL
BEGIN
    CREATE TABLE USER_LOGIN (
        login_id INT IDENTITY(1,1) PRIMARY KEY,              -- Khóa chính tự tăng
        user_id INT NULL,                                    -- Khóa ngoại liên kết với CUSTOMER
        login_provider NVARCHAR(20) NOT NULL,                -- 'local' hoặc 'google'
        username NVARCHAR(100),                              -- Tên đăng nhập (chỉ dùng cho local)
        password_hash VARCHAR(255),                          -- Mật khẩu mã hóa (chỉ dùng cho local)
        google_id VARCHAR(255),                              -- ID Google (chỉ dùng cho google login)
        created_at DATETIME DEFAULT GETDATE(),               -- Ngày tạo tài khoản login

        -- Ràng buộc: Local thì phải có username và password; Google thì phải có google_id
        CONSTRAINT fk_login_user FOREIGN KEY (user_id)REFERENCES CUSTOMER(user_id) ON DELETE SET NULL,
        CONSTRAINT chk_login_data CHECK (
            (login_provider = 'local' AND username IS NOT NULL AND password_hash IS NOT NULL)
            OR
            (login_provider = 'google' AND google_id IS NOT NULL)
        )
    );
END
GO

-- 3. USER_PROFILE: Hồ sơ chi tiết thói quen hút thuốc của người dùng
IF OBJECT_ID('USER_PROFILE', 'U') IS NULL
BEGIN
    CREATE TABLE USER_PROFILE (
        profile_id INT IDENTITY(1,1) PRIMARY KEY,                -- Khóa chính tự tăng
        user_id INT NULL,                                        -- Khóa ngoại liên kết với CUSTOMER
        smoking_years INT,                                       -- Số năm hút thuốc
        daily_cigarettes INT,                                    -- Số điếu hút mỗi ngày
        monthly_expense INT,                                     -- Chi tiêu trung bình hàng tháng cho thuốc
        preferred_brand NVARCHAR(100),                           -- Nhãn hiệu thuốc ưa thích
        quit_reasons NVARCHAR(MAX),                              -- Lý do muốn bỏ thuốc
        health_issues NVARCHAR(MAX),                             -- Vấn đề sức khỏe liên quan
        target_quit_date DATE,                                   -- Ngày mục tiêu bỏ thuốc

        CONSTRAINT fk_userprofile_customer FOREIGN KEY (user_id)
            REFERENCES CUSTOMER(user_id) ON DELETE SET NULL       -- Thành null nếu user bị xóa
    );
END
GO

-- 4. SUBSCRIPTION_PACKAGE: Các gói dịch vụ người dùng có thể đăng ký
IF OBJECT_ID('SUBSCRIPTION_PACKAGE', 'U') IS NULL
BEGIN
    CREATE TABLE SUBSCRIPTION_PACKAGE (
        package_id INT IDENTITY(1,1) PRIMARY KEY,                 -- Khóa chính tự tăng
        package_name NVARCHAR(100) NOT NULL,                     -- Tên gói (ví dụ: Gói Cơ Bản, Gói Premium)
        description NVARCHAR(MAX),                               -- Mô tả chi tiết về gói
        price DECIMAL(10,2) NOT NULL,                            -- Giá gói (đơn vị: VND hoặc USD)
        duration_days INT NOT NULL,                              -- Thời gian hiệu lực tính theo ngày
        coach_access BIT DEFAULT 0,                              -- Có được quyền truy cập huấn luyện viên không
        community_access BIT DEFAULT 0,                          -- Có quyền vào cộng đồng hỗ trợ không
        premium_content BIT DEFAULT 0,                           -- Có quyền truy cập nội dung nâng cao không
        created_at DATE NOT NULL                                 -- Ngày tạo gói
    );
END
GO

-- 5. USER_SUBSCRIPTION: Lưu thông tin đăng ký gói của người dùng
IF OBJECT_ID('USER_SUBSCRIPTION', 'U') IS NULL
BEGIN
    CREATE TABLE USER_SUBSCRIPTION (
        subscription_id INT IDENTITY(1,1) PRIMARY KEY,         -- Khóa chính tự tăng
        user_id INT NULL,                                      -- Cho phép NULL để tránh lỗi cascade
        package_id INT NOT NULL,                               -- FK: Gói đã đăng ký
        start_date DATE NOT NULL,                              -- Ngày bắt đầu
        end_date DATE NOT NULL,                                -- Ngày kết thúc
        auto_renew BIT DEFAULT 0,                              -- Có tự gia hạn hay không (1: Có, 0: Không)
        payment_status NVARCHAR(20) CHECK (payment_status IN (
            'pending', 'paid', 'failed', 'expired'
        )),                                                    -- Trạng thái thanh toán hợp lệ

        CONSTRAINT fk_usersub_customer FOREIGN KEY (user_id) REFERENCES CUSTOMER(user_id) ON DELETE SET NULL,
        CONSTRAINT fk_usersub_package FOREIGN KEY (package_id) REFERENCES SUBSCRIPTION_PACKAGE(package_id)
    );
    CREATE INDEX idx_usersub_user_status ON USER_SUBSCRIPTION(user_id, payment_status);
END
GO

-- 6. PAYMENT: Lưu thông tin thanh toán của người dùng
IF OBJECT_ID('PAYMENT', 'U') IS NULL
BEGIN
    CREATE TABLE PAYMENT (
        payment_id INT IDENTITY(1,1) PRIMARY KEY,              -- Khóa chính tự tăng       
        subscription_id INT NULL,                              -- Cho phép NULL nếu subscription bị xóa
        amount DECIMAL(10,2) NOT NULL CHECK (amount >= 0),     -- Số tiền ≥ 0
        payment_date DATE NOT NULL,                            -- Ngày thực hiện thanh toán        
        transaction_id VARCHAR(100) UNIQUE,                    -- Mã giao dịch
        payment_method NVARCHAR(50),                           -- Phương thức: 'QR-Momo', 'ZaloPay', 'BankTransfer',...
        payment_status NVARCHAR(20) CHECK (
            payment_status IN ('pending', 'paid', 'failed')
        ),                                                     -- Trạng thái hợp lệ        
        qr_code_url NVARCHAR(255),                             -- Đường dẫn ảnh mã QR
        note NVARCHAR(255),                                    -- Ghi chú
        
        CONSTRAINT fk_payment_subscription 
            FOREIGN KEY (subscription_id) REFERENCES USER_SUBSCRIPTION(subscription_id) ON DELETE SET NULL
    );

    CREATE INDEX idx_payment_status ON PAYMENT(payment_status);
    CREATE INDEX idx_payment_transaction_id ON PAYMENT(transaction_id);
END
GO

-- 7. COACH: Thông tin của huấn luyện viên
IF OBJECT_ID('COACH', 'U') IS NULL
BEGIN
    CREATE TABLE COACH (
        coach_id INT IDENTITY(1,1) PRIMARY KEY,                 -- Khóa chính
        user_id INT NULL UNIQUE,                           -- Mỗi coach tương ứng 1 user duy nhất
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
END
GO

-- 8. PLAN_TEMPLATE: Mẫu kế hoạch cai thuốc dùng để tạo kế hoạch cho người dùng
IF OBJECT_ID('PLAN_TEMPLATE', 'U') IS NULL
BEGIN
    CREATE TABLE PLAN_TEMPLATE (
        template_id INT IDENTITY(1,1) PRIMARY KEY,         -- Khóa chính tự tăng
        name NVARCHAR(100) NOT NULL,                       -- Tên mẫu kế hoạch (VD: "30 ngày giảm dần")
        description NVARCHAR(MAX),                         -- Mô tả tổng quan về mẫu kế hoạch
        default_days INT CHECK (default_days > 0),         -- Số ngày mặc định cho mẫu kế hoạch
        daily_cigs INT CHECK (daily_cigs >= 0),            -- Số lượng thuốc mỗi ngày khởi đầu
        strategy NVARCHAR(MAX)                             -- Chiến lược đi kèm (mô tả chi tiết từng giai đoạn)
    );
    -- Chỉ mục phụ để tìm kiếm theo tên mẫu
    CREATE INDEX idx_template_name ON PLAN_TEMPLATE(name);
END
GO

-- 9. CESSATION_PLAN: Lưu thông tin kế hoạch cai thuốc của người dùng
IF OBJECT_ID('CESSATION_PLAN', 'U') IS NULL
BEGIN
    CREATE TABLE CESSATION_PLAN (
        plan_id INT IDENTITY(1,1) PRIMARY KEY,                     -- Khóa chính
        user_id INT NULL,                                          -- Cho phép null nếu CUSTOMER bị xóa
        plan_name NVARCHAR(100) NOT NULL,                         -- Tên kế hoạch hỗ trợ tiếng Việt
        start_date DATE NOT NULL,                                 -- Ngày bắt đầu
        end_date DATE NOT NULL,                                   -- Ngày kết thúc
        target_quit_date DATE,                                    -- Ngày mục tiêu bỏ thuốc
        frequency_per_day INT CHECK (frequency_per_day >= 0),     -- Số lần hút/ngày (>=0)
        plan_type NVARCHAR(20),                                   -- Loại kế hoạch: 'custom', 'template'
        plan_source NVARCHAR(20),                                 -- Nguồn tạo: 'user', 'coach', 'system'
        current_stage NVARCHAR(20),                               -- Giai đoạn hiện tại
        strategy NVARCHAR(MAX),                                   -- Chiến lược chi tiết
        is_active BIT DEFAULT 1,                                  -- Đang hoạt động?
        created_at DATE NOT NULL,                                 -- Ngày tạo
        last_updated DATE,                                        -- Ngày cập nhật
        template_id INT,                                          -- Khóa ngoại đến PLAN_TEMPLATE
        quit_reason_summary NVARCHAR(MAX),                        -- Tóm tắt lý do bỏ thuốc

        CONSTRAINT fk_plan_customer FOREIGN KEY (user_id) REFERENCES CUSTOMER(user_id) ON DELETE SET NULL,
        CONSTRAINT fk_plan_template FOREIGN KEY (template_id) REFERENCES PLAN_TEMPLATE(template_id),
        CONSTRAINT chk_date_range CHECK (end_date >= start_date)
    );
    CREATE INDEX idx_plan_user_active ON CESSATION_PLAN(user_id, is_active);
END
GO

-- 10. WEEKLY_QUOTA: Quy định số thuốc tối đa mỗi tuần trong kế hoạch bỏ thuốc
IF OBJECT_ID('WEEKLY_QUOTA', 'U') IS NULL
BEGIN
    CREATE TABLE WEEKLY_QUOTA (
        quota_id INT IDENTITY(1,1) PRIMARY KEY,                       -- Khóa chính tự tăng
        plan_id INT NULL,                                            -- Cho phép null nếu kế hoạch bị xóa
        week_number INT NOT NULL,                                     -- Số thứ tự tuần trong kế hoạch
        max_cigarettes INT NOT NULL,                                  -- Giới hạn số điếu thuốc
        created_at DATETIME DEFAULT GETDATE(),                        -- Ngày tạo

        CONSTRAINT fk_weeklyquota_plan FOREIGN KEY (plan_id) REFERENCES CESSATION_PLAN(plan_id) ON DELETE SET NULL,
        CONSTRAINT uq_plan_week UNIQUE(plan_id, week_number)
    );
END
GO

-- 11. PLAN_MILESTONE: Lưu các mốc quan trọng trong quá trình thực hiện kế hoạch bỏ thuốc
IF OBJECT_ID('PLAN_MILESTONE', 'U') IS NULL
BEGIN
    CREATE TABLE PLAN_MILESTONE (
        milestone_id INT IDENTITY(1,1) PRIMARY KEY,          -- Khóa chính tự tăng
        plan_id INT NULL,                                    -- Cho phép null để dùng SET NULL
        title VARCHAR(100),                                  -- Tên mốc
        description TEXT,                                    -- Mô tả chi tiết
        start_date DATE,                                     -- Ngày bắt đầu
        target_date DATE,                                    -- Ngày dự kiến hoàn thành
        is_completed BIT DEFAULT 0,                          -- Trạng thái hoàn thành
        completion_date DATE,                                -- Ngày hoàn thành

        CONSTRAINT fk_milestone_plan FOREIGN KEY (plan_id) REFERENCES CESSATION_PLAN(plan_id) ON DELETE SET NULL
    );
END
GO

-- 12. PLAN_FEEDBACK: Lưu phản hồi của huấn luyện viên (Coach) về kế hoạch bỏ thuốc
IF OBJECT_ID('PLAN_FEEDBACK', 'U') IS NULL
BEGIN
    CREATE TABLE PLAN_FEEDBACK (
        feedback_id INT IDENTITY(1,1) PRIMARY KEY,         -- Khóa chính tự tăng
        plan_id INT NULL,                                  -- Cho phép null nếu kế hoạch bị xóa
        coach_id INT NULL,                                 -- Cho phép null nếu coach bị xóa
        feedback_text TEXT,                                -- Nội dung phản hồi chi tiết
        submitted_at DATETIME NOT NULL,                    -- Thời điểm phản hồi
        feedback_context VARCHAR(20),                      -- Bối cảnh: 'initial', 'weekly', 'final', ...

        CONSTRAINT fk_feedback_plan FOREIGN KEY (plan_id) REFERENCES CESSATION_PLAN(plan_id) ON DELETE SET NULL,
        CONSTRAINT fk_feedback_coach FOREIGN KEY (coach_id) REFERENCES COACH(coach_id) ON DELETE SET NULL
    );
END
GO

-- 13. SMOKING_LOG: Ghi lại hành vi hút thuốc của người dùng theo thời gian
IF OBJECT_ID('SMOKING_LOG', 'U') IS NULL
BEGIN
    CREATE TABLE SMOKING_LOG (
        log_id INT IDENTITY(1,1) PRIMARY KEY,                  -- Mã log tự tăng
        user_id INT NULL,                                      -- Cho phép null nếu user bị xóa
        timestamp DATETIME NOT NULL,                           -- Thời điểm ghi nhận hành vi
        cigarettes_count INT CHECK (cigarettes_count >= 0),    -- Số điếu
        trigger_situation NVARCHAR(100),                       -- Tình huống hút
        location NVARCHAR(100),                                -- Địa điểm
        notes NVARCHAR(MAX),                                   -- Ghi chú

        CONSTRAINT fk_smokinglog_customer FOREIGN KEY (user_id) REFERENCES CUSTOMER(user_id) ON DELETE SET NULL
    );
END
GO

-- 14. DAILY_SMOKING_SUMMARY: Tổng hợp số điếu thuốc mỗi ngày theo user và kế hoạch
IF OBJECT_ID('DAILY_SMOKING_SUMMARY', 'U') IS NULL
BEGIN
    CREATE TABLE DAILY_SMOKING_SUMMARY (
        id INT IDENTITY(1,1) PRIMARY KEY,                      -- Khóa chính tự tăng
        user_id INT NULL,                                      -- Cho phép null nếu user bị xóa
        date DATE NOT NULL,                                    -- Ngày cụ thể
        total_cigarettes INT CHECK (total_cigarettes >= 0),    -- Tổng số điếu hút
        relapsed BIT DEFAULT 0,                                -- Đánh dấu tái nghiện
        -- plan_id INT,                                           -- Liên kết kế hoạch (có thể null)

        CONSTRAINT fk_dsm_summary_customer FOREIGN KEY (user_id) REFERENCES CUSTOMER(user_id) ON DELETE SET NULL,
        -- CONSTRAINT fk_dsm_summary_plan FOREIGN KEY (plan_id) REFERENCES CESSATION_PLAN(plan_id) ON DELETE SET NULL
    );
END
GO

-- 15. PROGRESS_TRACKER: Theo dõi tiến độ bỏ thuốc của người dùng
IF OBJECT_ID('PROGRESS_TRACKER', 'U') IS NULL
BEGIN
    CREATE TABLE PROGRESS_TRACKER (
        tracker_id INT IDENTITY(1,1) PRIMARY KEY,                  -- Khóa chính tự tăng
        user_id INT NULL,                                          -- Cho phép null nếu user bị xóa
        record_date DATE NOT NULL,                                 -- Ngày ghi nhận
        smoke_free_days INT CHECK (smoke_free_days >= 0),          -- Số ngày không hút
        money_saved DECIMAL(10,2) CHECK (money_saved >= 0),        -- Tiền tiết kiệm
        avoided_cigarettes INT CHECK (avoided_cigarettes >= 0),    -- Điếu tránh được
        health_improvements TEXT,                                  -- Ghi chú cải thiện sức khỏe

        CONSTRAINT fk_progress_customer FOREIGN KEY (user_id) REFERENCES CUSTOMER(user_id) ON DELETE SET NULL
    );
END
GO

-- 16. FTND_RESULT: Lưu kết quả bài test FTND đánh giá mức độ nghiện
IF OBJECT_ID('FTND_RESULT', 'U') IS NULL
BEGIN
    CREATE TABLE FTND_RESULT (
        result_id INT IDENTITY(1,1) PRIMARY KEY,                               -- Khóa chính tự tăng
        user_id INT NULL,                                                      -- Cho phép null nếu user bị xóa
        level NVARCHAR(20) NOT NULL CHECK (level IN (N'Low', N'Medium', N'High')),  -- Mức độ nghiện
        submitted_at DATETIME DEFAULT GETDATE(),                               -- Thời gian nộp

        CONSTRAINT fk_ftnd_user FOREIGN KEY (user_id) REFERENCES CUSTOMER(user_id) ON DELETE SET NULL
    );
END
GO

-- 17. COACH_SCHEDULE: Lịch làm việc của huấn luyện viên
IF OBJECT_ID('COACH_SCHEDULE', 'U') IS NULL
BEGIN
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
END
GO

-- 18. COACHING_SESSION: Lưu thông tin các phiên làm việc giữa Coach và Member
IF OBJECT_ID('COACHING_SESSION', 'U') IS NULL
BEGIN
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
        google_meet_link VARCHAR(255),                                    -- Link Google Meet (nếu là phiên online)
        session_notes TEXT,                                               -- Ghi chú sau phiên
        created_at DATETIME DEFAULT GETDATE(),                            -- Ngày tạo phiên

        CONSTRAINT fk_coaching_user FOREIGN KEY (user_id) REFERENCES CUSTOMER(user_id) ON DELETE SET NULL,     
        CONSTRAINT fk_coaching_coach FOREIGN KEY (coach_id) REFERENCES COACH(coach_id) ON DELETE SET NULL,   
        CONSTRAINT fk_session_schedule FOREIGN KEY (schedule_id) REFERENCES COACH_SCHEDULE(schedule_id) ON DELETE SET NULL
    );
    -- Chỉ mục phục vụ truy vấn nhanh theo trạng thái và thời gian
    CREATE INDEX idx_session_user_status ON COACHING_SESSION(user_id, session_status);
    CREATE INDEX idx_session_coach_time ON COACHING_SESSION(coach_id, scheduled_time);
END
GO

-- 19. COACHING_MESSAGE: Lưu tin nhắn giữa Member và Coach trong hoặc ngoài phiên làm việc
IF OBJECT_ID('COACHING_MESSAGE', 'U') IS NULL
BEGIN
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
END
GO

-- 20. ACHIEVEMENT: Lưu các loại huy hiệu / thành tích có thể nhận được
IF OBJECT_ID('ACHIEVEMENT', 'U') IS NULL
BEGIN
    CREATE TABLE ACHIEVEMENT (
        achievement_id INT IDENTITY(1,1) PRIMARY KEY,      -- Khóa chính tự tăng
        title VARCHAR(100) NOT NULL,                       -- Tiêu đề thành tích (ví dụ: '7 ngày không hút thuốc')
        description TEXT,                                  -- Mô tả chi tiết về thành tích
        badge_image VARCHAR(255),                          -- Đường dẫn tới ảnh huy hiệu (biểu tượng thành tích)
        achievement_type VARCHAR(20),                      -- Loại thành tích: 'daily', 'milestone', 'event'...
        difficulty_level INT                               -- Mức độ khó (1: dễ, 5: rất khó), dùng cho phân loại hoặc game hóa
    );
    -- Chỉ mục gợi ý nếu thường lọc theo loại hoặc mức độ khó
    CREATE INDEX idx_achievement_type_level ON ACHIEVEMENT(achievement_type, difficulty_level);

END
GO

-- 21. USER_ACHIEVEMENT: Ghi nhận những thành tích mà người dùng đã đạt được
IF OBJECT_ID('USER_ACHIEVEMENT', 'U') IS NULL
BEGIN
    CREATE TABLE USER_ACHIEVEMENT (
        user_achievement_id INT IDENTITY(1,1) PRIMARY KEY,        -- Khóa chính tự tăng
        user_id INT NOT NULL,                                     -- Người dùng đạt thành tích
        achievement_id INT NULL,                                  -- Thành tích đạt được (NULL nếu thành tích gốc bị xóa)
        earned_date DATE,                                         -- Ngày đạt được thành tích
        is_shared BIT DEFAULT 0,                                  -- Có chia sẻ không? (0: Không, 1: Có)

        CONSTRAINT fk_userachievement_customer FOREIGN KEY (user_id) REFERENCES CUSTOMER(user_id) ON DELETE CASCADE,        -- Nếu xóa user → xóa ACHIEVEMENT này
        CONSTRAINT fk_userachievement_achievement FOREIGN KEY (achievement_id) REFERENCES ACHIEVEMENT(achievement_id) ON DELETE SET NULL  -- Nếu xóa huy hiệu → giữ ACHIEVEMENT
    );
END
GO

-- 22. NOTIFICATION: Lưu các thông báo gửi đến người dùng
IF OBJECT_ID('NOTIFICATION', 'U') IS NULL
BEGIN
    CREATE TABLE NOTIFICATION (
        notification_id INT IDENTITY(1,1) PRIMARY KEY,       -- Khóa chính tự tăng
        user_id INT NOT NULL,                                -- Mã người dùng nhận thông báo
        title VARCHAR(100),                                  -- Tiêu đề thông báo
        content TEXT,                                        -- Nội dung chi tiết
        created_at DATETIME NOT NULL,                        -- Ngày giờ tạo thông báo
        is_read BIT DEFAULT 0,                               -- Trạng thái đã đọc (0: chưa đọc, 1: đã đọc)
        notification_type VARCHAR(20),                       -- Loại thông báo: 'system', 'reminder', 'coach_msg',...

        CONSTRAINT fk_notification_customer 
            FOREIGN KEY (user_id) REFERENCES CUSTOMER(user_id) ON DELETE CASCADE
    );
END
GO

-- 23. NOTIFICATION_PREFERENCE: Cài đặt tùy chọn nhận thông báo của người dùng
IF OBJECT_ID('NOTIFICATION_PREFERENCE', 'U') IS NULL
BEGIN
    CREATE TABLE NOTIFICATION_PREFERENCE (
        preference_id INT IDENTITY(1,1) PRIMARY KEY,           -- Khóa chính tự tăng
        user_id INT NOT NULL,                                  -- Mã người dùng (liên kết đến CUSTOMER)
        daily_reminder BIT DEFAULT 1,                          -- Nhận nhắc nhở hàng ngày (1: có, 0: không)
        achievement_alert BIT DEFAULT 1,                       -- Nhận thông báo đạt thành tích
        progress_summary BIT DEFAULT 1,                        -- Nhận tóm tắt tiến độ
        coach_message BIT DEFAULT 1,                           -- Nhận tin nhắn từ Coach
        preferred_time TIME,                                   -- Thời gian yêu thích để nhận thông báo (ví dụ: 08:00 sáng)

        CONSTRAINT fk_notifpref_customer 
            FOREIGN KEY (user_id) REFERENCES CUSTOMER(user_id) ON DELETE CASCADE
    );
END
GO

-- 24. COMMUNITY_POST: Bảng lưu bài viết của người dùng trong cộng đồng
IF OBJECT_ID('COMMUNITY_POST', 'U') IS NULL
BEGIN
    CREATE TABLE COMMUNITY_POST (
        post_id INT IDENTITY(1,1) PRIMARY KEY,             -- Khóa chính tự tăng
        user_id INT NULL,                                  -- Tác giả bài viết, liên kết đến CUSTOMER
        title NVARCHAR(100),                               -- Tiêu đề bài viết
        content NVARCHAR(MAX),                             -- Nội dung chi tiết
        created_at DATETIME NOT NULL,                      -- Thời điểm đăng bài
        last_updated DATETIME,                             -- Thời điểm chỉnh sửa gần nhất
        view_count INT DEFAULT 0,                          -- Lượt xem bài viết
        is_pinned BIT DEFAULT 0,                           -- Bài được ghim (1: có, 0: không)

        CONSTRAINT fk_post_user FOREIGN KEY (user_id) REFERENCES CUSTOMER(user_id) ON DELETE SET NULL -- Xóa user sẽ xóa bài
    );
END
GO

-- 25. POST_COMMENT: Bảng lưu bình luận trong bài viết cộng đồng
IF OBJECT_ID('POST_COMMENT', 'U') IS NULL
BEGIN
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
END
GO

-- 26. RESOURCE: Lưu trữ tài liệu, bài viết hỗ trợ cho người dùng
IF OBJECT_ID('RESOURCE', 'U') IS NULL
BEGIN
    CREATE TABLE RESOURCE (
        resource_id INT IDENTITY(1,1) PRIMARY KEY,              -- Khóa chính tự tăng
        title VARCHAR(100) NOT NULL,                            -- Tiêu đề tài nguyên
        content NVARCHAR(MAX),                                  -- Nội dung chi tiết (bài viết, hướng dẫn,...)
        resource_type VARCHAR(50),                              -- Loại tài nguyên (video, bài viết, infographic,...)
        admin_id INT NOT NULL,                                  -- Người tạo (thường là admin)
        created_at DATETIME NOT NULL,                           -- Ngày đăng tải
        is_premium BIT DEFAULT 0,                               -- Chỉ dành cho người dùng trả phí?
        added_by_role VARCHAR(20) DEFAULT 'admin',              -- Vai trò của người thêm (admin, coach,...)

        CONSTRAINT fk_resource_creator FOREIGN KEY (admin_id) REFERENCES CUSTOMER(user_id) ON DELETE CASCADE
    );
END
GO

-- 27. FEEDBACK: Thu thập đánh giá và phản hồi người dùng về hệ thống hoặc tính năng cụ thể
IF OBJECT_ID('FEEDBACK', 'U') IS NULL
BEGIN
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
END
GO

-- 28. RESET_TOKENS: Lưu mã đặt lại mật khẩu được gửi tới người dùng (qua email)
IF OBJECT_ID('RESET_TOKENS', 'U') IS NULL
BEGIN
    CREATE TABLE RESET_TOKENS (
        id INT IDENTITY(1,1) PRIMARY KEY,                   -- Khóa chính tự tăng
        user_id INT NOT NULL,                               -- Người yêu cầu đặt lại mật khẩu
        token VARCHAR(255) NOT NULL UNIQUE,                 -- Mã token đặt lại (phải duy nhất)
        expires_at DATETIME NOT NULL,                       -- Thời điểm token hết hạn
        used BIT DEFAULT 0,                                 -- Đã sử dụng hay chưa (0: chưa, 1: đã)
        created_at DATETIME DEFAULT GETDATE(),              -- Ngày tạo token

        FOREIGN KEY (user_id) REFERENCES CUSTOMER(user_id) ON DELETE CASCADE
    );
END
GO

-- 29. HABIT_LOG: Ghi nhận hành vi không hút thuốc theo từng mốc giờ trong ngày
IF OBJECT_ID('HABIT_LOG', 'U') IS NULL
BEGIN
    CREATE TABLE HABIT_LOG (
        log_id INT IDENTITY(1,1) PRIMARY KEY,                  -- Khóa chính tự tăng
        user_id INT NOT NULL,                                 -- Người dùng thực hiện hành vi
        log_date DATE NOT NULL,                               -- Ngày ghi nhận
        time_slot INT NOT NULL CHECK (time_slot BETWEEN 0 AND 8), -- Mốc thời gian (0: 7h, ..., 8: 22h)
        completed BIT NOT NULL DEFAULT 0,                     -- Đã hoàn thành không hút tại slot đó hay chưa
        points_awarded INT DEFAULT 0,                         -- Điểm thưởng cho hành vi này
        created_at DATETIME DEFAULT GETDATE(),                -- Ngày tạo bản ghi

        CONSTRAINT fk_habitlog_user FOREIGN KEY (user_id) REFERENCES CUSTOMER(user_id) ON DELETE CASCADE,
        UNIQUE(user_id, log_date, time_slot)                  -- Một người chỉ có 1 bản ghi/slot/ngày
    );
END
GO

-- 30. USER_SCORE: Tổng điểm và cấp bậc hiện tại của người dùng trong hệ thống
IF OBJECT_ID('USER_SCORE', 'U') IS NULL
BEGIN
    CREATE TABLE USER_SCORE (
        user_id INT PRIMARY KEY,                              -- Mỗi user có 1 dòng duy nhất
        total_points INT NOT NULL DEFAULT 0,                  -- Tổng điểm tích lũy
        current_level VARCHAR(50) DEFAULT 'Beginner',         -- Cấp độ (Beginner, Intermediate, Expert...)
        last_updated DATETIME DEFAULT GETDATE(),              -- Thời điểm cập nhật gần nhất

        CONSTRAINT fk_score_user FOREIGN KEY (user_id) REFERENCES CUSTOMER(user_id) ON DELETE CASCADE
    );
END
GO

-- 31. USER_SCORE_LOG: Lưu chi tiết điểm được cộng theo từng mốc giờ
IF OBJECT_ID('USER_SCORE_LOG', 'U') IS NULL
BEGIN
    CREATE TABLE USER_SCORE_LOG (
        id INT IDENTITY(1,1) PRIMARY KEY,                     -- Khóa chính tự tăng
        user_id INT NOT NULL,                                 -- Người dùng nhận điểm
        log_date DATE NOT NULL,                               -- Ngày ghi nhận điểm
        time_slot INT NOT NULL CHECK (time_slot BETWEEN 0 AND 8), -- Mốc thời gian điểm được ghi nhận
        points_awarded INT NOT NULL,                          -- Số điểm được cộng
        created_at DATETIME DEFAULT GETDATE(),                -- Thời điểm ghi nhận

        CONSTRAINT fk_scorelog_user FOREIGN KEY (user_id) REFERENCES CUSTOMER(user_id),
        UNIQUE(user_id, log_date, time_slot)                  -- Một người chỉ có 1 lần cộng điểm/slot/ngày
    );
END
GO