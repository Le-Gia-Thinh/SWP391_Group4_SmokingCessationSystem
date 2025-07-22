-- Migration script: Chuyển PHASES và BEHAVIOR_PLAN_PHASES từ hardcode sang SQL
-- Tạo ngày: 22/07/2025
-- Encoding: UTF-8 (SQL Server compatible)

-- =====================================================
-- 1. TẠO CÁC BẢNG
-- =====================================================

-- Bảng phases (cho PHASES constant)
CREATE TABLE phases (
    id INT IDENTITY(1,1) PRIMARY KEY,
    phase_name NVARCHAR(255) NOT NULL,
    range_start INT NOT NULL,
    range_end INT NOT NULL,
    goal NVARCHAR(MAX) NOT NULL,
    phase_order INT NOT NULL,
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE()
);

-- Bảng behavior_phases (cho BEHAVIOR_PLAN_PHASES constant)
CREATE TABLE behavior_phases (
    id INT IDENTITY(1,1) PRIMARY KEY,
    phase_code NVARCHAR(10) NOT NULL UNIQUE, -- P1, P2, P3, P4, P5
    phase_name NVARCHAR(255) NOT NULL,
    phase_order INT NOT NULL,
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE()
);

-- Bảng behavior_tasks
CREATE TABLE behavior_tasks (
    id INT IDENTITY(1,1) PRIMARY KEY,
    phase_code NVARCHAR(10) NOT NULL, -- P1, P2, P3, P4, P5
    time_slot NVARCHAR(10) NOT NULL, -- 07:00, 08:00, etc.
    task_id NVARCHAR(20) NOT NULL UNIQUE, -- P1_07_1, P1_07_2, etc.
    task_description NVARCHAR(MAX) NOT NULL,
    task_order INT NOT NULL,
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (phase_code) REFERENCES behavior_phases(phase_code) ON DELETE CASCADE
);

-- =====================================================
-- 2. INSERT DỮ LIỆU PHASES
-- =====================================================

INSERT INTO phases (phase_name, range_start, range_end, goal, phase_order) VALUES
(N'Giai đoạn 1', 0, 20, N'Nhận diện – Giảm nhẹ liều', 1),
(N'Giai đoạn 2', 20, 40, N'Cắt giảm quyết liệt', 2),
(N'Giai đoạn 3', 40, 60, N'Còn hút ít, chuẩn bị cai', 3),
(N'Giai đoạn 4', 60, 80, N'Cai hoàn toàn – vẫn khó chịu', 4),
(N'Giai đoạn 5', 80, 100, N'Củng cố, không hút trở lại', 5);

-- =====================================================
-- 3. INSERT DỮ LIỆU BEHAVIOR_PHASES
-- =====================================================

INSERT INTO behavior_phases (phase_code, phase_name, phase_order) VALUES
(N'P1', N'Nhận diện – Giảm nhẹ liều', 1),
(N'P2', N'Cắt giảm quyết liệt', 2),
(N'P3', N'Còn hút ít, chuẩn bị cai', 3),
(N'P4', N'Cai hoàn toàn – vẫn khó chịu', 4),
(N'P5', N'Củng cố, không hút trở lại', 5);

-- =====================================================
-- 4. INSERT DỮ LIỆU BEHAVIOR_TASKS
-- =====================================================

-- PHASE 1: Nhận diện – Giảm nhẹ liều
INSERT INTO behavior_tasks (phase_code, time_slot, task_id, task_description, task_order) VALUES
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
INSERT INTO behavior_tasks (phase_code, time_slot, task_id, task_description, task_order) VALUES
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
INSERT INTO behavior_tasks (phase_code, time_slot, task_id, task_description, task_order) VALUES
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
INSERT INTO behavior_tasks (phase_code, time_slot, task_id, task_description, task_order) VALUES
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
INSERT INTO behavior_tasks (phase_code, time_slot, task_id, task_description, task_order) VALUES
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

-- =====================================================
-- 5. KIỂM TRA DỮ LIỆU
-- =====================================================

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
SELECT 
    phase_code,
    time_slot,
    COUNT(*) as task_count
FROM behavior_tasks 
GROUP BY phase_code, time_slot 
ORDER BY phase_code, time_slot;

-- =====================================================
-- 6. CLEANUP SCRIPT (NẾU CẦN ROLLBACK)
-- =====================================================

/*
-- Uncomment để rollback
DROP TABLE IF EXISTS behavior_tasks;
DROP TABLE IF EXISTS behavior_phases;
DROP TABLE IF EXISTS phases;
*/

-- =====================================================
-- HOÀN THÀNH!
-- =====================================================
-- ✅ Đã tạo 3 bảng: phases, behavior_phases, behavior_tasks
-- ✅ Đã insert đầy đủ dữ liệu từ constants
-- ✅ Tổng cộng: 5 phases + 5 behavior_phases + 135 behavior_tasks
-- ✅ Sẵn sàng để tạo API endpoints!
