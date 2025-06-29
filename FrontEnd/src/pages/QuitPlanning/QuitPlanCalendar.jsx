import React, { useEffect, useState, useMemo } from "react";
import {
  DatePicker,
  InputNumber,
  Select,
  Table,
  Typography,
  Input,
  Button,
  Tooltip,
  Badge,
  Progress,
  Alert,
  Tag,
  Divider,
  Card,
  Empty,
  Popover,
  Row,
  Col,
  message,
  Spin,
} from "antd";
import {
  CalendarOutlined,
  CheckCircleTwoTone,
  InfoCircleOutlined,
  RocketOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
dayjs.extend(utc);
import "./QuitPlanCalendar.css";
import PlanSetupModal from "./PlanSetupModal";
import axios from "axios";
import Navbar from "../../layouts/Navbar";

const { Title } = Typography;

const PHASES = [
  { phase: "Giai đoạn 1", range: [0, 20], goal: "Nhận diện – Giảm nhẹ liều" },
  { phase: "Giai đoạn 2", range: [20, 40], goal: "Cắt giảm quyết liệt" },
  { phase: "Giai đoạn 3", range: [40, 60], goal: "Còn hút ít, chuẩn bị cai" },
  {
    phase: "Giai đoạn 4",
    range: [60, 80],
    goal: "Cai hoàn toàn – vẫn khó chịu",
  },
  {
    phase: "Giai đoạn 5",
    range: [80, 100],
    goal: "Củng cố, không hút trở lại",
  },
];

const BEHAVIOR_PLAN_PHASES = [
  // Phase 1: Nhận diện – Giảm nhẹ liều
  [
    {
      phase: "P1",
      name: "Nhận diện – Giảm nhẹ liều",
      tasks: {
        "07:00": [
          {
            task_id: "P1_07_1",
            task: "Ngậm kẹo nicotine 2mg + đi bộ nhanh 3 phút + ghi 3 từ mô tả cảm giác thèm",
          },
          {
            task_id: "P1_07_2",
            task: "Thiền quan sát cảm giác thèm 5 phút + rửa mặt lạnh + ghi thang craving 1–10",
          },
          {
            task_id: "P1_07_3",
            task: "Chạy tại chỗ 2 phút + xịt nicotine 1 lần + vẽ nhanh khuôn mặt thèm thuốc",
          },
        ],
        "08:00": [
          {
            task_id: "P1_08_1",
            task: "Dán nicotine 16h + đi bộ nhẹ 3 phút + uống nước lọc",
          },
          {
            task_id: "P1_08_2",
            task: "Thiền hơi thở 5 phút sau ăn + viết 3 điều biết ơn",
          },
          {
            task_id: "P1_08_3",
            task: "Nghe podcast Coach hướng dẫn xử lý sau ăn + ghi cảm xúc",
          },
        ],
        "10:00": [
          {
            task_id: "P1_10_1",
            task: "Ghi nhanh lý do hút thuốc + vẽ mũi tên hướng thay thế",
          },
          {
            task_id: "P1_10_2",
            task: "Uống trà thảo mộc + vươn vai + ghi 1 điều đang lo",
          },
          {
            task_id: "P1_10_3",
            task: "Thiền kiểm soát cảm xúc 5 phút + đánh giá thèm thuốc",
          },
        ],
        "12:00": [
          {
            task_id: "P1_12_1",
            task: "Đi cầu thang 2 tầng sau ăn + chụp ảnh báo Coach",
          },
          {
            task_id: "P1_12_2",
            task: "Viết nhật ký cảm giác sau ăn khi không hút",
          },
          {
            task_id: "P1_12_3",
            task: "Nghe âm thanh thư giãn 4 phút + uống nước lọc",
          },
        ],
        "14:00": [
          {
            task_id: "P1_14_1",
            task: "Uống nước lạnh + đi bộ nhẹ 3 phút + thở sâu 3 lần",
          },
          {
            task_id: "P1_14_2",
            task: "Thiền tỉnh táo 5 phút + ghi nhật ký lý do muốn bỏ thuốc",
          },
          {
            task_id: "P1_14_3",
            task: "Vẽ tranh đơn giản về trạng thái cảm xúc lúc đó + viết 1 câu miêu tả",
          },
        ],
        "16:00": [
          {
            task_id: "P1_16_1",
            task: "Gửi tin nhắn cho Coach xin hướng dẫn + uống trà",
          },
          {
            task_id: "P1_16_2",
            task: "Viết lại tình huống khiến bạn stress + 1 cách đối phó",
          },
          {
            task_id: "P1_16_3",
            task: "Thực hiện 5 phút yoga cổ vai gáy theo video Coach cung cấp",
          },
        ],
        "18:00": [
          {
            task_id: "P1_18_1",
            task: "Ngậm kẹo bạc hà + uống nước lạnh + đi bộ 2 phút",
          },
          {
            task_id: "P1_18_2",
            task: "Chuẩn bị bữa ăn nhẹ lành mạnh + ghi lại cảm xúc trước/sau",
          },
          {
            task_id: "P1_18_3",
            task: "Làm nhiệm vụ hệ thống chọn sẵn (nút ngẫu nhiên)",
          },
        ],
        "20:00": [
          {
            task_id: "P1_20_1",
            task: "Đọc 1 bài viết ngắn về lợi ích bỏ thuốc + ghi cảm nhận",
          },
          { task_id: "P1_20_2", task: "Ghi lại cảm xúc của bạn sau bữa tối" },
          {
            task_id: "P1_20_3",
            task: "Xem lại ảnh đồ ăn/hoạt động khỏe mạnh đã thực hiện trong ngày",
          },
        ],
        "22:00": [
          {
            task_id: "P1_22_1",
            task: "Viết 1 dòng nhật ký cảm xúc cuối ngày + đánh giá 1–10",
          },
          { task_id: "P1_22_2", task: "Thiền thư giãn 7 phút trước khi ngủ" },
          {
            task_id: "P1_22_3",
            task: "Đọc lại nhật ký lý do bỏ thuốc đã viết",
          },
        ],
      },
    },
  ],
  // Phase 2: Cắt giảm quyết liệt
  [
    {
      phase: "P2",
      name: "Cắt giảm quyết liệt",
      tasks: {
        "07:00": [
          {
            task_id: "P2_07_1",
            task: "Chạy bộ nhẹ 5 phút + uống nước ấm + ghi cảm xúc đầu ngày",
          },
          {
            task_id: "P2_07_2",
            task: "Thiền định buổi sáng 7 phút + viết mục tiêu hôm nay",
          },
          {
            task_id: "P2_07_3",
            task: "Tập thể dục tại chỗ 5 phút + ăn 1 trái chuối (giàu dopamine)",
          },
        ],
        "08:00": [
          {
            task_id: "P2_08_1",
            task: "Ăn sáng với trứng + trái cây + ghi lại cảm giác sau ăn",
          },
          {
            task_id: "P2_08_2",
            task: "Nghe nhạc thư giãn 5 phút + đi bộ chậm 4 phút",
          },
          {
            task_id: "P2_08_3",
            task: "Tự massage cổ vai gáy 3 phút + viết 3 điều mong chờ trong ngày",
          },
        ],
        "10:00": [
          {
            task_id: "P2_10_1",
            task: "Ghi lại 1 lần muốn hút thuốc gần đây + viết cách vượt qua",
          },
          { task_id: "P2_10_2", task: "Thiền thở sâu 6 phút + uống trà gừng" },
          {
            task_id: "P2_10_3",
            task: "Vẽ cảm xúc + chia sẻ lên nhật ký hệ thống",
          },
        ],
        "12:00": [
          {
            task_id: "P2_12_1",
            task: "Ăn trưa chay nhẹ + đi bộ 3 phút sau ăn",
          },
          {
            task_id: "P2_12_2",
            task: "Đọc bài viết về tác hại thuốc lá + ghi lại 1 điều ấn tượng",
          },
          { task_id: "P2_12_3", task: "Tập động tác yoga nhẹ nhàng 5 phút" },
        ],
        "14:00": [
          {
            task_id: "P2_14_1",
            task: "Chạy tại chỗ 3 phút + uống nước + đánh giá cảm giác",
          },
          {
            task_id: "P2_14_2",
            task: "Thiền kiểm soát cảm xúc 5 phút + ghi nhật ký",
          },
          {
            task_id: "P2_14_3",
            task: "Gọi điện cho người ủng hộ + chia sẻ tiến trình",
          },
        ],
        "16:00": [
          {
            task_id: "P2_16_1",
            task: "Bơi/đạp xe 10 phút (nếu có điều kiện) + ghi nhật ký",
          },
          {
            task_id: "P2_16_2",
            task: "Vẽ bản đồ tiến trình cai thuốc + đánh dấu ngày hiện tại",
          },
          {
            task_id: "P2_16_3",
            task: "Làm 1 việc thiện nhỏ trong ngày + viết cảm nhận",
          },
        ],
        "18:00": [
          {
            task_id: "P2_18_1",
            task: "Chuẩn bị bữa tối lành mạnh giàu đạm + chụp ảnh lưu giữ",
          },
          {
            task_id: "P2_18_2",
            task: "Lắng nghe 1 đoạn audio truyền động lực Coach",
          },
          {
            task_id: "P2_18_3",
            task: "Viết thư cho bản thân tương lai không hút thuốc",
          },
        ],
        "20:00": [
          {
            task_id: "P2_20_1",
            task: "Đi bộ thư giãn 5 phút + ngửi tinh dầu cam/quế",
          },
          {
            task_id: "P2_20_2",
            task: "Ghi lại cảm xúc cuối ngày và điều thành công nhỏ",
          },
          { task_id: "P2_20_3", task: "Thiền buông thư cơ thể 7 phút" },
        ],
        "22:00": [
          {
            task_id: "P2_22_1",
            task: "Tắm nước ấm + uống sữa ấm (giảm thèm) + ngủ sớm",
          },
          {
            task_id: "P2_22_2",
            task: "Ghi nhật ký lý do mình xứng đáng được sống khỏe",
          },
          { task_id: "P2_22_3", task: "Nghe nhạc nhẹ thư giãn 10 phút" },
        ],
      },
    },
  ],
  // Phase 3: Chuẩn bị cai hoàn toàn
  [
    {
      phase: "P3",
      name: "Còn hút ít, chuẩn bị cai",
      tasks: {
        "07:00": [
          {
            task_id: "P3_07_1",
            task: "Chạy bộ nhẹ 5 phút + uống nước ấm + ghi cảm xúc đầu ngày",
          },
          {
            task_id: "P3_07_2",
            task: "Thiền định buổi sáng 7 phút + viết mục tiêu hôm nay",
          },
          {
            task_id: "P3_07_3",
            task: "Tập thể dục tại chỗ 5 phút + ăn 1 trái chuối (giàu dopamine)",
          },
        ],
        "08:00": [
          {
            task_id: "P3_08_1",
            task: "Ăn sáng với trứng + trái cây + ghi lại cảm giác sau ăn",
          },
          {
            task_id: "P3_08_2",
            task: "Nghe nhạc thư giãn 5 phút + đi bộ chậm 4 phút",
          },
          {
            task_id: "P3_08_3",
            task: "Tự massage cổ vai gáy 3 phút + viết 3 điều mong chờ trong ngày",
          },
        ],
        "10:00": [
          {
            task_id: "P3_10_1",
            task: "Ghi lại 1 lần muốn hút thuốc gần đây + viết cách vượt qua",
          },
          { task_id: "P3_10_2", task: "Thiền thở sâu 6 phút + uống trà gừng" },
          {
            task_id: "P3_10_3",
            task: "Vẽ cảm xúc + chia sẻ lên nhật ký hệ thống",
          },
        ],
        "12:00": [
          {
            task_id: "P3_12_1",
            task: "Ăn trưa chay nhẹ + đi bộ 3 phút sau ăn",
          },
          {
            task_id: "P3_12_2",
            task: "Đọc bài viết về tác hại thuốc lá + ghi lại 1 điều ấn tượng",
          },
          { task_id: "P3_12_3", task: "Tập động tác yoga nhẹ nhàng 5 phút" },
        ],
        "14:00": [
          {
            task_id: "P3_14_1",
            task: "Chạy tại chỗ 3 phút + uống nước + đánh giá cảm giác",
          },
          {
            task_id: "P3_14_2",
            task: "Thiền kiểm soát cảm xúc 5 phút + ghi nhật ký",
          },
          {
            task_id: "P3_14_3",
            task: "Gọi điện cho người ủng hộ + chia sẻ tiến trình",
          },
        ],
        "16:00": [
          {
            task_id: "P3_16_1",
            task: "Bơi/đạp xe 10 phút (nếu có điều kiện) + ghi nhật ký",
          },
          {
            task_id: "P3_16_2",
            task: "Vẽ bản đồ tiến trình cai thuốc + đánh dấu ngày hiện tại",
          },
          {
            task_id: "P3_16_3",
            task: "Làm 1 việc thiện nhỏ trong ngày + viết cảm nhận",
          },
        ],
        "18:00": [
          {
            task_id: "P3_18_1",
            task: "Chuẩn bị bữa tối lành mạnh giàu đạm + chụp ảnh lưu giữ",
          },
          {
            task_id: "P3_18_2",
            task: "Lắng nghe 1 đoạn audio truyền động lực Coach",
          },
          {
            task_id: "P3_18_3",
            task: "Viết thư cho bản thân tương lai không hút thuốc",
          },
        ],
        "20:00": [
          {
            task_id: "P3_20_1",
            task: "Đi bộ thư giãn 5 phút + ngửi tinh dầu cam/quế",
          },
          {
            task_id: "P3_20_2",
            task: "Ghi lại cảm xúc cuối ngày và điều thành công nhỏ",
          },
          { task_id: "P3_20_3", task: "Thiền buông thư cơ thể 7 phút" },
        ],
        "22:00": [
          {
            task_id: "P3_22_1",
            task: "Tắm nước ấm + uống sữa ấm (giảm thèm) + ngủ sớm",
          },
          {
            task_id: "P3_22_2",
            task: "Ghi nhật ký lý do mình xứng đáng được sống khỏe",
          },
          { task_id: "P3_22_3", task: "Nghe nhạc nhẹ thư giãn 10 phút" },
        ],
      },
    },
  ],
  // Phase 4: Cai hoàn toàn – vẫn khó chịu
  [
    {
      phase: "P4",
      name: "Cai hoàn toàn – vẫn khó chịu",
      tasks: {
        "07:00": [
          {
            task_id: "P4_07_1",
            task: "Chạy bộ nhẹ 5 phút + uống nước ấm + ghi cảm xúc đầu ngày",
          },
          {
            task_id: "P4_07_2",
            task: "Thiền định buổi sáng 7 phút + viết mục tiêu hôm nay",
          },
          {
            task_id: "P4_07_3",
            task: "Tập thể dục tại chỗ 5 phút + ăn 1 trái chuối (giàu dopamine)",
          },
        ],
        "08:00": [
          {
            task_id: "P4_08_1",
            task: "Ăn sáng với trứng + trái cây + ghi lại cảm giác sau ăn",
          },
          {
            task_id: "P4_08_2",
            task: "Nghe nhạc thư giãn 5 phút + đi bộ chậm 4 phút",
          },
          {
            task_id: "P4_08_3",
            task: "Tự massage cổ vai gáy 3 phút + viết 3 điều mong chờ trong ngày",
          },
        ],
        "10:00": [
          {
            task_id: "P4_10_1",
            task: "Ghi lại 1 lần muốn hút thuốc gần đây + viết cách vượt qua",
          },
          { task_id: "P4_10_2", task: "Thiền thở sâu 6 phút + uống trà gừng" },
          {
            task_id: "P4_10_3",
            task: "Vẽ cảm xúc + chia sẻ lên nhật ký hệ thống",
          },
        ],
        "12:00": [
          {
            task_id: "P4_12_1",
            task: "Ăn trưa chay nhẹ + đi bộ 3 phút sau ăn",
          },
          {
            task_id: "P4_12_2",
            task: "Đọc bài viết về tác hại thuốc lá + ghi lại 1 điều ấn tượng",
          },
          { task_id: "P4_12_3", task: "Tập động tác yoga nhẹ nhàng 5 phút" },
        ],
        "14:00": [
          {
            task_id: "P4_14_1",
            task: "Chạy tại chỗ 3 phút + uống nước + đánh giá cảm giác",
          },
          {
            task_id: "P4_14_2",
            task: "Thiền kiểm soát cảm xúc 5 phút + ghi nhật ký",
          },
          {
            task_id: "P4_14_3",
            task: "Gọi điện cho người ủng hộ + chia sẻ tiến trình",
          },
        ],
        "16:00": [
          {
            task_id: "P4_16_1",
            task: "Bơi/đạp xe 10 phút (nếu có điều kiện) + ghi nhật ký",
          },
          {
            task_id: "P4_16_2",
            task: "Vẽ bản đồ tiến trình cai thuốc + đánh dấu ngày hiện tại",
          },
          {
            task_id: "P4_16_3",
            task: "Làm 1 việc thiện nhỏ trong ngày + viết cảm nhận",
          },
        ],
        "18:00": [
          {
            task_id: "P4_18_1",
            task: "Chuẩn bị bữa tối lành mạnh giàu đạm + chụp ảnh lưu giữ",
          },
          {
            task_id: "P4_18_2",
            task: "Lắng nghe 1 đoạn audio truyền động lực Coach",
          },
          {
            task_id: "P4_18_3",
            task: "Viết thư cho bản thân tương lai không hút thuốc",
          },
        ],
        "20:00": [
          {
            task_id: "P4_20_1",
            task: "Đi bộ thư giãn 5 phút + ngửi tinh dầu cam/quế",
          },
          {
            task_id: "P4_20_2",
            task: "Ghi lại cảm xúc cuối ngày và điều thành công nhỏ",
          },
          { task_id: "P4_20_3", task: "Thiền buông thư cơ thể 7 phút" },
        ],
        "22:00": [
          {
            task_id: "P4_22_1",
            task: "Tắm nước ấm + uống sữa ấm (giảm thèm) + ngủ sớm",
          },
          {
            task_id: "P4_22_2",
            task: "Ghi nhật ký lý do mình xứng đáng được sống khỏe",
          },
          { task_id: "P4_22_3", task: "Nghe nhạc nhẹ thư giãn 10 phút" },
        ],
      },
    },
  ],
  // Phase 5: Củng cố không tái nghiện
  [
    {
      phase: "P5",
      name: "Củng cố, không hút trở lại",
      tasks: {
        "07:00": [
          {
            task_id: "P5_07_1",
            task: "Chạy bộ nhẹ 5 phút + uống nước ấm + ghi cảm xúc đầu ngày",
          },
          {
            task_id: "P5_07_2",
            task: "Thiền định buổi sáng 7 phút + viết mục tiêu hôm nay",
          },
          {
            task_id: "P5_07_3",
            task: "Tập thể dục tại chỗ 5 phút + ăn 1 trái chuối (giàu dopamine)",
          },
        ],
        "08:00": [
          {
            task_id: "P5_08_1",
            task: "Ăn sáng với trứng + trái cây + ghi lại cảm giác sau ăn",
          },
          {
            task_id: "P5_08_2",
            task: "Nghe nhạc thư giãn 5 phút + đi bộ chậm 4 phút",
          },
          {
            task_id: "P5_08_3",
            task: "Tự massage cổ vai gáy 3 phút + viết 3 điều mong chờ trong ngày",
          },
        ],
        "10:00": [
          {
            task_id: "P5_10_1",
            task: "Ghi lại 1 lần bạn vượt qua cơn thèm gần đây + ăn mừng nhẹ",
          },
          {
            task_id: "P5_10_2",
            task: "Thiền duy trì động lực 5 phút + ghi lại lý do bạn làm được",
          },
          {
            task_id: "P5_10_3",
            task: "Tạo infographic về hành trình đã qua + chia sẻ với Coach",
          },
        ],
        "12:00": [
          {
            task_id: "P5_12_1",
            task: "Ăn trưa lành mạnh + uống nước sau ăn + đi bộ 3 phút",
          },
          {
            task_id: "P5_12_2",
            task: "Xem lại nhật ký cảm xúc các tuần trước",
          },
          {
            task_id: "P5_12_3",
            task: "Thực hiện vài động tác yoga hoặc giãn cơ nhẹ nhàng",
          },
        ],
        "14:00": [
          {
            task_id: "P5_14_1",
            task: "Chạy tại chỗ 3 phút + đánh giá trạng thái hiện tại",
          },
          {
            task_id: "P5_14_2",
            task: "Thiền buông bỏ lo lắng + viết 1 câu nhắn gửi cho bản thân",
          },
          {
            task_id: "P5_14_3",
            task: "Lập kế hoạch cho hoạt động lành mạnh cuối tuần",
          },
        ],
        "16:00": [
          { task_id: "P5_16_1", task: "Bơi/đạp xe nhẹ 10 phút + uống nước" },
          {
            task_id: "P5_16_2",
            task: "Xem video truyền cảm hứng từ người bỏ thuốc thành công",
          },
          {
            task_id: "P5_16_3",
            task: "Ghi lại mục tiêu mới không còn liên quan đến thuốc lá",
          },
        ],
        "18:00": [
          {
            task_id: "P5_18_1",
            task: "Chuẩn bị bữa tối cân bằng dinh dưỡng + ngồi ăn không dùng điện thoại",
          },
          { task_id: "P5_18_2", task: "Chia sẻ 1 bài học bạn rút ra hôm nay" },
          {
            task_id: "P5_18_3",
            task: "Ghi lại điều bạn tự hào nhất trong quá trình cai thuốc",
          },
        ],
        "20:00": [
          { task_id: "P5_20_1", task: "Đi bộ nhẹ sau bữa tối + hít thở sâu" },
          {
            task_id: "P5_20_2",
            task: "Viết thư cảm ơn cho người đã hỗ trợ bạn bỏ thuốc",
          },
          {
            task_id: "P5_20_3",
            task: "Ghi chép về cách bạn sẽ duy trì lối sống không thuốc",
          },
        ],
        "22:00": [
          {
            task_id: "P5_22_1",
            task: "Tắm nước ấm thư giãn + hít tinh dầu nhẹ",
          },
          {
            task_id: "P5_22_2",
            task: "Ghi nhận 3 điều bạn biết ơn trong ngày",
          },
          {
            task_id: "P5_22_3",
            task: "Nghe nhạc nhẹ trước khi ngủ + viết 1 dòng truyền cảm hứng cho ngày mai",
          },
        ],
      },
    },
  ],
];

const generateWeeklyQuota = (months, level) => {
  const totalWeeks = Math.round(months * 4.3);
  const startingQuota = { low: 35, medium: 70, high: 119 };
  const start = startingQuota[level];
  // Nếu chỉ có 1 tuần thì luôn là start
  if (totalWeeks <= 1) return [{ week: 1, maxCigs: start }];
  const step = (start - 0) / (totalWeeks - 1);
  return Array.from({ length: totalWeeks }, (_, i) => ({
    week: i + 1,
    maxCigs: Math.round(Math.max(0, start - step * i)),
  }));
};

const distributeDailyQuota = (weeklyCigs) => {
  const basePattern = [14, 13, 12, 11, 9, 6, 5];
  const baseTotal = basePattern.reduce((a, b) => a + b, 0);
  let raw = basePattern.map((val) => (val / baseTotal) * weeklyCigs);

  // Làm tròn xuống từng ngày
  let rounded = raw.map(Math.floor);
  let sum = rounded.reduce((a, b) => a + b, 0);

  // Phân bổ số còn thiếu (nếu tổng < weeklyCigs)
  let diff = Math.round(weeklyCigs - sum);
  while (diff > 0) {
    // Tìm ngày có phần thập phân lớn nhất để cộng thêm 1
    let maxIdx = 0;
    let maxFrac = 0;
    raw.forEach((v, i) => {
      const frac = v - Math.floor(v);
      if (frac > maxFrac) {
        maxFrac = frac;
        maxIdx = i;
      }
    });
    rounded[maxIdx]++;
    diff--;
  }
  return rounded;
};

const QuitPlan = () => {
  const [startDate, setStartDate] = useState(null);
  const [months, setMonths] = useState(null);
  const [showModal, setShowModal] = useState(true);
  const [user, setUser] = useState(null);
  const [viewMode, setViewMode] = useState("week");
  const [smokingLog, setSmokingLog] = useState({});
  const [tempSmokingLog, setTempSmokingLog] = useState({});
  const [habitLogByDate, setHabitLogByDate] = useState({});

  const [currentWeekPage, setCurrentWeekPage] = useState(() => {
    const savedPage = sessionStorage.getItem("quitPlanPage");
    return savedPage ? parseInt(savedPage, 10) : 1;
  });
  const [ftndLevel, setFtndLevel] = useState("");
  const navigate = useNavigate();

  // Fetch habit log từng ngày
  useEffect(() => {
    if (!user?.id || !startDate || !months) return;
    const token = localStorage.getItem("token");

    const fetchLogs = async () => {
      const logs = {};
      for (let i = 0; i < months * 30; i++) {
        const dateObj = startDate.clone().add(i, "day");
        const dateKey = dateObj.format("YYYY-MM-DD");

        const res = await fetch(
          `http://localhost:5000/api/habit-log?date=${dateKey}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const data = await res.json();

        if (
          typeof data.completedCount === "number" &&
          typeof data.totalSlots === "number"
        ) {
          logs[dateKey] = {
            completedCount: data.completedCount,
            completedTasks: data.completedTasks || 0,
            totalSlots: data.totalSlots,
          };
        } else if (Array.isArray(data.data)) {
          const count = data.data.filter(Boolean).length; // ✅ tính số lượng true
          logs[dateKey] = {
            completedCount: count,
            totalSlots: data.data.length,
          };
          console.log("🎯 Log processed:", dateKey, logs[dateKey]); // ✅ giữ lại dòng log này
        } else {
          logs[dateKey] = { completedCount: 0, totalSlots: 9 };
        }
      }

      setHabitLogByDate({ ...logs });
    };

    fetchLogs();
  }, [user?.id, startDate, months]);

  // Lấy mức độ nghiện từ API
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user?.id) {
      setFtndLevel("Không xác định");
      return;
    }

    fetch(`http://localhost:5000/api/customer/ftnd-level/${user.id}`)
      .then((res) => res.json())
      .then((data) => {
        setFtndLevel(data.ftnd_level || "Không xác định");
      })
      .catch(() => setFtndLevel("Không xác định"));
  }, []);

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    if (!storedUser) return;
    setUser(storedUser);
    axios
      .get(`http://localhost:5000/api/quitplan/exists/${storedUser.id}`)
      .then((res) => {
        if (res.data.hasPlan) {
          setStartDate(dayjs(res.data.start_date));
          setMonths(res.data.quit_months);
          setShowModal(false);
        } else {
          setShowModal(true);
        }
      })
      .catch((err) => {
        console.error("Lỗi kiểm tra kế hoạch:", err);
        message.error("Không thể kiểm tra kế hoạch");
      });
  }, []);

  useEffect(() => {
    if (!user?.id || !startDate || !months || !ftndLevel) return;

    fetch(`http://localhost:5000/api/smoking-summary/all/${user.id}`)
      .then((res) => res.json())
      .then(async (data) => {
        if (data.length === 0) {
          // Nếu user này chưa có dữ liệu, tự động lưu số điếu gợi ý vào DB
          const plan = [];
          const totalDays = months * 30;
          const weeklyQuota = generateWeeklyQuota(months, level);
          for (let i = 0; i < totalDays; i++) {
            const currentDate = startDate.add(i, "day");
            const formattedDate = currentDate.format("DD/MM/YYYY");
            const weekIndex = Math.floor(i / 7);
            const weeklyCigs = weeklyQuota[weekIndex]?.maxCigs || 0;
            console.log(
              "Ngày:",
              formattedDate,
              "weekIndex:",
              weekIndex,
              "weeklyCigs:",
              weeklyCigs
            );
            const dailyPattern = distributeDailyQuota(weeklyCigs);
            console.log("dailyPattern:", dailyPattern);
            const dailyQuota = dailyPattern[i % 7] || 0;
            plan.push({ date: formattedDate, total_cigarettes: dailyQuota });
          }
          // Gửi từng ngày lên server cho user này
          const token = localStorage.getItem("token");
          for (const item of plan) {
            await fetch("http://localhost:5000/api/smoking-summary/single", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                date: dayjs(item.date, "DD/MM/YYYY").format("YYYY-MM-DD"),
                total_cigarettes: item.total_cigarettes,
              }),
            });
          }
          // Sau khi lưu xong, reload lại dữ liệu cho user này
          fetch(`http://localhost:5000/api/smoking-summary/all/${user.id}`)
            .then((res) => res.json())
            .then((data) => {
              const log = {};
              data.forEach((entry) => {
                const formattedDate = dayjs(entry.date).format("DD/MM/YYYY");
                log[formattedDate] = entry.total_cigarettes;
              });
              setSmokingLog(log);
            });
        } else {
          // Nếu đã có dữ liệu thì chỉ cần set vào state
          const log = {};
          data.forEach((entry) => {
            const formattedDate = dayjs(entry.date).format("DD/MM/YYYY");
            log[formattedDate] = entry.total_cigarettes;
          });
          setSmokingLog(log);
        }
      })
      .catch((err) => {
        console.error("Lỗi khi tải dữ liệu số điếu:", err);
      });
  }, [user?.id, startDate, months, ftndLevel]);

  const handlePlanReady = ({ startDate, months }) => {
    setStartDate(dayjs(startDate));
    setMonths(months);
    setShowModal(false);
  };

  const handleResetPlan = async () => {
    try {
      await axios.post("http://localhost:5000/api/quitplan/reset", {
        user_id: user.id,
      });
      // Xóa luôn log cũ
      // await axios.delete(`http://localhost:5000/api/smoking-summary/all/${user.id}`);
      sessionStorage.removeItem("quitPlanPage");
      message.success("Đã đặt lại kế hoạch");
      setShowModal(true);
    } catch (err) {
      console.error("Lỗi reset kế hoạch:", err);
      message.error("Không thể đặt lại kế hoạch");
    }
  };

  const totalDays = months ? months * 30 : 0;
  const normalizeLevel = (level) => {
    if (!level) return "medium";
    const l = level.trim().toLowerCase();
    if (l === "low") return "low";
    if (l === "medium") return "medium";
    if (l === "high") return "high";
    return "medium";
  };

  const level = useMemo(() => normalizeLevel(ftndLevel), [ftndLevel]);
  const weeklyQuota = useMemo(
    () =>
      startDate && months && ftndLevel
        ? generateWeeklyQuota(months, level)
        : [],
    [months, level, startDate, ftndLevel]
  );
  const getRemainingCigs = (
    dateStr,
    weeklyQuota,
    log = smokingLog,
    tempLog = tempSmokingLog,
    excludeCurrent = false
  ) => {
    const date = dayjs(dateStr, "DD/MM/YYYY");
    const weekIndex = Math.floor(date.diff(startDate, "day") / 7);

    // Lấy tất cả ngày trong tuần từ cả log và tempLog
    const allDates = new Set([...Object.keys(log), ...Object.keys(tempLog)]);
    const weekDates = Array.from(allDates).filter((key) => {
      const d = dayjs(key, "DD/MM/YYYY");
      const wi = Math.floor(d.diff(startDate, "day") / 7);
      return wi === weekIndex && (!excludeCurrent || key !== dateStr);
    });

    // Tính tổng số điếu đã nhập (ưu tiên tempLog nếu có)
    let used = weekDates.reduce((sum, key) => {
      const tempVal = tempLog[key];
      const val = log[key];
      return sum + Number(tempVal !== undefined ? tempVal : val || 0);
    }, 0);

    const quota = weeklyQuota[weekIndex]?.maxCigs || 0;
    return Math.max(0, quota - used);
  };

  // Sau đó mới khai báo planData
  const planData = useMemo(() => {
    if (!startDate || !months) return [];
    const data = [];
    for (let i = 0; i < totalDays; i++) {
      const currentDate = startDate.add(i, "day");
      const formattedDate = currentDate.format("DD/MM/YYYY");
      const progress = Math.round((i / (totalDays - 1)) * 100);
      const phase = PHASES.find(
        ({ range }) => progress >= range[0] && progress <= range[1]
      );
      const weekIndex = Math.floor(i / 7);
      const weeklyCigs = weeklyQuota[weekIndex]?.maxCigs || 0;
      const dailyPattern = distributeDailyQuota(weeklyCigs);
      const dailyQuota = dailyPattern[i % 7] || 0;
      const label =
        viewMode === "month"
          ? `Tháng ${Math.floor(i / 30) + 1} – Ngày ${(i % 30) + 1}`
          : `Tuần ${weekIndex + 1} – Ngày ${i - weekIndex * 7 + 1}`;
      data.push({
        key: i,
        date: formattedDate, // "DD/MM/YYYY" để hiển thị
        dateKey: currentDate.format("YYYY-MM-DD"), // key chuẩn để lấy log
        rawDate: currentDate.toISOString(),
        progress: `${progress}%`,
        phase: `${phase.phase} – ${phase.goal}`,
        suggestedCigs: dailyQuota,
        actualCigs: smokingLog[formattedDate] || "",
        // Sửa dòng này: truyền tempSmokingLog vào để tính luôn giá trị tạm thời
        remainingCigs: getRemainingCigs(
          formattedDate,
          weeklyQuota,
          smokingLog,
          tempSmokingLog // <-- thêm vào đây
        ),
        weekIndex,
        weekDayLabel: label,
        detailPlan: BEHAVIOR_PLAN_PHASES[PHASES.indexOf(phase)],
      });
    }
    return data;
  }, [startDate, months, viewMode, smokingLog, tempSmokingLog]); // <-- thêm tempSmokingLog vào dependency

  const columns = [
    {
      title: "Ngày kế hoạch",
      dataIndex: "weekDayLabel",
      key: "weekDayLabel",
      render: (text) => (
        <Tag color="geekblue" style={{ fontWeight: 600 }}>
          {text}
        </Tag>
      ),
    },
    { title: "Ngày", dataIndex: "date", key: "date" },
    {
      title: "Tiến trình ngày",
      dataIndex: "dateKey", // dùng dateKey
      key: "progress",
      render: (rawDate) => {
        const key = dayjs(rawDate).format("YYYY-MM-DD");
        const log = habitLogByDate[key];

        const noSmokePercent = log
          ? Math.round((log.completedCount / log.totalSlots) * 100)
          : 0;
        const taskPercent = log
          ? Math.round((log.completedTasks / log.totalSlots) * 100)
          : 0;

        return (
          <div style={{ minWidth: 100 }}>
            <div style={{ fontSize: 12, marginBottom: 4 }}>
              🚭 Không hút thuốc
            </div>
            <Progress
              percent={noSmokePercent}
              size="small"
              strokeColor={{ "0%": "#108ee9", "100%": "#87d068" }}
              showInfo={false}
            />
            <div style={{ fontSize: 12, margin: "8px 0 4px" }}>🎯 Nhiệm vụ</div>
            <Progress
              percent={taskPercent}
              size="small"
              strokeColor={{ "0%": "#fa8c16", "100%": "#52c41a" }}
              showInfo={false}
            />
          </div>
        );
      },
    },
    {
      title: "Giai đoạn",
      dataIndex: "phase",
      key: "phase",
      render: (val) => {
        let color = "blue";
        if (val.includes("quyết liệt")) color = "orange";
        if (val.includes("chuẩn bị cai")) color = "purple";
        if (val.includes("hoàn toàn")) color = "red";
        if (val.includes("Củng cố")) color = "green";
        return <Tag color={color}>{val}</Tag>;
      },
    },

    {
      title: "Bạn hút",
      dataIndex: "date",
      key: "actualCigs",
      render: (date) => (
        <SmokingInputCell
          date={date}
          value={smokingLog[date] || 0}
          tempValue={tempSmokingLog[date]}
          isPast={dayjs(date, "DD/MM/YYYY").isBefore(dayjs(), "day")}
          setSmokingLog={setSmokingLog}
          setTempSmokingLog={setTempSmokingLog}
        />
      ),
    },

    {
      title: "Còn lại",
      dataIndex: "remainingCigs",
      key: "remainingCigs",
      render: (val, record) => {
        let color = "green";
        let groupDates = [];
        let quota = 0;
        if (viewMode === "week") {
          groupDates = planData
            .filter((r) => r.weekIndex === record.weekIndex)
            .map((r) => r.date);
          quota = weeklyQuota[record.weekIndex]?.maxCigs || 0;
        } else {
          // Lấy đúng 30 ngày của tháng này
          const monthIndex = Math.floor(record.key / 30);
          groupDates = planData
            .filter((r) => Math.floor(r.key / 30) === monthIndex)
            .map((r) => r.date);

          // Tổng quota tháng = tổng suggestedCigs của 30 ngày này
          quota = planData
            .filter((r) => Math.floor(r.key / 30) === monthIndex)
            .reduce((sum, r) => sum + (Number(r.suggestedCigs) || 0), 0);
        }
        // Tổng số điếu đã nhập (ưu tiên temp, nếu chưa thì lấy log)
        const totalUsed = groupDates.reduce((sum, date) => {
          const tempVal = tempSmokingLog[date];
          const val = tempVal !== undefined ? tempVal : smokingLog[date] || 0;
          return sum + Number(val);
        }, 0);
        const remain = Math.max(0, quota - totalUsed);

        if (remain <= 10) color = "orange";
        if (remain <= 3) color = "red";
        return (
          <Tooltip
            title={
              viewMode === "week"
                ? "Còn lại trong tuần này"
                : "Còn lại trong tháng này"
            }
          >
            <Badge
              count={remain}
              style={{ backgroundColor: color, marginRight: 8 }}
              showZero
            />
            <span style={{ marginLeft: 8, color }}>{remain} điếu</span>
          </Tooltip>
        );
      },
    },
  ];

  const weekPageSize = 7; // Số ngày trong 1 tuần
  const weekTotal = weeklyQuota.length; // Tổng số tuần dựa trên weeklyQuota

  // --- Tiến trình demo ---
  const percentThucTe =
    startDate && months
      ? Math.min(
          100,
          Math.round(
            ((dayjs().diff(startDate, "day") + 1) / (months * 30)) * 100
          )
        )
      : 0;
  const [animatedPercent, setAnimatedPercent] = useState(percentThucTe);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (!isAnimating) setAnimatedPercent(percentThucTe);
  }, [percentThucTe, isAnimating]);

  const handleRocketClick = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    let current = animatedPercent;
    const target = 100;
    const speed = 1;
    const interval = setInterval(() => {
      current += speed;
      if (current >= target) {
        current = target;
        setAnimatedPercent(current);
        clearInterval(interval);
        setTimeout(() => {
          setIsAnimating(false);
          setAnimatedPercent(percentThucTe);
        }, 1200);
      } else {
        setAnimatedPercent(current);
      }
    }, 100);
  };

  if (showModal && user) {
    return (
      <PlanSetupModal
        userId={user.id}
        onPlanReady={handlePlanReady}
        onResetPlan={handleResetPlan}
      />
    );
  }

  if (!startDate || !months || !ftndLevel) {
    return <Spin fullscreen tip="Đang tải kế hoạch..." />;
  }

  return (
    <div
      className="quit-plan-wrapper"
      style={{ maxWidth: 1200, margin: "0 auto", padding: 24 }}
    >
      <Navbar />
      <Row justify="center">
        <Col xs={24} sm={24} md={24} lg={24}>
          <Card variant="outlined" hoverable style={{ marginBottom: 24 }}>
            <Title
              level={3}
              style={{
                marginBottom: 0,
                textAlign: "center",
                background: "linear-gradient(to right, #1890ff, #73d13d)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                fontWeight: 700,
                fontSize: 28,
              }}
            >
              <CalendarOutlined style={{ marginRight: 8 }} /> Kế hoạch cai
              nghiện thuốc lá
            </Title>
            <Divider style={{ margin: "12px 0" }} />
            <Alert
              message={
                <span style={{ fontWeight: 500 }}>
                  Mức độ nghiện hiện tại: <b>{ftndLevel}</b>
                </span>
              }
              description={
                <span>
                  <b>Hãy tuân thủ kế hoạch</b> để đạt hiệu quả tốt nhất!
                  <Tag color="success" style={{ marginLeft: 8 }}>
                    Đang thực hiện
                  </Tag>
                </span>
              }
              type="info"
              showIcon
              style={{ marginBottom: 16, textAlign: "center" }}
            />
          </Card>

          <Card variant="outlined">
            <div
              style={{
                display: "flex",
                gap: 32,
                justifyContent: "center",
                alignItems: "center", // Đảm bảo căn giữa theo chiều dọc
                margin: "16px 0 24px 0",
                flexWrap: "wrap",
                width: "100%",
              }}
            >
              {/* Tiến trình cai */}
              <Card
                style={{
                  flex: 1,
                  minWidth: 320,
                  maxWidth: 420,
                  borderRadius: 20,
                  boxShadow: "0 4px 24px #e6f7ff",
                  background: "#fff",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center", // Căn giữa nội dung
                  justifyContent: "center",
                  width: "100%", // Thêm width 100%
                  padding: 32,
                }}
                bodyStyle={{ padding: 0, width: "100%" }}
                bordered={false}
              >
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    width: "100%", // Đảm bảo nội dung căn giữa
                  }}
                >
                  <div
                    style={{
                      position: "relative",
                      width: 140,
                      height: 140,
                      marginBottom: 8,
                      margin: "0 auto",
                    }}
                  >
                    <Progress
                      type="circle"
                      percent={animatedPercent}
                      width={140}
                      strokeWidth={10}
                      strokeColor={{
                        "0%": "#73d13d",
                        "50%": "#1890ff",
                        "100%": "#faad14",
                      }}
                      trailColor="#f0f0f0"
                      format={() => null}
                      style={{ filter: "drop-shadow(0 2px 8px #bae7ff)" }}
                    />
                    <div
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: 140,
                        height: 140,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        pointerEvents: "none",
                        userSelect: "none",
                      }}
                    >
                      <span
                        style={{
                          fontWeight: 700,
                          fontSize: 36,
                          color: "#1890ff",
                          marginBottom: 2,
                          pointerEvents: "auto",
                          cursor: isAnimating ? "not-allowed" : "pointer",
                          transition: "color 0.2s",
                        }}
                        onClick={!isAnimating ? handleRocketClick : undefined}
                        title="Tăng tiến trình demo"
                      >
                        {animatedPercent}%
                      </span>
                      <RocketOutlined
                        style={{
                          fontSize: 32,
                          color: isAnimating ? "#faad14" : "#52c41a",
                          marginTop: 2,
                          pointerEvents: "auto",
                          cursor: isAnimating ? "not-allowed" : "pointer",
                          transition: "color 0.2s",
                          filter: isAnimating
                            ? "drop-shadow(0 0 8px #faad14)"
                            : "none",
                        }}
                        onClick={!isAnimating ? handleRocketClick : undefined}
                        title="Tăng tiến trình demo"
                      />
                    </div>
                  </div>
                  <div style={{ marginTop: 12, display: "flex", gap: 12 }}>
                    <Tag
                      color="blue"
                      style={{
                        fontSize: 16,
                        padding: "4px 16px",
                        borderRadius: 8,
                        fontWeight: 600,
                        background: "#e6f7ff",
                        color: "#1890ff",
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                      icon={<CalendarOutlined />}
                    >
                      {startDate
                        ? `${Math.round(
                            (animatedPercent / 100) * totalDays
                          )} / ${totalDays} ngày`
                        : ""}
                    </Tag>
                  </div>
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: 24,
                      color: "#1d39c4",
                      marginTop: 16,
                      textAlign: "center",
                      letterSpacing: 0.5,
                      textShadow: "0 2px 8px #e6f7ff",
                    }}
                  >
                    Tiến trình cai
                  </div>
                </div>
              </Card>

              {/* Giai đoạn hiện tại */}
              <Card
                style={{
                  flex: 2,
                  minWidth: 340,
                  maxWidth: 600,
                  borderRadius: 20,
                  boxShadow: "0 2px 12px #fffbe6",
                  padding: 32,
                  background: "#fff",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                }}
                bodyStyle={{ padding: 0, width: "100%" }}
                bordered={false}
              >
                <div
                  style={{
                    fontSize: 18,
                    color: "#fa8c16",
                    fontWeight: 700,
                    marginBottom: 4,
                  }}
                >
                  Giai đoạn hiện tại
                </div>
                <div
                  style={{
                    fontSize: 22,
                    color: "#fa8c16",
                    fontWeight: 700,
                    marginBottom: 8,
                  }}
                >
                  {(() => {
                    const percent = animatedPercent;
                    const currentPhaseIdx = PHASES.findIndex(
                      ({ range }) => percent >= range[0] && percent <= range[1]
                    );
                    const currentPhase = PHASES[currentPhaseIdx];
                    return currentPhase
                      ? `${currentPhase.phase} - ${currentPhase.goal}`
                      : "";
                  })()}
                </div>
                <div style={{ fontSize: 16, color: "#222", marginBottom: 16 }}>
                  {(() => {
                    const percent = animatedPercent;
                    const currentPhaseIdx = PHASES.findIndex(
                      ({ range }) => percent >= range[0] && percent <= range[1]
                    );
                    const nextPhase = PHASES[currentPhaseIdx + 1];
                    if (!nextPhase) return "Bạn đã ở giai đoạn cuối!";
                    const percentToNext = nextPhase.range[0] - percent;
                    return percentToNext > 0
                      ? `Còn ${Math.ceil(percentToNext)}% nữa đến ${
                          nextPhase.phase
                        }`
                      : `Sắp sang giai đoạn tiếp theo!`;
                  })()}
                </div>
                <div
                  style={{
                    height: 8,
                    background: "#eee",
                    borderRadius: 4,
                    overflow: "hidden",
                    marginBottom: 12,
                  }}
                >
                  <div
                    style={{
                      width: `${animatedPercent}%`,
                      height: "100%",
                      background: "#faad14",
                      transition: "width 0.5s",
                    }}
                  />
                </div>
                {/* Tag màu mè cho Bắt đầu và Thời gian */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginTop: 8,
                    gap: 8,
                  }}
                >
                  <Tag
                    color="blue"
                    style={{
                      fontSize: 16,
                      padding: "4px 16px",
                      borderRadius: 8,
                      fontWeight: 600,
                      background: "#e6f7ff",
                      color: "#1890ff",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                    icon={<CalendarOutlined />}
                  >
                    Bắt đầu: {startDate?.format("DD/MM/YYYY")}
                  </Tag>
                  <Tag
                    color="green"
                    style={{
                      fontSize: 16,
                      padding: "4px 16px",
                      borderRadius: 8,
                      fontWeight: 600,
                      background: "#f6ffed",
                      color: "#52c41a",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                    icon={<InfoCircleOutlined />}
                  >
                    Thời gian: {months} tháng
                  </Tag>
                </div>
              </Card>
            </div>

            <Table
              columns={columns}
              dataSource={planData}
              title={() => (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "12px 16px",
                    background: "#f5f7fa",
                    borderRadius: 12,
                    marginBottom: 8,
                    boxShadow: "0 2px 8px rgba(24,144,255,0.04)",
                  }}
                >
                  <span
                    style={{
                      fontWeight: 700,
                      fontSize: 20,
                      color: "#1d39c4",
                      letterSpacing: 0.5,
                    }}
                  >
                    <CalendarOutlined
                      style={{ marginRight: 8, color: "#1890ff" }}
                    />
                    Bảng kế hoạch chi tiết
                  </span>
                  <div style={{ display: "flex", gap: 12 }}>
                    <Select
                      value={viewMode}
                      onChange={(val) => {
                        setViewMode(val);
                        setCurrentWeekPage(1);
                      }}
                      options={[
                        { label: "Xem theo tuần", value: "week" },
                        { label: "Xem theo tháng", value: "month" },
                      ]}
                      size="large"
                      style={{
                        minWidth: 170,
                        fontWeight: 600,
                        fontSize: 16,
                        borderRadius: 8,
                        background: "#fff",
                        boxShadow: "0 1px 4px rgba(24,144,255,0.07)",
                      }}
                    />
                    <Button
                      danger
                      onClick={handleResetPlan}
                      style={{
                        height: 48,
                        fontWeight: 600,
                        fontSize: 16,
                        borderRadius: 8,
                        marginLeft: 0,
                        boxShadow: "0 1px 4px rgba(255,77,79,0.07)",
                        border: "1.5px solid #ff4d4f",
                      }}
                      size="large"
                    >
                      Đặt lại kế hoạch
                    </Button>
                  </div>
                </div>
              )}
              pagination={
                viewMode === "week"
                  ? {
                      current: currentWeekPage,
                      pageSize: weekPageSize,
                      total: planData.length,
                      showSizeChanger: false,
                      onChange: (page) => {
                        setCurrentWeekPage(page);
                        sessionStorage.setItem("quitPlanPage", page);
                      },
                      showTotal: () => `Tuần ${currentWeekPage} / ${weekTotal}`,
                    }
                  : { pageSize: 30 }
              }
              rowClassName={(record) => `week-row-${record.weekIndex % 5}`}
              locale={{
                emptyText: <Empty description="Không có dữ liệu kế hoạch" />,
              }}
              onRow={(record) => ({
                onClick: (e) => {
                  if (
                    e.target.closest("input") ||
                    e.target.closest("button") ||
                    e.target.closest(".ant-input-number") ||
                    e.target.closest(".ant-select")
                  ) {
                    return;
                  }
                  navigate(
                    `/quit-plan-detail/${record.date.replaceAll("/", "-")}`,
                    {
                      state: {
                        ...record,
                        rawStartDate: startDate.toISOString(),
                        behaviorTasks: record.detailPlan?.[0]?.tasks || {},
                      },
                    }
                  );
                },
              })}
              style={{ background: "#fff", width: "100%" }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

const SmokingInputCell = ({
  date,
  value,
  tempValue,
  isPast,
  setSmokingLog,
  setTempSmokingLog,
}) => {
  const [inputValue, setInputValue] = useState(
    tempValue !== undefined ? tempValue : value
  );
  const [loading, setLoading] = useState(false);
  const [clicked, setClicked] = useState(false);

  useEffect(() => {
    setInputValue(tempValue !== undefined ? tempValue : value);
  }, [value, tempValue]);

  const handleSave = async () => {
    setLoading(true);
    setClicked(true); // Thêm hiệu ứng
    setTimeout(() => setClicked(false), 400); // Reset hiệu ứng sau 0.4s
    const formatted = dayjs(date, "DD/MM/YYYY").format("YYYY-MM-DD");
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(
        "http://localhost:5000/api/smoking-summary/single",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            date: formatted,
            total_cigarettes: inputValue,
          }),
        }
      );
      const data = await res.json();
      if (data.success) {
        message.success("✅ Đã lưu!");
        setSmokingLog((prev) => ({ ...prev, [date]: inputValue }));
        setTempSmokingLog((prev) => {
          const { [date]: _, ...rest } = prev;
          return rest;
        });
      } else {
        message.error("❌ Không thể lưu.");
      }
    } catch {
      message.error("❌ Lỗi khi kết nối server.");
    }
    setLoading(false);
  };

  const handleChange = (val) => {
    setInputValue(val);
    setTempSmokingLog((prev) => ({ ...prev, [date]: val }));
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
      <InputNumber
        min={0}
        value={inputValue}
        style={{ width: 100, height: 44, fontSize: 18 }} // tăng width, height, font
        disabled={isPast}
        onChange={handleChange}
      />
      <Button
        size="large"
        type="primary"
        loading={loading}
        disabled={isPast || inputValue === value}
        onClick={handleSave}
        className={`confirm-btn${clicked ? " clicked" : ""}`}
        style={{ height: 44, fontSize: 16 }} // tăng size nút
      >
        Xác nhận
      </Button>
    </div>
  );
};

export default QuitPlan;
