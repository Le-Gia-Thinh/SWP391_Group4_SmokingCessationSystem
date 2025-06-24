// src/pages/HomePage.jsx
import React, { useEffect } from "react";

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
  Avatar,
  Tooltip,
} from "antd";
import {
  CheckOutlined,
  RightOutlined,
  FacebookOutlined,
  InstagramOutlined,
  TwitterOutlined,
  YoutubeOutlined,
  MailOutlined,
  PinterestOutlined,
} from "@ant-design/icons";
import { GiLevelTwo, GiLevelThree, GiLevelFour } from "react-icons/gi";
import Navbar from "../../layouts/Navbar";
import meditationImg from "../../assets/meditation.jpg";
import healthyEatingImg from "../../assets/healthy-eating.jpg";
import fitnessImg from "../../assets/fitness.jpg";
import "./HomePage.css";
import BlogCarousel from "../../components/BlogCarousel";

const { Title, Paragraph, Text } = Typography;
const { Content, Footer } = Layout;

const plans = [
  { label: "Cơ bản", Icon: GiLevelTwo },
  { label: "Nâng cao", Icon: GiLevelThree },
  { label: "Hard core", Icon: GiLevelFour },
];

const benefits = [
  "Improved physical health",
  "Better mental health",
  "Increased longevity",
  "Weight management",
  "Improved self-confidence",
  "Reduced stress",
];

const lifestyleSteps = [
  {
    title: "1. Find your motivation to quit",
    description:
      "Discover the personal reasons that matter most to you — from health to family or finance. Your motivation will guide your journey to quit smoking and stay healthy.",
    image: meditationImg,
  },
  {
    title: "2. Start a personalized quit plan",
    description:
      "Create or follow a 7–30 day Quit Plan tailored to your lifestyle. Set a quit date, outline triggers, and get daily guidance to build smoke-free habits.",
    image: healthyEatingImg,
  },
  {
    title: "3. Track your smoke-free progress",
    description:
      "Monitor your smoke-free days, money saved, and health gains. Use our tracking tools to stay on top of your achievements and stay motivated.",
    image: fitnessImg,
  },
  {
    title: "4. Build your own quit journey",
    description:
      "Customize your journey by saving your favorite tips, activities, achievements, and rewards. Every step brings you closer to a healthier life.",
    image: meditationImg,
  },
];

const categoryFeatures = [
  "Diet tracker",
  "Best nutrition advice",
  "Exercise portal",
  "Meal planner",
  "Recipes database",
  "One stop shop for nutrition",
  "Community",
];

const expertQualifications = [
  "Registered Dietitian with the Academy of Nutrition and Dietetics",
  "5+ years of experience in the field",
  "Specialize in weight management, chronic disease prevention, and sports nutrition",
  "Skilled in developing recipes and meal plans",
  "Passionate about helping people live healthy, fulfilling lives",
  "Committed to staying up-to-date with the latest research and trends in nutrition",
];

const startFeatures = [
  "Quick account creation",
  "No commitment — cancel at any time",
  "Join over 45 million other users",
];

const footerLinks = [
  "About us",
  "Features",
  "Blogs",
  "Food",
  "Recipes",
  "Reviews",
  "Sign in",
];
const legalLinks = [
  "Terms & Conditions",
  "Privacy policy",
  "Contact",
  "Cookie policy",
  "Support",
];

const HomePage = () => {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    if (token) {
      localStorage.setItem("token", token);
      window.history.replaceState(null, "", "/home");
    }
  }, []);

  return (
    <Layout className="homepage">
      <Navbar />

      {/* Hero Section */}
      <section className="hero-section">
        <Row align="middle" style={{ minHeight: "500px" }}>
          <Col xs={24} lg={12} className="hero-content">
            <Space direction="vertical" size="large">
              <div>
                <Title level={1} className="hero-title">
                  <span className="highlight">Healthy</span> living
                </Title>
                <Title level={2} className="hero-slogan">
                  made easy!!
                </Title>
                <Paragraph className="hero-subtext">
                  Get your custom plans &<br />
                  one-on-one guidance from our experts
                </Paragraph>
              </div>
              <Space direction="vertical" size="small">
                <Button type="primary" size="large" className="hero-btn">
                  Sign in
                </Button>
                <Text type="secondary">Sign in & get started today</Text>
              </Space>
            </Space>
          </Col>
          <Col xs={24} lg={12} className="hero-video">
          <div className="video-wrapper">
            <iframe
              width="100%"
              height="315"
              src="https://www.youtube.com/embed/MCNS4lhTZy0"
              title="Video tuyên truyền tác hại thuốc lá"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          </div>
        </Col>
        </Row>
      </section>

      {/* Benefits Section */}
      <section className="benefits-section">
        <div className="container">
          <Row gutter={[48, 32]} align="middle">
            <Col xs={24} lg={10}>
              <Title level={2}>Why cai nghiện</Title>
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

      {/* Plans Section */}
      <section className="plans-section">
        <div className="container">
          <Space
            direction="vertical"
            size="large"
            style={{ width: "100%", textAlign: "center" }}
          >
            <Title level={2} className="plans-title">
              We have plans for
            </Title>
            <Paragraph>
              Build healthier habits with personalized lessons
            </Paragraph>
            <Divider />
            <Row gutter={[32, 32]} justify="space-around">
              {plans.map(({ label }, i) => (
                <Col key={i}>
                  <Space direction="vertical" align="center">
                    {/* <Avatar size={64} icon={<Icon />} className="plan-avatar" /> */}
                    <Text strong>{label}</Text>
                  </Space>
                </Col>
              ))}
            </Row>
          </Space>
        </div>
      </section>

      {/* Lifestyle Section */}
      <section className="lifestyle-section">
        <div className="container">
          <Title level={2} style={{ textAlign: "center", marginBottom: 48 }}>
            Have a Smoke-Free Life with HealthyBite
          </Title>
          <Row gutter={[32, 48]}>
            {lifestyleSteps.map((step, i) => (
              <Col xs={24} lg={12} key={i}>
                <Card
                  className="lifestyle-card"
                  styles={{ body: { padding: 0 } }}
                >
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

      {/* CTA Section */}
      <section className="cta-section">
        <div className="container">
          <Card className="cta-card">
            <Row justify="space-between" align="middle">
              <Col>
                <Title level={3}>Ready to plan your quit journey?</Title>
                <Paragraph>
                  Sign in today and start your personalized quit plan with
                  HealthyBite.
                </Paragraph>
              </Col>
              <Col>
                <Button type="primary" size="large">
                  Sign in today
                </Button>
              </Col>
            </Row>
          </Card>
        </div>
      </section>

      {/* Category Section */}
      <section className="category-section">
        <div className="container">
          <Row gutter={[48, 32]} align="middle">
            <Col xs={24} lg={12}>
              <Space direction="vertical" size="large">
                <Title level={2}>
                  What is a <span className="highlight">phoi khoe</span> for
                  you?
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

      {/* Registration Carousel Section */}
      <section className="register-section">
        <div className="container">
          <Title level={2} style={{ textAlign: "center", marginBottom: 32 }}>
            dang ky khoa 2
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

      {/* Profile Section */}
      <section className="profile-section">
        <div className="container">
          <div className="profile-header">
            <Badge.Ribbon text="Get the best" color="green">
              <Card className="profile-info-card">
                <Title level={2} style={{ margin: 0, color: "white" }}>
                  profile 3
                </Title>
              </Card>
            </Badge.Ribbon>
          </div>

          <Row gutter={[48, 32]} align="top">
            <Col xs={24} lg={14}>
              <Space direction="vertical" size="large">
                <Paragraph>
                  Our team of expert nutritionists is here to help you achieve
                  your health and wellness goals. Our nutritionists are highly
                  trained and qualified professionals with a deep understanding
                  of the science behind nutrition and how it can impact your
                  body and mind.
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
              <Carousel autoplay className="profile-carousel">
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

      <BlogCarousel />

      {/* Start Today Section */}
      <section className="start-section">
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

      {/* Results Section */}
      <section className="results-section">
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

      {/* Pricing Section */}
      <section className="pricing-section">
        <div className="container">
          <Title level={3} style={{ textAlign: "center" }}>
            A whole year of <strong>HEALTHYBITE</strong> costs about the same as
            1 hour with a nutrition expert
          </Title>
        </div>
      </section>

      {/* Footer */}
      <Footer className="footer-section">
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
