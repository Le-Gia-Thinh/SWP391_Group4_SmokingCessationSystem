-- Thêm coaches mẫu vào database
-- Đầu tiên thêm vào bảng CUSTOMER
INSERT INTO CUSTOMER (full_name, email, phone, password, user_role, status, created_at)
VALUES 
('Dr. Sarah Wilson', 'sarah.wilson@example.com', '0123456789', 'hashed_password', 'coach', 'active', GETDATE()),
('Dr. Michael Chen', 'michael.chen@example.com', '0123456790', 'hashed_password', 'coach', 'active', GETDATE()),
('Dr. Emily Johnson', 'emily.johnson@example.com', '0123456791', 'hashed_password', 'coach', 'active', GETDATE()),
('Dr. David Brown', 'david.brown@example.com', '0123456792', 'hashed_password', 'coach', 'active', GETDATE()),
('Dr. Lisa Garcia', 'lisa.garcia@example.com', '0123456793', 'hashed_password', 'coach', 'active', GETDATE());

-- Sau đó thêm vào bảng COACH
INSERT INTO COACH (user_id, specialization, bio, experience_years, status, google_meet_link)
VALUES 
((SELECT user_id FROM CUSTOMER WHERE email = 'sarah.wilson@example.com'), 
 'Smoking Cessation Specialist', 
 'Certified smoking cessation specialist with 5 years of experience helping people quit smoking. Specializes in behavioral therapy and nicotine replacement strategies.',
 5, 'active', 'https://meet.google.com/sarah-wilson-coach'),
 
((SELECT user_id FROM CUSTOMER WHERE email = 'michael.chen@example.com'), 
 'Behavioral Therapy Expert', 
 'Expert in behavioral therapy and addiction counseling with 8 years of experience. Focuses on cognitive behavioral therapy for smoking cessation.',
 8, 'active', 'https://meet.google.com/michael-chen-coach'),
 
((SELECT user_id FROM CUSTOMER WHERE email = 'emily.johnson@example.com'), 
 'Cognitive Behavioral Therapy', 
 'Specialist in cognitive behavioral therapy for smoking cessation and addiction recovery. 6 years of experience in helping clients overcome nicotine addiction.',
 6, 'active', 'https://meet.google.com/emily-johnson-coach'),
 
((SELECT user_id FROM CUSTOMER WHERE email = 'david.brown@example.com'), 
 'Addiction Recovery Coach', 
 'Dedicated addiction recovery coach with 7 years of experience. Specializes in helping individuals develop healthy coping mechanisms and lifestyle changes.',
 7, 'active', 'https://meet.google.com/david-brown-coach'),
 
((SELECT user_id FROM CUSTOMER WHERE email = 'lisa.garcia@example.com'), 
 'Wellness & Lifestyle Coach', 
 'Wellness and lifestyle coach focusing on holistic approaches to smoking cessation. 4 years of experience in nutrition, exercise, and stress management.',
 4, 'active', 'https://meet.google.com/lisa-garcia-coach');

-- Thêm một số lịch mẫu cho coaches
INSERT INTO COACH_SCHEDULE (coach_id, start_time, end_time, is_booked)
VALUES 
-- Sarah Wilson's schedules
((SELECT coach_id FROM COACH WHERE user_id = (SELECT user_id FROM CUSTOMER WHERE email = 'sarah.wilson@example.com')), 
 '2024-01-15 09:00:00', '2024-01-15 10:00:00', 0),
((SELECT coach_id FROM COACH WHERE user_id = (SELECT user_id FROM CUSTOMER WHERE email = 'sarah.wilson@example.com')), 
 '2024-01-15 14:00:00', '2024-01-15 15:00:00', 0),
((SELECT coach_id FROM COACH WHERE user_id = (SELECT user_id FROM CUSTOMER WHERE email = 'sarah.wilson@example.com')), 
 '2024-01-16 10:00:00', '2024-01-16 11:00:00', 0),

-- Michael Chen's schedules
((SELECT coach_id FROM COACH WHERE user_id = (SELECT user_id FROM CUSTOMER WHERE email = 'michael.chen@example.com')), 
 '2024-01-15 11:00:00', '2024-01-15 12:00:00', 0),
((SELECT coach_id FROM COACH WHERE user_id = (SELECT user_id FROM CUSTOMER WHERE email = 'michael.chen@example.com')), 
 '2024-01-15 16:00:00', '2024-01-15 17:00:00', 0),
((SELECT coach_id FROM COACH WHERE user_id = (SELECT user_id FROM CUSTOMER WHERE email = 'michael.chen@example.com')), 
 '2024-01-16 09:00:00', '2024-01-16 10:00:00', 0),

-- Emily Johnson's schedules
((SELECT coach_id FROM COACH WHERE user_id = (SELECT user_id FROM CUSTOMER WHERE email = 'emily.johnson@example.com')), 
 '2024-01-15 13:00:00', '2024-01-15 14:00:00', 0),
((SELECT coach_id FROM COACH WHERE user_id = (SELECT user_id FROM CUSTOMER WHERE email = 'emily.johnson@example.com')), 
 '2024-01-16 14:00:00', '2024-01-16 15:00:00', 0),
((SELECT coach_id FROM COACH WHERE user_id = (SELECT user_id FROM CUSTOMER WHERE email = 'emily.johnson@example.com')), 
 '2024-01-17 10:00:00', '2024-01-17 11:00:00', 0); 