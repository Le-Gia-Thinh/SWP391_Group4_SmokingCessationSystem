import React, { useState } from "react";
import {
  Form,
  Radio,
  Button,
  Typography,
  Progress,
  notification,
  Card,
  Row,
  Col,
} from "antd";
import {
  CheckCircleOutlined,
  LoadingOutlined,
  HeartOutlined,
  TrophyOutlined,
} from "@ant-design/icons";
import axios from "axios";
import "./FTNDTest.css";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";

const { Title, Text } = Typography;

const FTNDTest = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const totalQuestions = 6;

  // Theo dõi tiến độ form
  const handleValuesChange = () => {
    const values = form.getFieldsValue();
    const completedFields = Object.keys(values).filter(
      (key) => values[key] !== undefined
    ).length;
    setCurrentStep(completedFields);
  };

  const onFinish = async (values) => {
    setIsLoading(true);
    const storedUser = localStorage.getItem("user");
    const user = storedUser ? JSON.parse(storedUser) : null;

    if (!user) {
      notification.error({
        message: "Lỗi xác thực",
        description: "Bạn cần đăng nhập để gửi đánh giá.",
        placement: "topRight",
        icon: <HeartOutlined style={{ color: "#ff4d4f" }} />,
      });
      setIsLoading(false);
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

    console.log("📤 FTND sending:", {
      user_id: user.id,
      level,
      q4_value: parseInt(values.q4),
    });

    try {
      await axios.post("http://localhost:5000/api/ftnd/result", {
        user_id: user.id,
        level,
        q4_value: parseInt(values.q4),
      });

      notification.success({
        message: "Thành công!",
        description: `Đánh giá gửi thành công! Mức độ nghiện: ${level}`,
        placement: "topRight",
        icon: <TrophyOutlined style={{ color: "#52c41a" }} />,
      });

      await new Promise((resolve) => setTimeout(resolve, 1500));
      navigate("/QuitPlanCalendar");
    } catch (err) {
      console.error("Lỗi gửi dữ liệu:", err);
      notification.error({
        message: "Lỗi",
        description: "Gửi đánh giá thất bại. Vui lòng thử lại.",
        placement: "topRight",
        icon: <HeartOutlined style={{ color: "#ff4d4f" }} />,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="ftndTest-wrapper">
      {/* Progress indicator */}
      <div
        className="ftndTest-progress-indicator"
        style={{ width: `${(currentStep / totalQuestions) * 100}%` }}
      />

      <div className="ftndTest-container">
        <div className="container-fluid">
          <div className="row justify-content-center">
            <div className="col-12 col-lg-10 col-xl-8">
              <Title level={2} className="ftndTest-title">
                Bài đánh giá mức độ nghiện (FTND)
              </Title>

              <Row justify="center" style={{ marginBottom: "2rem" }}>
                <Col span={24}>
                  <Progress
                    percent={(currentStep / totalQuestions) * 100}
                    showInfo={false}
                    strokeColor={{
                      "0%": "#667eea",
                      "100%": "#764ba2",
                    }}
                    style={{ marginBottom: "1rem" }}
                  />
                  <Text
                    type="secondary"
                    style={{ display: "block", textAlign: "center" }}
                  >
                    Câu hỏi {currentStep}/{totalQuestions}
                  </Text>
                </Col>
              </Row>

              <Form
                form={form}
                layout="vertical"
                onFinish={onFinish}
                onValuesChange={handleValuesChange}
              >
                <div className="row">
                  <div className="col-12">
                    <Form.Item
                      label={
                        <span className="ftndTest-question-label">
                          1. Hút điếu đầu tiên sau khi thức dậy?
                        </span>
                      }
                      name="q1"
                      rules={[
                        { required: true, message: "Vui lòng chọn đáp án!" },
                      ]}
                      className="ftndTest-form-item"
                    >
                      <Radio.Group className="ftndTest-options">
                        <Radio value={3}>≤ 5 phút</Radio>
                        <Radio value={2}>6–30 phút</Radio>
                        <Radio value={1}>31–60 phút</Radio>
                        <Radio value={0}>&gt; 60 phút</Radio>
                      </Radio.Group>
                    </Form.Item>
                  </div>
                </div>

                <div className="row">
                  <div className="col-12">
                    <Form.Item
                      label={
                        <span className="ftndTest-question-label">
                          2. Có hút ở nơi bị cấm không?
                        </span>
                      }
                      name="q2"
                      rules={[
                        { required: true, message: "Vui lòng chọn đáp án!" },
                      ]}
                      className="ftndTest-form-item"
                    >
                      <Radio.Group className="ftndTest-options">
                        <Radio value={1}>Có</Radio>
                        <Radio value={0}>Không</Radio>
                      </Radio.Group>
                    </Form.Item>
                  </div>
                </div>

                <div className="row">
                  <div className="col-12">
                    <Form.Item
                      label={
                        <span className="ftndTest-question-label">
                          3. Điếu thuốc nào khó bỏ nhất? (điếu đầu tiên buổi
                          sáng)
                        </span>
                      }
                      name="q3"
                      rules={[
                        { required: true, message: "Vui lòng chọn đáp án!" },
                      ]}
                      className="ftndTest-form-item"
                    >
                      <Radio.Group className="ftndTest-options">
                        <Radio value={1}>Có</Radio>
                        <Radio value={0}>Không</Radio>
                      </Radio.Group>
                    </Form.Item>
                  </div>
                </div>

                <div className="row">
                  <div className="col-12">
                    <Form.Item
                      label={
                        <span className="ftndTest-question-label">
                          4. Số điếu thuốc hút mỗi ngày?
                        </span>
                      }
                      name="q4"
                      rules={[
                        { required: true, message: "Vui lòng chọn đáp án!" },
                      ]}
                      className="ftndTest-form-item"
                    >
                      <Radio.Group className="ftndTest-options">
                        <Radio value={3}>&ge; 31</Radio>
                        <Radio value={2}>21–30</Radio>
                        <Radio value={1}>11–20</Radio>
                        <Radio value={0}>&le; 10</Radio>
                      </Radio.Group>
                    </Form.Item>
                  </div>
                </div>

                <div className="row">
                  <div className="col-12">
                    <Form.Item
                      label={
                        <span className="ftndTest-question-label">
                          5. Có hút nhiều hơn vào buổi sáng không?
                        </span>
                      }
                      name="q5"
                      rules={[
                        { required: true, message: "Vui lòng chọn đáp án!" },
                      ]}
                      className="ftndTest-form-item"
                    >
                      <Radio.Group className="ftndTest-options">
                        <Radio value={1}>Có</Radio>
                        <Radio value={0}>Không</Radio>
                      </Radio.Group>
                    </Form.Item>
                  </div>
                </div>

                <div className="row">
                  <div className="col-12">
                    <Form.Item
                      label={
                        <span className="ftndTest-question-label">
                          6. Có hút khi bị bệnh nằm giường không?
                        </span>
                      }
                      name="q6"
                      rules={[
                        { required: true, message: "Vui lòng chọn đáp án!" },
                      ]}
                      className="ftndTest-form-item"
                    >
                      <Radio.Group className="ftndTest-options">
                        <Radio value={1}>Có</Radio>
                        <Radio value={0}>Không</Radio>
                      </Radio.Group>
                    </Form.Item>
                  </div>
                </div>

                <div className="row">
                  <div className="col-12">
                    <Form.Item className="ftndTest-form-item">
                      <div className="ftndTest-button-group d-flex justify-content-center gap-3 flex-wrap">
                        <Button
                          type="primary"
                          htmlType="submit"
                          className="ftndTest-submit-button"
                          loading={isLoading}
                          icon={
                            isLoading ? (
                              <LoadingOutlined />
                            ) : (
                              <CheckCircleOutlined />
                            )
                          }
                        >
                          {isLoading ? "Đang gửi..." : "Gửi đánh giá"}
                        </Button>
                        <Button
                          type="default"
                          onClick={() => navigate("/")}
                          className="ftndTest-cancel-button"
                          disabled={isLoading}
                        >
                          Hủy
                        </Button>
                      </div>
                    </Form.Item>
                  </div>
                </div>
              </Form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FTNDTest;
