import React, { useState, useRef, useEffect } from "react";
import { Form, Input, Button, Typography, Divider } from "antd";
import {
  MailOutlined,
  PushpinOutlined,
  PushpinFilled,
} from "@ant-design/icons";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import "./Login.css";

const { Text } = Typography;

/* ------- import 5 ảnh ------- */
import dangerSmoke from "../../assets/img/danger_smoke.png";
import crushCigarette from "../../assets/img/crush_cigarette.png";
import stopOffer from "../../assets/img/stop_offer.png";
import victoryPeak from "../../assets/img/victory_peak.png";
import healthyLungs from "../../assets/img/healthy_lungs.png";

/* ================= VIDEO SCENES ================= */
const ScenesVideo = () => {
  const slides = [
    {
      img: dangerSmoke,
      grad: "linear-gradient(45deg,#ff6b6b,#ee5a24)",
      icon: "🚬",
      title: "THUỐC LÁ",
      desc: "Gây ung thư, bệnh tim, tổn hại phổi",
    },
    {
      img: crushCigarette,
      grad: "linear-gradient(45deg,#feca57,#ff9ff3)",
      icon: "💪",
      title: "QUYẾT ĐỊNH",
      desc: "Thay đổi cuộc sống từ hôm nay",
    },
    {
      img: stopOffer,
      grad: "linear-gradient(45deg,#48cae4,#023e8a)",
      icon: "✋",
      title: "HÀNH ĐỘNG",
      desc: "Nói KHÔNG với thuốc lá",
    },
    {
      img: victoryPeak,
      grad: "linear-gradient(45deg,#06ffa5,#00d4aa)",
      icon: "🎉",
      title: "THÀNH CÔNG",
      desc: "Sức khỏe tốt hơn, tiền tiết kiệm",
    },
    {
      img: healthyLungs,
      grad: "linear-gradient(45deg,#667eea,#764ba2)",
      icon: "🌟",
      title: "ĐỘNG LỰC",
      desc: "Bạn có thể làm được!",
      sub: "Mỗi ngày không hút thuốc là một chiến thắng.\nSức khỏe, gia đình và tương lai đang chờ bạn!",
    },
  ];

  const [idx, setIdx] = useState(0);
  const [t, setT] = useState(15);

  useEffect(() => {
    const tick = setInterval(() => setT((s) => (s <= 1 ? 15 : s - 1)), 1000);
    const swap = setInterval(
      () => setIdx((i) => (i + 1) % slides.length),
      3000
    );
    return () => {
      clearInterval(tick);
      clearInterval(swap);
    };
  }, []);

  /* (tuỳ chọn) đổi gradient ngoài card */
  useEffect(() => {
    document.documentElement.style.setProperty("--hero-grad", slides[idx].grad);
  }, [idx]);

  return (
    <div className="video-container">
      <div
        className="progress-bar"
        style={{ width: `${((15 - t) / 15) * 100}%` }}
      />

      {slides.map((s, i) => (
        <div
          key={i}
          className={`scene ${i === idx ? "active" : i < idx ? "prev" : ""}`}
          style={{ backgroundImage: s.grad }}
        >
          <img src={s.img} alt={s.title} className="scene-img" />
          <div className="scene-icon">{s.icon}</div>
          <h1>{s.title}</h1>
          <p>{s.desc}</p>
          {s.sub && <p style={{ whiteSpace: "pre-line" }}>{s.sub}</p>}
        </div>
      ))}
    </div>
  );
};

/* ================= LOGIN PAGE (giữ nguyên form) ================= */
const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const leaveTimerRef = useRef(null);

  const onFinish = async (values) => {
    setLoading(true);
    setErrorMessage("");
    try {
      const user = await login(values.email, values.password);

      // Đảm bảo context được cập nhật trước khi navigate
      setTimeout(() => {
        if (user.user_role === "admin") navigate("/admin");
        else if (user.user_role === "coach") navigate("/coach-dashboard");
        else navigate("/");
      }, 100);
    } catch {
      setErrorMessage("Sai email hoặc mật khẩu");
    } finally {
      setLoading(false);
    }
  };

  const handleMouseEnter = () => {
    clearTimeout(leaveTimerRef.current);
    setOpen(true);
  };
  const handleMouseLeave = () => {
    if (pinned) return;
    leaveTimerRef.current = setTimeout(() => setOpen(false), 5000);
  };
  useEffect(() => () => clearTimeout(leaveTimerRef.current), []);

  return (
    <section className="login-page">
      <div className="login-card">
        {/* panel trái */}
        <div className="card-panel hero">
          <ScenesVideo />
        </div>

        {/* panel phải */}
        <div className="card-panel form-side">
          <div
            className={`outer-box${open || pinned ? " open" : ""}`}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <span
              className="pin-icon"
              onClick={() => {
                setPinned((p) => !p);
                if (!pinned) clearTimeout(leaveTimerRef.current);
              }}
            >
              {pinned ? <PushpinFilled /> : <PushpinOutlined />}
            </span>

            <span className="line top" />
            <span className="line right" />
            <span className="line bottom" />
            <span className="line left" />

            <div className="login-container">
              <div className="login-title">🚭 Đăng nhập</div>

              <div className="form-content">
                <Form layout="vertical" onFinish={onFinish}>
                  <Form.Item
                    name="email"
                    label="Email"
                    rules={[
                      {
                        required: true,
                        message: "Vui lòng nhập email của bạn!",
                      },
                    ]}
                  >
                    <Input
                      placeholder="abc@gmail.com"
                      suffix={<MailOutlined />}
                    />
                  </Form.Item>

                  <Form.Item
                    name="password"
                    label="Mật khẩu"
                    rules={[
                      {
                        required: true,
                        message: "Vui lòng nhập mật khẩu của bạn!",
                      },
                    ]}
                  >
                    <Input.Password placeholder="•••••••" />
                  </Form.Item>

                  {errorMessage && (
                    <Text
                      type="danger"
                      style={{ display: "block", marginBottom: 16 }}
                    >
                      {errorMessage}
                    </Text>
                  )}

                  <div className="forgot-password">
                    <RouterLink to="/ForgetPassword">Quên mật khẩu?</RouterLink>
                  </div>

                  <Form.Item>
                    <Button
                      type="primary"
                      htmlType="submit"
                      block
                      className="login-button"
                      loading={loading}
                    >
                      Đăng nhập
                    </Button>
                  </Form.Item>

                  <Divider>hoặc tiếp tục với</Divider>

                  <Button
                    icon={
                      <img
                        src="https://developers.google.com/identity/images/g-logo.png"
                        alt="google"
                        className="google-icon"
                      />
                    }
                    block
                    className="google-button"
                    onClick={() =>
                      (window.location.href =
                        "http://localhost:5000/api/auth/google")
                    }
                  >
                    Google
                  </Button>

                  <div className="signup-text">
                    <Text>
                      Chưa có tài khoản?{" "}
                      <RouterLink to="/register">Đăng ký</RouterLink>
                    </Text>
                  </div>
                </Form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Login;
