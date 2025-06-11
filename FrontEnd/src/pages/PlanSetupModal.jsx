// 📁 PlanSetupModal.jsx
import React, { useState } from "react";
import { Modal, DatePicker, InputNumber, Button, message } from "antd";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const PlanSetupModal = ({ userId, onPlanReady, onCancel }) => {
  const [startDate, setStartDate] = useState(null);
  const [months, setMonths] = useState(1);
  const navigate = useNavigate();

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
      navigate(-1); // Quay lại trang trước
    } else {
      navigate("/"); // Nếu không có trang trước thì về Home
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
      bodyStyle={{ padding: 32, borderRadius: 12 }}
    >
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontWeight: 500, marginBottom: 6 }}>Ngày bắt đầu:</div>
        <DatePicker
          onChange={setStartDate}
          style={{ width: "100%" }}
          size="large"
        />
      </div>
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontWeight: 500, marginBottom: 6 }}>Số tháng cai:</div>
        <InputNumber
          min={1}
          max={12}
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
