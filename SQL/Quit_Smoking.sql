IF DB_ID('Quit_Smoking') IS NULL
BEGIN
    CREATE DATABASE Quit_Smoking;
END
GO

USE Quit_Smoking;
GO

CREATE TABLE CUSTOMER (
  user_id INT IDENTITY(1,1) PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  phone_number VARCHAR(20) NULL,
  date_of_birth DATE NULL,
  registration_date DATE NOT NULL,
  user_role VARCHAR(20) NOT NULL,
  account_status VARCHAR(20) NOT NULL
);
GO

CREATE TABLE USER_PROFILE (
  profile_id INT IDENTITY(1,1) PRIMARY KEY,
  user_id INT NOT NULL,
  smoking_years INT NULL,
  daily_cigarettes INT NULL,
  monthly_expense INT NULL,
  preferred_brand VARCHAR(100) NULL,
  quit_reasons TEXT NULL,
  health_issues TEXT NULL,
  target_quit_date DATE NULL,
  CONSTRAINT fk_userprofile_customer FOREIGN KEY (user_id) REFERENCES CUSTOMER(user_id) ON DELETE CASCADE
);
GO

CREATE TABLE SUBSCRIPTION_PACKAGE (
  package_id INT IDENTITY(1,1) PRIMARY KEY,
  package_name VARCHAR(100) NOT NULL,
  description TEXT NULL,
  price DECIMAL(10,2) NOT NULL,
  duration_days INT NOT NULL,
  coach_access BIT DEFAULT 0,
  community_access BIT DEFAULT 0,
  premium_content BIT DEFAULT 0,
  created_at DATE NOT NULL
);
GO

CREATE TABLE USER_SUBSCRIPTION (
  subscription_id INT IDENTITY(1,1) PRIMARY KEY,
  user_id INT NOT NULL,
  package_id INT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  auto_renew BIT DEFAULT 0,
  payment_status VARCHAR(20) NULL,
  CONSTRAINT fk_usersub_customer FOREIGN KEY (user_id) REFERENCES CUSTOMER(user_id) ON DELETE CASCADE,
  CONSTRAINT fk_usersub_package FOREIGN KEY (package_id) REFERENCES SUBSCRIPTION_PACKAGE(package_id)
);
GO

CREATE TABLE PAYMENT (
  payment_id INT IDENTITY(1,1) PRIMARY KEY,
  subscription_id INT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  payment_date DATE NOT NULL,
  transaction_id VARCHAR(100) NULL,
  payment_method VARCHAR(20) NULL,
  payment_status VARCHAR(20) NULL,
  CONSTRAINT fk_payment_subscription FOREIGN KEY (subscription_id) REFERENCES USER_SUBSCRIPTION(subscription_id)
);
GO

CREATE TABLE COACH (
  coach_id INT IDENTITY(1,1) PRIMARY KEY,
  user_id INT NOT NULL,
  specialization VARCHAR(100) NULL,
  bio TEXT NULL,
  experience_years INT NULL,
  status VARCHAR(20) NULL,
  rating DECIMAL(3,2) NULL,
  CONSTRAINT fk_coach_customer FOREIGN KEY (user_id) REFERENCES CUSTOMER(user_id) ON DELETE CASCADE
);
GO

CREATE TABLE PLAN_TEMPLATE (
  template_id INT IDENTITY(1,1) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT NULL,
  default_days INT NULL,
  daily_cigs INT NULL,
  strategy TEXT NULL
);
GO

CREATE TABLE CESSATION_PLAN (
  plan_id INT IDENTITY(1,1) PRIMARY KEY,
  user_id INT NOT NULL,
  plan_name VARCHAR(100) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  target_quit_date DATE NULL,
  frequency_per_day INT NULL,
  plan_type VARCHAR(20) NULL,
  plan_source VARCHAR(20) NULL,
  current_stage VARCHAR(20) NULL,
  strategy TEXT NULL,
  is_active BIT DEFAULT 1,
  created_at DATE NOT NULL,
  last_updated DATE NULL,
  template_id INT NULL,
  CONSTRAINT fk_plan_customer FOREIGN KEY (user_id) REFERENCES CUSTOMER(user_id) ON DELETE CASCADE,
  CONSTRAINT fk_plan_template FOREIGN KEY (template_id) REFERENCES PLAN_TEMPLATE(template_id)
);
GO

CREATE TABLE COACH_PLAN_ASSIGNMENT (
  id INT IDENTITY(1,1) PRIMARY KEY,
  coach_id INT NOT NULL,
  plan_id INT NOT NULL,
  assigned_at DATETIME NOT NULL,
  status VARCHAR(20) NULL,
  CONSTRAINT fk_cpa_coach FOREIGN KEY (coach_id) REFERENCES COACH(coach_id),
  CONSTRAINT fk_cpa_plan FOREIGN KEY (plan_id) REFERENCES CESSATION_PLAN(plan_id)
);
GO

CREATE TABLE PLAN_FEEDBACK (
  feedback_id INT IDENTITY(1,1) PRIMARY KEY,
  plan_id INT NOT NULL,
  coach_id INT NOT NULL,
  feedback_text TEXT NULL,
  submitted_at DATETIME NOT NULL,
  feedback_context VARCHAR(20) NULL,
  CONSTRAINT fk_feedback_plan FOREIGN KEY (plan_id) REFERENCES CESSATION_PLAN(plan_id),
  CONSTRAINT fk_feedback_coach FOREIGN KEY (coach_id) REFERENCES COACH(coach_id)
);
GO

CREATE TABLE PLAN_REASON (
  id INT IDENTITY(1,1) PRIMARY KEY,
  plan_id INT NOT NULL,
  reason_type VARCHAR(20) NULL,
  description TEXT NULL,
  CONSTRAINT fk_planreason_plan FOREIGN KEY (plan_id) REFERENCES CESSATION_PLAN(plan_id)
);
GO

CREATE TABLE PLAN_MILESTONE (
  milestone_id INT IDENTITY(1,1) PRIMARY KEY,
  plan_id INT NOT NULL,
  title VARCHAR(100) NULL,
  description TEXT NULL,
  start_date DATE NULL,
  target_date DATE NULL,
  is_completed BIT DEFAULT 0,
  completion_date DATE NULL,
  CONSTRAINT fk_milestone_plan FOREIGN KEY (plan_id) REFERENCES CESSATION_PLAN(plan_id)
);
GO

CREATE TABLE SMOKING_LOG (
  log_id INT IDENTITY(1,1) PRIMARY KEY,
  user_id INT NOT NULL,
  timestamp DATETIME NOT NULL,
  cigarettes_count INT NULL,
  trigger_situation VARCHAR(100) NULL,
  location VARCHAR(100) NULL,
  notes TEXT NULL,
  CONSTRAINT fk_smokinglog_customer FOREIGN KEY (user_id) REFERENCES CUSTOMER(user_id) ON DELETE CASCADE
);
GO

CREATE TABLE DAILY_SMOKING_SUMMARY (
  id INT IDENTITY(1,1) PRIMARY KEY,
  user_id INT NOT NULL,
  date DATE NOT NULL,
  total_cigarettes INT NULL,
  relapsed BIT DEFAULT 0,
  plan_id INT NULL,
  CONSTRAINT fk_dsm_summary_customer FOREIGN KEY (user_id) REFERENCES CUSTOMER(user_id),
  CONSTRAINT fk_dsm_summary_plan FOREIGN KEY (plan_id) REFERENCES CESSATION_PLAN(plan_id)
);
GO

CREATE TABLE PROGRESS_TRACKER (
  tracker_id INT IDENTITY(1,1) PRIMARY KEY,
  user_id INT NOT NULL,
  record_date DATE NOT NULL,
  smoke_free_days INT NULL,
  money_saved DECIMAL(10,2) NULL,
  avoided_cigarettes INT NULL,
  health_improvements TEXT NULL,
  CONSTRAINT fk_progress_customer FOREIGN KEY (user_id) REFERENCES CUSTOMER(user_id)
);
GO

CREATE TABLE ACHIEVEMENT (
  achievement_id INT IDENTITY(1,1) PRIMARY KEY,
  title VARCHAR(100) NOT NULL,
  description TEXT NULL,
  badge_image VARCHAR(255) NULL,
  achievement_type VARCHAR(20) NULL,
  difficulty_level INT NULL
);
GO

CREATE TABLE USER_ACHIEVEMENT (
  user_achievement_id INT IDENTITY(1,1) PRIMARY KEY,
  user_id INT NOT NULL,
  achievement_id INT NOT NULL,
  earned_date DATE NULL,
  is_shared BIT DEFAULT 0,
  CONSTRAINT fk_userachievement_customer FOREIGN KEY (user_id) REFERENCES CUSTOMER(user_id),
  CONSTRAINT fk_userachievement_achievement FOREIGN KEY (achievement_id) REFERENCES ACHIEVEMENT(achievement_id)
);
GO

CREATE TABLE NOTIFICATION (
  notification_id INT IDENTITY(1,1) PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(100) NULL,
  content TEXT NULL,
  created_at DATETIME NOT NULL,
  is_read BIT DEFAULT 0,
  notification_type VARCHAR(20) NULL,
  CONSTRAINT fk_notification_customer FOREIGN KEY (user_id) REFERENCES CUSTOMER(user_id)
);
GO

CREATE TABLE NOTIFICATION_PREFERENCE (
  preference_id INT IDENTITY(1,1) PRIMARY KEY,
  user_id INT NOT NULL,
  daily_reminder BIT DEFAULT 1,
  achievement_alert BIT DEFAULT 1,
  progress_summary BIT DEFAULT 1,
  coach_message BIT DEFAULT 1,
  preferred_time TIME NULL,
  CONSTRAINT fk_notifpref_customer FOREIGN KEY (user_id) REFERENCES CUSTOMER(user_id)
);
GO

CREATE TABLE COACHING_SESSION (
  session_id INT IDENTITY(1,1) PRIMARY KEY,
  user_id INT NOT NULL,
  coach_id INT NOT NULL,
  scheduled_time DATETIME NOT NULL,
  duration_minutes INT NULL,
  session_status VARCHAR(20) NULL,
  session_type VARCHAR(20) NULL,
  CONSTRAINT fk_coaching_user FOREIGN KEY (user_id) REFERENCES CUSTOMER(user_id),
  CONSTRAINT fk_coaching_coach FOREIGN KEY (coach_id) REFERENCES COACH(coach_id)
);
GO

CREATE TABLE COACHING_MESSAGE (
  message_id INT IDENTITY(1,1) PRIMARY KEY,
  user_id INT NOT NULL,
  coach_id INT NOT NULL,
  content TEXT NULL,
  sent_at DATETIME NOT NULL,
  is_read BIT DEFAULT 0,
  session_id INT NULL,
  CONSTRAINT fk_msg_user FOREIGN KEY (user_id) REFERENCES CUSTOMER(user_id),
  CONSTRAINT fk_msg_coach FOREIGN KEY (coach_id) REFERENCES COACH(coach_id),
  CONSTRAINT fk_msg_session FOREIGN KEY (session_id) REFERENCES COACHING_SESSION(session_id)
);
GO

CREATE TABLE COMMUNITY_POST (
  post_id INT IDENTITY(1,1) PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(100) NULL,
  content TEXT NULL,
  created_at DATETIME NOT NULL,
  last_updated DATETIME NULL,
  view_count INT DEFAULT 0,
  is_pinned BIT DEFAULT 0,
  CONSTRAINT fk_post_user FOREIGN KEY (user_id) REFERENCES CUSTOMER(user_id)
);
GO

CREATE TABLE POST_COMMENT (
  comment_id INT IDENTITY(1,1) PRIMARY KEY,
  post_id INT NOT NULL,
  user_id INT NOT NULL,
  content TEXT NULL,
  created_at DATETIME NOT NULL,
  parent_comment_id INT NULL,
  CONSTRAINT fk_comment_post FOREIGN KEY (post_id) REFERENCES COMMUNITY_POST(post_id),
  CONSTRAINT fk_comment_user FOREIGN KEY (user_id) REFERENCES CUSTOMER(user_id),
  CONSTRAINT fk_comment_parent FOREIGN KEY (parent_comment_id) REFERENCES POST_COMMENT(comment_id)
);
GO

CREATE TABLE RESOURCE (
  resource_id INT IDENTITY(1,1) PRIMARY KEY,
  title VARCHAR(100) NOT NULL,
  content TEXT NULL,
  resource_type VARCHAR(50) NULL,
  created_by INT NOT NULL,
  created_at DATETIME NOT NULL,
  is_premium BIT DEFAULT 0,
  CONSTRAINT fk_resource_creator FOREIGN KEY (created_by) REFERENCES CUSTOMER(user_id)
);
GO

CREATE TABLE FEEDBACK (
  feedback_id INT IDENTITY(1,1) PRIMARY KEY,
  user_id INT NOT NULL,
  rating INT CHECK (rating >= 1 AND rating <= 5),
  comment TEXT NULL,
  feedback_type VARCHAR(20) NULL,
  submitted_at DATETIME NOT NULL,
  feature_id INT NULL,
  CONSTRAINT fk_feedback_user FOREIGN KEY (user_id) REFERENCES CUSTOMER(user_id)
);
GO
