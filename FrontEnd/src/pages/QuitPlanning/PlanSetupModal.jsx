// 📁 PlanSetupModal.jsx
import React, { useState, useEffect } from "react"; // 👈 THÊM useEffect
import { Modal, DatePicker, InputNumber, Button, message } from "antd";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const PlanSetupModal = ({ userId, onPlanReady }) => {
  const [startDate, setStartDate] = useState(null);
  const [months, setMonths] = useState(null);
  const [ftndLevel, setFtndLevel] = useState(null); //

  const navigate = useNavigate();

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
    if (!startDate || !months) return message.warning("Nhập đủ thông tin");

    try {
      await axios.post("http://localhost:5000/api/quitplan/save", {
        user_id: userId,
        start_date: startDate.format("YYYY-MM-DD"),
        quit_months: months,
      });
      message.success("Đã lưu kế hoạch thành công!");
      onPlanReady({ startDate, months });
    } catch (err) {
      console.error("Lỗi lưu kế hoạch:", err);
      message.error("Không thể lưu kế hoạch");
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
    <Modal
      open
      title="Thiết lập kế hoạch cai nghiện"
      footer={null}
      closable={false}
      centered
      width={440}
      styles={{ body: { padding: 32, borderRadius: 12 } }}
    >
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontWeight: 500, marginBottom: 6 }}>Ngày bắt đầu:</div>
        <DatePicker
          onChange={setStartDate}
          style={{ width: "100%" }}
          size="large"
          disabledDate={(current) =>
            current && current < new Date().setHours(0, 0, 0, 0)
          }
        />
      </div>
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontWeight: 500, marginBottom: 6 }}>Số tháng cai:</div>
        <InputNumber
          placeholder={getPlaceholderByFTND(ftndLevel)} //
          value={months}
          onChange={setMonths}
          style={{ width: "100%" }}
          size="large"
        />
      </div>
      <div
        style={{
          marginTop: 24,
          display: "flex",
          justifyContent: "center",
          gap: 16,
        }}
      >
        <Button
          type="primary"
          onClick={handleSubmit}
          disabled={!startDate}
          size="large"
          style={{ minWidth: 120, fontWeight: 600, borderRadius: 8 }}
        >
          Lưu kế hoạch
        </Button>
        <Button
          onClick={handleCancel}
          size="large"
          style={{ minWidth: 120, fontWeight: 600, borderRadius: 8 }}
        >
          Hủy
        </Button>
      </div>
    </Modal>
  );
};

export default PlanSetupModal;
