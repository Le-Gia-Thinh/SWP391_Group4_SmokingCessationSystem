import React, { useState, useEffect, useRef } from "react";

import {
  Button,
  Row,
  Col,
  Typography,
  Card,
  List,
  Space,
  Divider,
  Carousel,
  Badge,
  Layout,
  Tooltip,
} from "antd";
import {
  CheckOutlined,
  FacebookOutlined,
  InstagramOutlined,
  TwitterOutlined,
  YoutubeOutlined,
  MailOutlined,
  PinterestOutlined,
} from "@ant-design/icons";
import { GiLevelTwo, GiLevelThree, GiLevelFour } from "react-icons/gi";

import Navbar from "../../layouts/Navbar";
import PlanUpgradeModal from "./PlanUpgradeModal";
import BlogCarousel from "../../components/BlogCarousel";
import { useScrollReveal } from "../../hooks/useScrollReveal";
import meditationImg from "../../assets/meditation.jpg";
import healthyEatingImg from "../../assets/healthy-eating.jpg";
import fitnessImg from "../../assets/fitness.jpg";
import { useAuth } from '../../contexts/AuthContext';

import "./HomePage.css";

const { Title, Paragraph, Text } = Typography;
const { Footer } = Layout;

/* ===== DỮ LIỆU TĨNH ===== */
const plans = [
  { label: "Cơ bản", Icon: GiLevelTwo },
  { label: "Nâng cao", Icon: GiLevelThree },
  { label: "Hard core", Icon: GiLevelFour },
];

const benefits = [
  "Cải thiện sức khỏe thể chất",
  "Sức khỏe tinh thần tốt hơn",
  "Tăng tuổi thọ",
  "Quản lý cân nặng",
  "Tăng sự tự tin",
  "Giảm căng thẳng",
];

const lifestyleSteps = [
  {
    title: "1. Tìm động lực để bỏ thuốc",
    description:
      "Khám phá những lý do cá nhân quan trọng nhất đối với bạn — từ sức khỏe đến gia đình hoặc tài chính. Động lực của bạn sẽ hướng dẫn hành trình bỏ thuốc và sống khỏe mạnh.",
    image: meditationImg,
  },
  {
    title: "2. Bắt đầu kế hoạch bỏ thuốc cá nhân hóa",
    description:
      "Tạo hoặc làm theo Kế hoạch Bỏ thuốc 7-30 ngày được điều chỉnh theo lối sống của bạn. Đặt ngày bỏ thuốc, xác định các yếu tố kích thích và nhận hướng dẫn hàng ngày để xây dựng thói quen không hút thuốc.",
    image: healthyEatingImg,
  },
  {
    title: "3. Theo dõi tiến độ không hút thuốc",
    description:
      "Theo dõi những ngày không hút thuốc, tiền tiết kiệm được và những cải thiện về sức khỏe. Sử dụng các công cụ theo dõi của chúng tôi để theo dõi thành tích và duy trì động lực.",
    image: fitnessImg,
  },
  {
    title: "4. Xây dựng hành trình bỏ thuốc của riêng bạn",
    description:
      "Tùy chỉnh hành trình bằng cách lưu những lời khuyên, hoạt động, thành tích và phần thưởng yêu thích. Mỗi bước đưa bạn đến gần hơn với cuộc sống khỏe mạnh.",
    image: meditationImg,
  },
];

const categoryFeatures = [
  "Theo dõi chế độ ăn",
  "Lời khuyên dinh dưỡng tốt nhất",
  "Cổng thông tin tập thể dục",
  "Lập kế hoạch bữa ăn",
  "Cơ sở dữ liệu công thức nấu ăn",
  "Một điểm dừng cho dinh dưỡng",
  "Cộng đồng",
];

const expertQualifications = [
  "Chuyên gia dinh dưỡng đã đăng ký với Viện Dinh dưỡng và Chế độ ăn",
  "Hơn 5 năm kinh nghiệm trong lĩnh vực",
  "Chuyên về quản lý cân nặng, phòng ngừa bệnh mãn tính và dinh dưỡng thể thao",
  "Thành thạo trong việc phát triển công thức và kế hoạch bữa ăn",
  "Đam mê giúp mọi người sống khỏe mạnh, trọn vẹn",
  "Cam kết cập nhật những nghiên cứu và xu hướng mới nhất trong dinh dưỡng",
];

const startFeatures = [
  "Tạo tài khoản nhanh chóng",
  "Không cam kết — hủy bất cứ lúc nào",
  "Tham gia cùng hơn 45 triệu người dùng khác",
];

const footerLinks = [
  "Về chúng tôi",
  "Tính năng",
  "Blog",
  "Thực phẩm",
  "Công thức",
  "Đánh giá",
  "Đăng nhập",
];

const legalLinks = [
  "Điều khoản & Điều kiện",
  "Chính sách bảo mật",
  "Liên hệ",
  "Chính sách cookie",
  "Hỗ trợ",
];
const videoModules = import.meta.glob('/src/assets/video/*.mp4', {
  eager: true,
  as: 'url'
});
const videoList = Object.values(videoModules);

/* ===== TRANG CHÍNH ===== */
const HomePage = () => {
  const { user } = useAuth();
  const [showUpgrade, setShowUpgrade] = useState(false);
  const timerRef = useRef(null);
  const homepageRef = useRef(null);

  useEffect(() => {
    timerRef.current = setTimeout(() => setShowUpgrade(true), 2000);
    return () => clearTimeout(timerRef.current);
  }, []);

  useScrollReveal();
  const isMember = user && user.role === 'member';
  return (
    <Layout className="homepage" ref={homepageRef}>
      <Navbar />
      {showUpgrade && isMember && (
        <PlanUpgradeModal
          open={showUpgrade}
          onClose={() => setShowUpgrade(false)}
          scrollContainer={homepageRef}
        />
      )}

      {/* ---------- HERO ---------- */}
      <section className="hero-section scroll-section">
        <Row align="middle" style={{ minHeight: "500px" }}>
          <Col xs={24} lg={12} className="hero-content">
            <Space direction="vertical" size="large">
              <div>
                <Title level={1} className="hero-title">
                  <span className="highlight">Sống khỏe</span> mạnh
                </Title>
                <Title level={2} className="hero-slogan">
                  thật dễ dàng!!
                </Title>
                <Paragraph className="hero-subtext">
                  Nhận kế hoạch tùy chỉnh &<br />
                  hướng dẫn một-một từ chuyên gia của chúng tôi
                </Paragraph>
              </div>
              <Space direction="vertical" size="small">
                <Button type="primary" size="large" className="hero-btn">
                  Đăng nhập
                </Button>
                <Text type="secondary">Đăng nhập và bắt đầu ngay hôm nay</Text>
              </Space>
            </Space>
          </Col>

          <Col xs={24} lg={12} className="hero-video">
            <video width="100%" height="auto" controls autoPlay muted loop>
              <source src={videoList[0]} type="video/mp4" />
            </video>
          </Col>
        </Row>
      </section>

      {/* ---------- BENEFITS ---------- */}
      <section className="benefits-section scroll-section " data-reveal="left">
        <div className="container">
          <Row gutter={[48, 32]} align="middle">
            <Col xs={24} lg={10}>
              <Title level={2}>Tại sao bỏ thuốc</Title>
              <List
                dataSource={benefits}
                renderItem={(item) => (
                  <List.Item>
                    <Space>
                      <CheckOutlined className="check-icon" />
                      <Text>{item}</Text>
                    </Space>
                  </List.Item>
                )}
              />
            </Col>

            <Col xs={24} lg={14}>
              <Row gutter={[16, 16]}>
                <Col span={10}>
                  <img
                    src={meditationImg}
                    alt="Meditation"
                    className="benefit-img"
                  />
                </Col>
                <Col span={14}>
                  <img
                    src={healthyEatingImg}
                    alt="Healthy Eating"
                    className="benefit-img tall"
                  />
                </Col>
                <Col span={24}>
                  <img
                    src={fitnessImg}
                    alt="Fitness"
                    className="benefit-img wide"
                  />
                </Col>
              </Row>
            </Col>
          </Row>
        </div>
      </section>

      {/* ---------- PLANS ---------- */}
      <section className="plans-section scroll-section" data-reveal="right">
        <div className="container">
          <Space
            direction="vertical"
            size="large"
            style={{ width: "100%", textAlign: "center" }}
          >
            <Title level={2} className="plans-title">
              Chúng tôi có kế hoạch cho
            </Title>
            <Paragraph>
              Xây dựng thói quen khỏe mạnh với các bài học cá nhân hóa
            </Paragraph>
            <Divider />
            <Row gutter={[32, 32]} justify="space-around">
              {plans.map(({ label }, i) => (
                <Col key={i}>
                  <Space direction="vertical" align="center">
                    <Text strong>{label}</Text>
                  </Space>
                </Col>
              ))}
            </Row>
          </Space>
        </div>
      </section>

      {/* ---------- LIFESTYLE STEPS ---------- */}
      <section className="lifestyle-section scroll-section" data-reveal="up">
        <div className="container">
          <Title level={2} style={{ textAlign: "center", marginBottom: 48 }}>
            Có cuộc sống không khói thuốc với HealthyBite
          </Title>

          <Row gutter={[32, 48]}>
            {lifestyleSteps.map((step, i) => (
              <Col xs={24} lg={12} key={i}>
                <Card className="lifestyle-card" bodyStyle={{ padding: 0 }}>
                  <Row>
                    <Col span={8}>
                      <img
                        src={step.image}
                        alt={step.title}
                        className="lifestyle-img"
                      />
                    </Col>
                    <Col span={16} className="lifestyle-content">
                      <Title level={4}>{step.title}</Title>
                      <Paragraph>{step.description}</Paragraph>
                    </Col>
                  </Row>
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      </section>

      {/* ---------- CTA ---------- */}
      <section className="cta-section scroll-section split" data-reveal="split">
        <div className="container">
          <Card className="cta-card">
            <Row justify="space-between" align="middle">
              {/* Left half */}
              <Col xs={24} lg={14} className="split-left">
                <Title level={3}>Sẵn sàng lập kế hoạch bỏ thuốc?</Title>
                <Paragraph>
                  Đăng nhập hôm nay và bắt đầu kế hoạch bỏ thuốc cá nhân hóa với
                  HealthyBite.
                </Paragraph>
              </Col>
              {/* Right half */}
              <Col xs={24} lg={10} className="split-right">
                <Button type="primary" size="large">
                  Đăng nhập hôm nay
                </Button>
              </Col>
            </Row>
          </Card>
        </div>
      </section>

      {/* ---------- CATEGORY ---------- */}
      <section className="category-section scroll-section" data-reveal="up">
        <div className="container">
          <Row gutter={[48, 32]} align="middle">
            <Col xs={24} lg={12}>
              <Space direction="vertical" size="large">
                <Title level={2}>
                  <span className="highlight">Phổi khỏe</span> là gì đối với
                  bạn?
                </Title>
                <img
                  src={meditationImg}
                  alt="Benefits"
                  className="category-img"
                />
              </Space>
            </Col>

            <Col xs={24} lg={12}>
              <List
                dataSource={categoryFeatures}
                renderItem={(item) => (
                  <List.Item>
                    <Space>
                      <CheckOutlined className="check-icon" />
                      <Text>{item}</Text>
                    </Space>
                  </List.Item>
                )}
              />
            </Col>
          </Row>
        </div>
      </section>

      {/* ---------- REGISTER (CAROUSEL) ---------- */}
      <section className="register-section scroll-section">
        <div className="container">
          <Title level={2} style={{ textAlign: "center", marginBottom: 32 }}>
            Đăng ký khóa học
          </Title>
          <Carousel
            autoplay
            autoplaySpeed={4000}
            className="registration-carousel"
          >
            {[meditationImg, healthyEatingImg, fitnessImg].map((img, i) => (
              <div key={i}>
                <img
                  src={img}
                  alt={`Slide ${i + 1}`}
                  className="carousel-img"
                />
              </div>
            ))}
          </Carousel>
        </div>
      </section>

      {/* ---------- PROFILE ---------- */}
      <section className="profile-section scroll-section" data-reveal="up">
        <div className="container">
          <div className="profile-header">
            <Badge.Ribbon text="Nhận điều tốt nhất" color="green">
              <Card className="profile-info-card">
                <Title level={2} style={{ margin: 0, color: "white" }}>
                  Hồ sơ chuyên gia
                </Title>
              </Card>
            </Badge.Ribbon>
          </div>

          <Row gutter={[48, 32]} align="top">
            <Col xs={24} lg={14}>
              <Space direction="vertical" size="large">
                <Paragraph>
                  Đội ngũ chuyên gia dinh dưỡng của chúng tôi ở đây để giúp bạn đạt được
                  mục tiêu sức khỏe và thể chất. Các chuyên gia dinh dưỡng của chúng tôi là những
                  chuyên gia được đào tạo cao và có trình độ với sự hiểu biết sâu sắc
                  về khoa học đằng sau dinh dưỡng và cách nó có thể tác động đến
                  cơ thể và tâm trí của bạn.
                </Paragraph>
                <List
                  dataSource={expertQualifications}
                  renderItem={(item) => (
                    <List.Item>
                      <Space>
                        <CheckOutlined className="check-icon" />
                        <Text>{item}</Text>
                      </Space>
                    </List.Item>
                  )}
                />
              </Space>
            </Col>

            <Col xs={24} lg={10}>
              <Carousel autoplay className="profile-carousel scroll-section">
                {[meditationImg, healthyEatingImg, fitnessImg].map((img, i) => (
                  <div key={i}>
                    <img
                      src={img}
                      alt={`Expert ${i + 1}`}
                      className="carousel-img"
                    />
                  </div>
                ))}
              </Carousel>
            </Col>
          </Row>
        </div>
      </section>

      {/* ---------- BLOG / NEWS ---------- */}
      <BlogCarousel />

      {/* ---------- START TODAY ---------- */}
      <section className="start-section scroll-section " data-reveal="right">
        <div className="container">
          <Space
            direction="vertical"
            size="large"
            style={{ width: "100%", textAlign: "center" }}
          >
            <Button type="primary" size="large">
              Start today
            </Button>
            <Row gutter={[32, 16]} justify="center">
              {startFeatures.map((feat, i) => (
                <Col key={i}>
                  <Space>
                    <CheckOutlined className="check-icon" />
                    <Text>{feat}</Text>
                  </Space>
                </Col>
              ))}
            </Row>
          </Space>
        </div>
      </section>

      {/* ---------- RESULTS ---------- */}
      <section className="results-section scroll-section" data-reveal="up">
        <div className="container">
          <Title level={2}>vd cai nghiên thành công</Title>
          <Card className="testimonial-card">
            <Row gutter={[32, 32]} align="middle">
              <Col xs={24} lg={14}>
                <Space direction="vertical" size="middle">
                  <Title level={3}>10 kgs in 3 weeks</Title>
                  <Paragraph>
                    This platform is like the best thing that has happened to my
                    health. I was shocked how my cravings were gone after only a
                    couple of days and not wanting to eat between meals really
                    helped. Losing 6 kg in only 3 weeks is fantastic, but the
                    best part is the health improvement.
                  </Paragraph>
                  <div>
                    <Text strong>Anshuman Khuranna</Text>
                    <br />
                    <Text type="secondary">3 week weight loss meal plan</Text>
                  </div>
                </Space>
              </Col>
              <Col xs={24} lg={10}>
                <img
                  src={fitnessImg}
                  alt="Anshuman Khuranna"
                  className="testimonial-img"
                />
              </Col>
            </Row>
          </Card>
        </div>
      </section>

      {/* ---------- PRICING BANNER ---------- */}
      <section className="pricing-section scroll-section" data-reveal="left">
        <div className="container">
          <Title level={3} style={{ textAlign: "center" }}>
            A whole year of <strong>HEALTHYBITE</strong> costs about the same as
            1 hour with a nutrition expert
          </Title>
        </div>
      </section>

      {/* ---------- FOOTER ---------- */}
      <Footer className="footer-section scroll-section">
        <div className="container">
          <Space
            direction="vertical"
            size="middle"
            style={{ width: "100%", textAlign: "center" }}
          >
            <img
              src={healthyEatingImg}
              alt="HealthyBite logo"
              className="footer-logo"
              style={{ height: 48, borderRadius: 12, marginBottom: 8 }}
            />

            <Space wrap size="middle" className="footer-links">
              {footerLinks.map((link, i) => (
                <Button
                  key={i}
                  type="link"
                  style={{ fontSize: 16, fontWeight: 500, color: "#222" }}
                >
                  {link}
                </Button>
              ))}
            </Space>

            <Space wrap size="small" className="footer-legal">
              {legalLinks.map((text, i) => (
                <Button
                  key={i}
                  type="link"
                  size="small"
                  style={{ fontSize: 14, color: "#666" }}
                >
                  {text}
                </Button>
              ))}
            </Space>

            <Space size="middle">
              <Tooltip title="Facebook">
                <Button
                  type="text"
                  shape="circle"
                  icon={
                    <FacebookOutlined
                      style={{ color: "#4267B2", fontSize: 24 }}
                    />
                  }
                  className="social-btn"
                />
              </Tooltip>
              <Tooltip title="Instagram">
                <Button
                  type="text"
                  shape="circle"
                  icon={
                    <InstagramOutlined
                      style={{ color: "#E1306C", fontSize: 24 }}
                    />
                  }
                  className="social-btn"
                />
              </Tooltip>
              <Tooltip title="Twitter">
                <Button
                  type="text"
                  shape="circle"
                  icon={
                    <TwitterOutlined
                      style={{ color: "#1DA1F2", fontSize: 24 }}
                    />
                  }
                  className="social-btn"
                />
              </Tooltip>
              <Tooltip title="Pinterest">
                <Button
                  type="text"
                  shape="circle"
                  icon={
                    <PinterestOutlined
                      style={{ color: "#E60023", fontSize: 24 }}
                    />
                  }
                  className="social-btn"
                />
              </Tooltip>
              <Tooltip title="YouTube">
                <Button
                  type="text"
                  shape="circle"
                  icon={
                    <YoutubeOutlined
                      style={{ color: "#FF0000", fontSize: 24 }}
                    />
                  }
                  className="social-btn"
                />
              </Tooltip>
              <Tooltip title="Email">
                <Button
                  type="text"
                  shape="circle"
                  icon={
                    <MailOutlined style={{ color: "#38f9d7", fontSize: 24 }} />
                  }
                  className="social-btn"
                />
              </Tooltip>
            </Space>

            <div
              className="footer-copyright"
              style={{ color: "#666", fontSize: 14 }}
            >
              &copy; {new Date().getFullYear()}{" "}
              <span style={{ color: "#38cfcf", fontWeight: 600 }}>
                HealthyBite
              </span>
              . All rights reserved.
            </div>
          </Space>
        </div>
      </Footer>
    </Layout>
  );
};

export default HomePage;
