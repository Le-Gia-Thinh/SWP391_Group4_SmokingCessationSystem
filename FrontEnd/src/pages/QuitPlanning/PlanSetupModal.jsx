// 📁 PlanSetupModal.jsx
import React, { useState, useEffect } from "react";
import {
  Modal,
  DatePicker,
  InputNumber,
  Button,
  message,
  Typography,
  Card,
  Row,
  Col,
  Tooltip,
} from "antd";
import {
  CalendarOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./PlanSetupModal.css";
import "bootstrap/dist/css/bootstrap.min.css";

const { Title, Text } = Typography;

const PlanSetupModal = ({ userId, onPlanReady }) => {
  const [startDate, setStartDate] = useState(null);
  const [months, setMonths] = useState(null);
  const [ftndLevel, setFtndLevel] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();

  // Lock body scroll khi modal mở
  useEffect(() => {
    document.body.classList.add("modal-open");
    return () => {
      document.body.classList.remove("modal-open");
    };
  }, []);

  // 👇 THÊM: Gọi API lấy mức độ nghiện khi mở modal
  useEffect(() => {
    const fetchFTNDLevel = async () => {
      try {
        const res = await axios.get(
          `http://localhost:5000/api/ftnd/getFtndLevel/${userId}`
        );
        if (res.data.ftnd_level) {
          setFtndLevel(res.data.ftnd_level);
        } else {
          // Chưa có FTND test -> redirect đến FTND test
          navigate("/FtndTest");
        }
      } catch (err) {
        console.error("Lỗi lấy FTND level:", err);
        // Nếu có lỗi API -> cũng redirect đến FTND test
        navigate("/FtndTest");
      }
    };

    if (userId) fetchFTNDLevel();
  }, [userId, navigate]);

  // 👇 THÊM: Hàm gợi ý placeholder theo mức độ nghiện
  const getPlaceholderByFTND = (ftndLevel) => {
    switch (ftndLevel) {
      case "Low":
        return "Gợi ý: 2–6 tháng";
      case "Medium":
        return "Gợi ý: 6–12 tháng";
      case "High":
        return "Gợi ý: 10–18 tháng";
      default:
        return "Nhập số tháng cai";
    }
  };

  const handleSubmit = async () => {
    if (!startDate || !months) {
      message.warning({
        content: "Vui lòng nhập đủ thông tin",
        icon: <InfoCircleOutlined style={{ color: "#faad14" }} />,
      });
      return;
    }

    setIsLoading(true);
    try {
      await axios.post("http://localhost:5000/api/quitplan/save", {
        user_id: userId,
        start_date: startDate.format("YYYY-MM-DD"),
        quit_months: months,
      });

      message.success({
        content: "Đã lưu kế hoạch thành công!",
        icon: <CheckCircleOutlined style={{ color: "#52c41a" }} />,
      });

      await new Promise((resolve) => setTimeout(resolve, 1000));
      onPlanReady({ startDate, months });
    } catch (err) {
      console.error("Lỗi lưu kế hoạch:", err);
      message.error("Không thể lưu kế hoạch");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    if (window.history.length > 2) {
      navigate(-1);
    } else {
      navigate("/");
    }
  };

  return (
    <div className="planSetupModal-wrapper">
      <div className="planSetupModal-container">
        <Title level={2} className="planSetupModal-title">
          Thiết lập kế hoạch cai nghiện
        </Title>

        <div className="planSetupModal-form-item">
          <label className="planSetupModal-label">
            <CalendarOutlined
              style={{ marginRight: "8px", color: "#52c41a" }}
            />
            Ngày bắt đầu:
          </label>
          <DatePicker
            onChange={setStartDate}
            className="planSetupModal-datepicker"
            size="large"
            placeholder="Chọn ngày bắt đầu cai nghiện"
            disabledDate={(current) =>
              current && current < new Date().setHours(0, 0, 0, 0)
            }
          />
        </div>

        <div className="planSetupModal-form-item">
          <label className="planSetupModal-label">
            <ClockCircleOutlined
              style={{ marginRight: "8px", color: "#52c41a" }}
            />
            Số tháng cai:
            <Tooltip
              title={`Dựa trên mức độ nghiện ${ftndLevel || "chưa xác định"}`}
            >
              <InfoCircleOutlined
                style={{
                  marginLeft: "4px",
                  color: "#1890ff",
                  fontSize: "12px",
                }}
              />
            </Tooltip>
          </label>
          <InputNumber
            placeholder={getPlaceholderByFTND(ftndLevel)}
            value={months}
            onChange={setMonths}
            className="planSetupModal-input"
            size="large"
            min={1}
            max={24}
          />
          {ftndLevel && (
            <div className="planSetupModal-suggestion-text">
              {getPlaceholderByFTND(ftndLevel)}
            </div>
          )}
        </div>

        <div className="planSetupModal-button-group d-flex justify-content-center gap-3 flex-wrap">
          <Button
            type="primary"
            onClick={handleSubmit}
            disabled={!startDate || !months}
            loading={isLoading}
            className="planSetupModal-submit-button"
            icon={<CheckCircleOutlined />}
          >
            {isLoading ? "Đang lưu..." : "Lưu kế hoạch"}
          </Button>
          <Button
            onClick={handleCancel}
            className="planSetupModal-cancel-button"
            disabled={isLoading}
          >
            Hủy
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PlanSetupModal;
