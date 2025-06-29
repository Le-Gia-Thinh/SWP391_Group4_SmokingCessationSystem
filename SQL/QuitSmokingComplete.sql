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

-- 2. USER_PROFILE: Hồ sơ chi tiết thói quen hút thuốc của người dùng
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

-- 3. SUBSCRIPTION_PACKAGE: Các gói dịch vụ người dùng có thể đăng ký
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

-- 4. USER_SUBSCRIPTION: Lưu thông tin đăng ký gói của người dùng
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

-- 5. PAYMENT: Lưu thông tin thanh toán của người dùng
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

-- 6. COACH: Thông tin của huấn luyện viên
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

-- 7. PLAN_TEMPLATE: Mẫu kế hoạch cai thuốc dùng để tạo kế hoạch cho người dùng
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

-- 8. CESSATION_PLAN: Lưu thông tin kế hoạch cai thuốc của người dùng
    CREATE TABLE CESSATION_PLAN (
        plan_id INT IDENTITY(1,1) PRIMARY KEY,                     -- Khóa chính
        user_id INT NULL,                                          -- Cho phép null nếu CUSTOMER bị xóa
        plan_name NVARCHAR(100) NOT NULL,                         -- Tên kế hoạch hỗ trợ tiếng Việt
        start_date DATE NOT NULL,                                 -- Ngày bắt đầu
        end_date DATE NOT NULL,                                   -- Ngày kết thúc
        month_quit INT NOT NULL DEFAULT 0,                        -- Số tháng đã cai thuốc (tính từ start đến end)
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

-- 9. WEEKLY_QUOTA: Quy định số thuốc tối đa mỗi tuần trong kế hoạch bỏ thuốc
    CREATE TABLE WEEKLY_QUOTA (
        quota_id INT IDENTITY(1,1) PRIMARY KEY,                       -- Khóa chính tự tăng
        plan_id INT NULL,                                            -- Cho phép null nếu kế hoạch bị xóa
        week_number INT NOT NULL,                                     -- Số thứ tự tuần trong kế hoạch
        max_cigarettes INT NOT NULL,                                  -- Giới hạn số điếu thuốc
        created_at DATETIME DEFAULT GETDATE(),                        -- Ngày tạo

        CONSTRAINT fk_weeklyquota_plan FOREIGN KEY (plan_id) REFERENCES CESSATION_PLAN(plan_id) ON DELETE SET NULL,
        CONSTRAINT uq_plan_week UNIQUE(plan_id, week_number)
    );

-- 10. PLAN_MILESTONE: Lưu các mốc quan trọng trong quá trình thực hiện kế hoạch bỏ thuốc
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

-- 11. PLAN_FEEDBACK: Lưu phản hồi của huấn luyện viên (Coach) về kế hoạch bỏ thuốc
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

-- 13\2. SMOKING_LOG: Ghi lại hành vi hút thuốc của người dùng theo thời gian
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

-- 13. DAILY_SMOKING_SUMMARY: Tổng hợp số điếu thuốc mỗi ngày theo user và kế hoạch
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

-- 14. PROGRESS_TRACKER: Theo dõi tiến độ bỏ thuốc của người dùng
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

-- 15. FTND_RESULT: Lưu kết quả bài test FTND đánh giá mức độ nghiện
    CREATE TABLE FTND_RESULT (
        result_id INT IDENTITY(1,1) PRIMARY KEY,                               -- Khóa chính tự tăng
        user_id INT NULL,                                                      -- Cho phép null nếu user bị xóa
        level NVARCHAR(20) NOT NULL CHECK (level IN (N'Low', N'Medium', N'High')),  -- Mức độ nghiện
        submitted_at DATETIME DEFAULT GETDATE(),                               -- Thời gian nộp

        CONSTRAINT fk_ftnd_user FOREIGN KEY (user_id) REFERENCES CUSTOMER(user_id) ON DELETE SET NULL
    );

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

-- 19. ACHIEVEMENT: Lưu các loại huy hiệu / thành tích có thể nhận được
    CREATE TABLE ACHIEVEMENT (
        achievement_id INT IDENTITY(1,1) PRIMARY KEY,      -- Khóa chính tự tăng
        title NVARCHAR(100) NOT NULL,                       -- Tiêu đề thành tích (ví dụ: '7 ngày không hút thuốc')
        description TEXT,                                  -- Mô tả chi tiết về thành tích
        badge_image VARCHAR(255),                          -- Đường dẫn tới ảnh huy hiệu (biểu tượng thành tích)
        achievement_type VARCHAR(20),                      -- Loại thành tích: 'daily', 'milestone', 'event'...
        difficulty_level INT                               -- Mức độ khó (1: dễ, 5: rất khó), dùng cho phân loại hoặc game hóa
    );
    -- Chỉ mục gợi ý nếu thường lọc theo loại hoặc mức độ khó
    CREATE INDEX idx_achievement_type_level ON ACHIEVEMENT(achievement_type, difficulty_level);

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

-- 21. NOTIFICATION: Lưu các thông báo gửi đến người dùng
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

-- 22. NOTIFICATION_PREFERENCE: Cài đặt tùy chọn nhận thông báo của người dùng
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

-- 23. COMMUNITY_POST: Bảng lưu bài viết của người dùng trong cộng đồng
    CREATE TABLE COMMUNITY_POST (
        post_id INT IDENTITY(1,1) PRIMARY KEY,             -- Khóa chính tự tăng
        user_id INT NULL,                                  -- Tác giả bài viết, liên kết đến CUSTOMER
        title NVARCHAR(100),                               -- Tiêu đề bài viết
        content NVARCHAR(MAX),                             -- Nội dung chi tiết
        created_at DATETIME NOT NULL,                      -- Thời điểm đăng bài
        last_updated DATETIME,                             -- Thời điểm chỉnh sửa gần nhất
        view_count INT DEFAULT 0,                          -- Lượt xem bài viết
        is_pinned BIT DEFAULT 0,                           -- Bài được ghim (1: có, 0: không)
        is_approved BIT DEFAULT 0,                         -- 0: chưa duyệt, 1: đã duyệt

        CONSTRAINT fk_post_user FOREIGN KEY (user_id) REFERENCES CUSTOMER(user_id) ON DELETE SET NULL -- Xóa user sẽ xóa bài
    );

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

-- 25. RESOURCE: Lưu trữ tài liệu, bài viết hỗ trợ cho người dùng
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

-- 29. USER_SCORE: Tổng điểm và cấp bậc hiện tại của người dùng trong hệ thống
    CREATE TABLE USER_SCORE (
        user_id INT PRIMARY KEY,                              -- Mỗi user có 1 dòng duy nhất
        total_points FlOAT NOT NULL DEFAULT 0,                  -- Tổng điểm tích lũy
        current_level VARCHAR(50) DEFAULT 'Beginner',         -- Cấp độ (Beginner, Intermediate, Expert...)
        last_updated DATETIME DEFAULT GETDATE(),              -- Thời điểm cập nhật gần nhất

        CONSTRAINT fk_score_user FOREIGN KEY (user_id) REFERENCES CUSTOMER(user_id) ON DELETE CASCADE
    );

-- 30. USER_SCORE_LOG: Lưu chi tiết điểm được cộng theo từng mốc giờ
    CREATE TABLE USER_SCORE_LOG (
        id INT IDENTITY(1,1) PRIMARY KEY,                     -- Khóa chính tự tăng
        user_id INT NOT NULL,                                 -- Người dùng nhận điểm
        log_date DATE NOT NULL,                               -- Ngày ghi nhận điểm
        time_slot INT NOT NULL CHECK (time_slot BETWEEN 0 AND 8), -- Mốc thời gian điểm được ghi nhận
        points_awarded FLOAT NOT NULL,                        -- Số điểm (kiểu float để đồng nhất)
        created_at DATETIME DEFAULT GETDATE(),                -- Thời điểm ghi nhận

        CONSTRAINT fk_scorelog_user FOREIGN KEY (user_id) REFERENCES CUSTOMER(user_id),
        UNIQUE(user_id, log_date, time_slot)                  -- Một người chỉ có 1 lần cộng điểm/slot/ngày
    );


 -- 31. COMMUNITY_CHAT: Lưu tin nhắn trong phòng trò chuyện chung của cộng đồng
CREATE TABLE COMMUNITY_CHAT (
    message_id INT IDENTITY PRIMARY KEY,                       -- Khóa chính tự tăng cho mỗi tin nhắn
    user_id INT,                                               -- Người gửi tin nhắn (liên kết đến CUSTOMER)
    content NVARCHAR(MAX),                                     -- Nội dung tin nhắn
    sent_at DATETIME DEFAULT GETDATE(),                        -- Thời điểm gửi tin nhắn

    CONSTRAINT fk_communitychat_user FOREIGN KEY (user_id) REFERENCES CUSTOMER(user_id) -- Khóa ngoại đến bảng CUSTOMER
);

-- 32. CHAT_TOPIC: Chủ đề thảo luận do người dùng tạo trong cộng đồng
CREATE TABLE CHAT_TOPIC (
    topic_id INT IDENTITY PRIMARY KEY,                         -- Khóa chính tự tăng cho mỗi chủ đề
    creator_id INT,                                            -- Người tạo chủ đề (liên kết đến CUSTOMER)
    title NVARCHAR(200),                                       -- Tiêu đề chủ đề
    description NVARCHAR(MAX),                                 -- Mô tả nội dung của chủ đề
    created_at DATETIME DEFAULT GETDATE(),                     -- Ngày tạo chủ đề

    CONSTRAINT fk_chattopic_creator FOREIGN KEY (creator_id) REFERENCES CUSTOMER(user_id) -- Khóa ngoại đến bảng CUSTOMER
);

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