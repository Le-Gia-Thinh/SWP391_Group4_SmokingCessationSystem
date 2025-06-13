import React from "react";
import { Form, Radio, Button, Typography } from "antd";
import axios from "axios";
import "./FTNDTest.css";
import { useNavigate } from "react-router-dom";

const { Title } = Typography;

const FTNDTest = () => {
  const navigate = useNavigate();
  const onFinish = async (values) => {
    const storedUser = localStorage.getItem("user");
    const user = storedUser ? JSON.parse(storedUser) : null;

    if (!user) {
      alert("Bạn cần đăng nhập để gửi đánh giá.");
      return;
    }

    let score = 0;
    score += parseInt(values.q1);
    ["q2", "q3", "q5", "q6"].forEach((key) => {
      score += parseInt(values[key]);
    });
    score += parseInt(values.q4);

    let level = "";
    if (score <= 3) level = "Low";
    else if (score <= 6) level = "Medium";
    else level = "High";

    try {
      await axios.post("http://localhost:5000/api/ftnd/result", {
        user_id: user.id,
        level,
      });

      alert(`Đánh giá gửi thành công!\nMức độ: ${level}`);
      navigate("/QuitPlanCalendar"); // ✅ chuyển trang sau khi thành công
    } catch (err) {
      console.error("Lỗi gửi dữ liệu:", err);
      alert("Gửi đánh giá thất bại.");
    }
  };

  return (
    <div className="ftnd-wrapper">
      <div className="ftnd-container">
        <Title level={3} className="ftnd-title">
          Bài đánh giá mức độ nghiện (FTND)
        </Title>
        <Form layout="vertical" onFinish={onFinish}>
          <Form.Item
            label="1. Hút điếu đầu tiên sau khi thức dậy?"
            name="q1"
            rules={[{ required: true, message: "Vui lòng chọn đáp án!" }]}
          >
            <Radio.Group className="ftnd-options">
              <Radio value={3}>≤ 5 phút</Radio>
              <Radio value={2}>6–30 phút</Radio>
              <Radio value={1}>31–60 phút</Radio>
              <Radio value={0}>&gt; 60 phút</Radio>
            </Radio.Group>
          </Form.Item>

          <Form.Item
            label="2. Có hút ở nơi bị cấm không?"
            name="q2"
            rules={[{ required: true, message: "Vui lòng chọn đáp án!" }]}
          >
            <Radio.Group className="ftnd-options">
              <Radio value={1}>Có</Radio>
              <Radio value={0}>Không</Radio>
            </Radio.Group>
          </Form.Item>

          <Form.Item
            label="3. Điếu thuốc nào khó bỏ nhất? (điếu đầu tiên buổi sáng)"
            name="q3"
            rules={[{ required: true, message: "Vui lòng chọn đáp án!" }]}
          >
            <Radio.Group className="ftnd-options">
              <Radio value={1}>Có</Radio>
              <Radio value={0}>Không</Radio>
            </Radio.Group>
          </Form.Item>

          <Form.Item
            label="4. Số điếu thuốc hút mỗi ngày?"
            name="q4"
            rules={[{ required: true, message: "Vui lòng chọn đáp án!" }]}
          >
            <Radio.Group className="ftnd-options">
              <Radio value={3}>&ge; 31</Radio>
              <Radio value={2}>21–30</Radio>
              <Radio value={1}>11–20</Radio>
              <Radio value={0}>&le; 10</Radio>
            </Radio.Group>
          </Form.Item>

          <Form.Item
            label="5. Có hút nhiều hơn vào buổi sáng không?"
            name="q5"
            rules={[{ required: true, message: "Vui lòng chọn đáp án!" }]}
          >
            <Radio.Group className="ftnd-options">
              <Radio value={1}>Có</Radio>
              <Radio value={0}>Không</Radio>
            </Radio.Group>
          </Form.Item>

          <Form.Item
            label="6. Có hút khi bị bệnh nằm giường không?"
            name="q6"
            rules={[{ required: true, message: "Vui lòng chọn đáp án!" }]}
          >
            <Radio.Group className="ftnd-options">
              <Radio value={1}>Có</Radio>
              <Radio value={0}>Không</Radio>
            </Radio.Group>
          </Form.Item>

          <Form.Item>
            <div style={{ display: "flex", justifyContent: "center", gap: 16 }}>
              <Button
                type="primary"
                htmlType="submit"
                className="ftnd-submit-button"
                style={{
                  background: "#52c41a",
                  borderColor: "#52c41a",
                  fontWeight: 600,
                  minWidth: 140,
                  fontSize: 16,
                  borderRadius: 8,
                }}
              >
                Gửi đánh giá
              </Button>
              <Button
                type="default"
                onClick={() => navigate("/")}
                style={{
                  fontWeight: 600,
                  minWidth: 140,
                  fontSize: 16,
                  borderRadius: 8,
                }}
              >
                Hủy
              </Button>
            </div>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
};

export default FTNDTest;
