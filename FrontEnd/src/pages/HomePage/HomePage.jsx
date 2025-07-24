import React, { useState, useEffect, useRef } from "react";
import RoadmapCarousel from "./RoadmapCarousel";

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
  Avatar,
} from "antd";
import {
  CheckOutlined,
  FacebookOutlined,
  InstagramOutlined,
  TwitterOutlined,
  YoutubeOutlined,
  MailOutlined,
  PinterestOutlined,
  RightOutlined,
  LeftOutlined,

} from "@ant-design/icons";
import { GiLevelTwo, GiLevelThree, GiLevelFour } from "react-icons/gi";
import Navbar from "../../layouts/Navbar";
import { useNavigate } from "react-router-dom";
import PlanUpgradeModal from "./PlanUpgradeModal";
import { useScrollReveal } from "../../hooks/useScrollReveal";
import meditationImg from "../../assets/img/meditation.jpg";
import healthyEatingImg from "../../assets/img/healthy-eating.jpg";
import fitnessImg from "../../assets/img/fitness.jpg";
import { useAuth } from "../../contexts/AuthContext";
import bg2 from "../../assets/img/carousel-bg-2.jpg";
import car1 from "../../assets/img/carousel-1.jpeg";
import car2 from "../../assets/img/carousel-2.png";
import testi1 from "../../assets/img/carousel-bg-2.jpg";
import testi2 from "../../assets/img/carousel-bg-2.jpg";
import testi3 from "../../assets/img/carousel-bg-2.jpg";
import testi4 from "../../assets/img/carousel-bg-2.jpg";
/* ---------- ASSETS CHO 2 KHỐI MỚI ---------- */
import about1 from "../../assets/img/carousel-bg-2.jpg";
import about2 from "../../assets/img/carousel-bg-2.jpg";
import about3 from "../../assets/img/carousel-bg-2.jpg";
import bannerImg from "../../assets/img/banner.jpg";
import bannerImg1 from '../../assets/img/banner-1.jpg';
import bannerImg2 from '../../assets/img/banner-2.jpg';

import service1 from '../../assets/img/service-1.jpg';
import service2 from '../../assets/img/service-2.jpg';
import service3 from '../../assets/img/service-3.jpg';
import { Parallax } from 'react-parallax';
import { FaStar, FaUsers, FaCheck, FaMugHot } from "react-icons/fa";  // Đảm bảo thêm dòng này

import "animate.css/animate.min.css";
import AOS from 'aos';
import 'aos/dist/aos.css';
import CountUp from 'react-countup';
import iconService from "../../assets/img/service.png";
import iconProduct from "../../assets/img/product.png";
import icoExperience from "../../assets/img/experience.png";
import icoAward from "../../assets/img/award.png";
import icoAnimal from "../../assets/img/animal.png";
import icoClient from "../../assets/img/client.png";
import "./HomePage.css";
const { Title, Paragraph, Text } = Typography;
const { Footer } = Layout;



const videoModules = import.meta.glob("/src/assets/video/*.mp4", {
  eager: true,
  query: "?url",
  import: "default",
});
const videoList = Object.values(videoModules);

/* ========== ANIMATION CONFIG ========== */
// All hero‑caption animations share this slower duration

/* ========== ANIMATION CONFIG ========== */
const ANIM_DURATION = "2s"; // change here to slow‑down or speed‑up
const ANIMATE_STYLE = { "--animate-duration": ANIM_DURATION };
const getAnimCls = (name) => `animate__animated animate__${name}`;

/* ===== CAROUSEL DATA ===== */
const heroSlides = [
  {
    isVideo: true,
    video: videoList[0], // nền video toàn màn cho slide 1
    tag: "// Car Servicing //",
    title: "Qualified Car Repair Service Center",
    img: car1,
  },
  {
    isVideo: false,
    bg: bg2,
    tag: "// Car Servicing //",
    title: "Qualified Car Wash Service Center",
    img: car2,
  },
];


/* ===== DỮ LIỆU TĨNH ===== */
const roadmapItems = [
  { title: "January 2045", desc: "Diam dolor ipsum sit amet erat ipsum lorem sit" },
  { title: "March 2045", desc: "Diam dolor ipsum sit amet erat ipsum lorem sit" },
  { title: "May 2045", desc: "Diam dolor ipsum sit amet erat ipsum lorem sit" },
  { title: "July 2045", desc: "Diam dolor ipsum sit amet erat ipsum lorem sit" },
  { title: "September 2045", desc: "Diam dolor ipsum sit amet erat ipsum lorem sit" },
  { title: "November 2045", desc: "Diam dolor ipsum sit amet erat ipsum lorem sit" },
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
const testimonials = [
  {
    date: "20 May",
    img: testi1,
    name: "Client Name",
    job: "Profession",
    text: "Tempor erat elitr rebum at clita. Diam dolor diam ipsum sit diam amet diam et eos. Clita erat ipsum et lorem et sit.",
  },
  {
    date: "28 May",
    img: testi2,
    name: "Client Name",
    job: "Profession",
    text: "Tempor erat elitr rebum at clita. Diam dolor diam ipsum sit diam amet diam et eos. Clita erat ipsum et lorem et sit.",
  },
  {
    date: "30 May",
    img: testi3,
    name: "Client Name",
    job: "Profession",
    text: "Tempor erat elitr rebum at clita. Diam dolor diam ipsum sit diam amet diam et eos. Clita erat ipsum et lorem et sit.",
  },
  {
    date: "31 May",
    img: testi4,
    name: "Client Name",
    job: "Profession",
    text: "Tempor erat elitr rebum at clita. Diam dolor diam ipsum sit diam amet diam et eos. Clita erat ipsum et lorem et sit.",
  },
];

const counters = [
  { icon: icoExperience, num: 25, label: "Years Experience" },
  { icon: icoAward, num: 183, label: "Award Winning" },
  { icon: icoAnimal, num: 2619, label: "Total Animals" },
  { icon: icoClient, num: 51940, label: "Happy Clients" },
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
const rankingData = [
  {
    title: "Mission & Engagement",
    description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin enim neque, varius ut lorem eget, blandit venenatis felis."
  },
  {
    title: "Spread Global Awareness",
    description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin enim neque, varius ut lorem eget, blandit venenatis felis."
  },
  {
    title: "Organize Grant Funding",
    description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin enim neque, varius ut lorem eget, blandit venenatis felis."
  },
  {
    title: "Ignite Sustainable Impact",
    description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin enim neque, varius ut lorem eget, blandit venenatis felis."
  }
];
/* 🔹 ARROW COMPONENTS: tự clear timer rồi gọi onClick từ Slick 🔹 */
const makeArrow = (dir, timerRef) => {
  const IconComp = dir === "prev" ? LeftOutlined : RightOutlined;
  const slickClass = dir === "prev" ? "slick-prev" : "slick-next";

  return ({ onClick }) => (
    <span
      className={`hero-nav slick-arrow ${slickClass}`}
      onClick={() => {
        clearTimeout(timerRef.current);
        onClick();
      }}
    >
      <IconComp className="arrow-icon" />
    </span>
  );
};

/* ===== TRANG CHÍNH ===== */
const HomePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  /* ---- refs ---- */
  /* ---- refs ---- */
  const upgradeTimer = useRef(null);
  const slideTimerRef = useRef(null);
  const carouselRef = useRef(null);
  const videoRef = useRef(null);
  const homepageRef = useRef(null);

  /* ---- local state ---- */
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0); // currently visible slide
  const [animTick, setAnimTick] = useState(0); // force‑replay key
  /* ---- show upgrade modal after 2s ---- */
  useEffect(() => {
    upgradeTimer.current = setTimeout(() => setShowUpgrade(true), 2000);
    return () => clearTimeout(upgradeTimer.current);
  }, []);

  /* ---- scroll reveal custom hook ---- */
  useScrollReveal();
  const isMember = user && user.role === "member";
  /* =============================================================
    SLIDE HANDLERS
  ============================================================= */
  const AUTO_DELAY = 1000; // 4s for image slide

  const [inView, setInView] = useState(false); // state để theo dõi khi phần tử vào màn hình
  const sectionRef = useRef(null); // tham chiếu đến phần tử

  useEffect(() => {
    // Khởi tạo AOS
    AOS.init({
      duration: 1000,  // Thời gian hoạt ảnh
      once: true,      // Chạy một lần khi phần tử xuất hiện
      offset: 100,     // Kích hoạt khi phần tử vào gần cửa sổ
      easing: "ease-in-out", // Tùy chỉnh độ mượt của hiệu ứng
      delay: 100, // Thời gian trì hoãn trước khi hoạt ảnh bắt đầu
    });

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true); // Khi phần tử vào màn hình, set inView thành true
        }
      },
      { threshold: 0.8 } // Kích hoạt khi 70% phần tử xuất hiện
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current); // Quan sát phần tử
    }

    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current); // Hủy bỏ quan sát khi component unmount
      }
    };
  }, []);

  const handleAnimationEnd = () => {
    // Callback để đợi animation kết thúc trước khi đếm
    setInView(true); // Khi animation kết thúc, cho phép đếm
  };
  // Khi video kết thúc ➜ Slick next
  const handleVideoEnd = () => carouselRef.current?.next();

  const handleBeforeChange = (_from, to) => {
    setActiveSlide(to);
    setAnimTick((prev) => prev + 1); // ép caption remount ➜ animation lặp lại
  };

  const scheduleNext = (fromIdx) => {
    clearTimeout(slideTimerRef.current);

    // Slide video: không đặt hẹn giờ – chờ onEnded
    if (fromIdx === 0) return;

    slideTimerRef.current = setTimeout(() => {
      const nextIdx = (fromIdx + 1) % heroSlides.length;
      carouselRef.current?.goTo(nextIdx, true);
    }, AUTO_DELAY);
  };

  const handleAfterChange = (idx) => {
    // Nếu vừa tới slide video, video element đã được remount (key change) nên
    // autoPlay sẽ chạy lại – không cần reset thủ công.
    scheduleNext(idx);
  };
  const [countKey, setCountKey] = useState(0); // Khai báo countKey trong state

  useEffect(() => {
    // Tăng countKey mỗi khi component render lại
    setCountKey((prevKey) => prevKey + 1);
  }, []); // [] để chỉ chạy một lần khi component được mount


  /* cleanup on unmount */
  useEffect(() => () => clearTimeout(slideTimerRef.current), []);

  const [activeIndex, setActiveIndex] = useState(0);

  const changeContent = (index) => {
    setActiveIndex(index); // Update the active content based on the clicked title
  };

  /* =============================================================
    RENDER
  ============================================================= */
  const PrevArrow = makeArrow("prev", slideTimerRef);
  const NextArrow = makeArrow("next", slideTimerRef);

  return (
    <Layout className="homepage" ref={homepageRef}>
      <Navbar />

      {/* -------- Upgrade popup -------- */}
      {showUpgrade && user?.role === "member" && (
        <PlanUpgradeModal
          open
          scrollContainer={homepageRef}
          onClose={() => setShowUpgrade(false)}
        />
      )}

      {/* ---------------- HERO ---------------- */}
      <section className="hero-section scroll-section">
        <Carousel
          ref={carouselRef}
          className="hero-carousel"
          arrows
          effect="fade"
          dots
          beforeChange={handleBeforeChange}
          afterChange={handleAfterChange}
          prevArrow={<PrevArrow />}
          nextArrow={<NextArrow />}
        >
          {heroSlides.map((s, i) => {
            const bgStyle = s.isVideo ? {} : { backgroundImage: `url(${s.bg})` };
            const isActive = i === activeSlide;
            const keySuffix = `${i}-${animTick}`;

            return (
              <div key={i}>
                <div className="hero-slide" style={bgStyle}>
                  {s.isVideo && (
                    <video
                      key={`video-${animTick}`}
                      ref={videoRef}
                      className="hero-bg-video"
                      src={s.video}
                      autoPlay
                      muted
                      playsInline
                      onEnded={handleVideoEnd}
                    />
                  )}

                  <div className="hero-overlay">
                    <div className="container">
                      <Row align="middle" justify="center" gutter={[32, 32]}>
                        {/* caption */}
                        <Col xs={24} lg={14} className="hero-text">
                          <Paragraph
                            key={`tag-${keySuffix}`}
                            className={`${isActive ? getAnimCls("slideInDown") : ""} hero-tag`}
                            style={ANIMATE_STYLE}
                          >
                            {s.tag}
                          </Paragraph>
                          <Title
                            key={`ttl-${keySuffix}`}
                            level={1}
                            className={`${isActive ? getAnimCls("slideInDown") : ""} hero-title`}
                            style={ANIMATE_STYLE}
                          >
                            {s.title}
                          </Title>
                          <Button
                            key={`btn-${keySuffix}`}
                            type="primary"
                            size="large"
                            className={`${isActive ? getAnimCls("slideInDown") : ""} hero-btn`}
                            style={ANIMATE_STYLE}
                            icon={<RightOutlined />}
                          >
                            Learn More
                          </Button>
                        </Col>
                        {/* image */}
                        <Col
                          xs={0}
                          lg={10}
                          key={`img-${keySuffix}`}
                          className={`${isActive ? getAnimCls("zoomIn") : ""} hero-image-col`}
                          style={ANIMATE_STYLE}
                        >
                          <img src={s.img} alt="Hero" className="hero-image" />
                        </Col>
                      </Row>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </Carousel>
      </section>


      {/* ---------- MEET ARTISTS (3/4 ảnh + 1/4 list) ---------- */}
      <section className="artists-section section-padding  scroll-section" ref={sectionRef} data-reveal="up" id="section_3">
        <div className="container">

          {/* Row A: Title */}
          <div className="row justify-content-center">
            <div className="text-center  mx-auto " data-aos="fade-up" data-aos-delay="100" style={{ maxWidth: "500px" }}>
              <h2 className="section-title bg-white text-center text-primary px-3 ">Meet Artists</h2>
            </div>
          </div>

          {/* Row B: 3/4 ảnh & 1/4 list */}
          <div className="row gx-4 gy-4 align-items-start">

            {/* —— 3/4 màn: giữ nguyên tất cả ảnh + hover info —— */}
            <div className="col-lg-9 col-12">
              <div className="row g-4">
                {/* ảnh lớn */}
                <div className="col-lg-5 col-12">
                  <div className="artists-thumb">
                    <div className="artists-image-wrap">
                      <img
                        src="assets/images/artists/joecalih-UmTZqmMvQcw-unsplash.jpg"
                        alt="Madona"
                        className="artists-image img-fluid"
                      />
                    </div>
                    <div className="artists-hover">
                      <p><strong>Name:</strong> Madona</p>
                      <p><strong>Birthdate:</strong> August 16, 1958</p>
                      <p><strong>Music:</strong> Pop, R&amp;B</p>
                      <hr />
                      <p className="mb-0">
                        <strong>Youtube Channel:</strong>
                        <a href="#">Madona Official</a>
                      </p>
                    </div>
                  </div>
                </div>
                {/* hai ảnh nhỏ xếp dọc */}
                <div className="col-lg-5 col-12 d-flex flex-column">
                  <div className="artists-thumb mb-4">
                    <div className="artists-image-wrap">
                      <img
                        src="assets/images/artists/abstral-official-bdlMO9z5yco-unsplash.jpg"
                        alt="Rihana"
                        className="artists-image img-fluid"
                      />
                    </div>
                    <div className="artists-hover">
                      <p><strong>Name:</strong> Rihana</p>
                      <p><strong>Birthdate:</strong> Feb 20, 1988</p>
                      <p><strong>Music:</strong> Country</p>
                      <hr />
                      <p className="mb-0">
                        <strong>Youtube Channel:</strong>
                        <a href="#">Rihana Official</a>
                      </p>
                    </div>
                  </div>
                  <div className="artists-thumb">
                    <div className="artists-image-wrap">
                      <img
                        src="assets/images/artists/soundtrap-rAT6FJ6wltE-unsplash.jpg"
                        alt="Bruno Bros"
                        className="artists-image img-fluid"
                      />
                    </div>
                    <div className="artists-hover">
                      <p><strong>Name:</strong> Bruno Bros</p>
                      <p><strong>Birthdate:</strong> October 8, 1985</p>
                      <p><strong>Music:</strong> Pop</p>
                      <hr />
                      <p className="mb-0">
                        <strong>Youtube Channel:</strong>
                        <a href="#">Bruno Official</a>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* —— 1/4 màn: YOUR CUSTOM LIST —— */}
            <div className="col-lg-3 col-12">
              <ul className="custom-list h-100 d-flex flex-column justify-content-evenly">
                <li><i className="bi bi-check-circle-fill me-2"></i> Tính năng A</li>
                <li><i className="bi bi-check-circle-fill me-2"></i> Tính năng B</li>
                <li><i className="bi bi-check-circle-fill me-2"></i> Tính năng C</li>
                <li><i className="bi bi-check-circle-fill me-2"></i> Tính năng D</li>
                <li><i className="bi bi-check-circle-fill me-2"></i> Tính năng E</li>
                <li><i className="bi bi-check-circle-fill me-2"></i> Tính năng F</li>
                <li><i className="bi bi-check-circle-fill me-2"></i> Tính năng G</li>
              </ul>
            </div>

          </div>
        </div>
      </section>


      {/* ---------- PLANS (Roadmap) ---------- */}
      <RoadmapCarousel roadmapItems={roadmapItems} />
      {/* ---------- END PLANS ---------- */}

      {/* ---------- LIFESTYLE STEPS ---------- */}
      <section className="features__v2 section scroll-section" id="features">
        <div className="container">
          <div className="content p-5 rounded-4" >
            <div className="row align-items-center">
              {/* Left block */}
              <div className="col-lg-5 mb-5 mb-lg-0">
                <h2 className=" mb-4">Why Choose us</h2>
                <p className="mb-5">
                  Experience the future of finance with our secure, efficient, and user-friendly financial services.
                  Our cutting-edge platform ensures your transactions are safe, streamlined, and easy to manage,
                  empowering you to take control of your financial journey with confidence and convenience.
                </p>
                <a
                  href="https://www.youtube.com/watch?v=sEvGwOa-tHE"
                  className="btn-play d-inline-flex align-items-center gap-2 mb-0"

                >
                  <i className="bi bi-play-fill"></i>
                  Watch the Video
                </a>
              </div>
              {/* Right grid */}
              <div className="col-lg-7">
                <div className="row g-4">
                  {[
                    { icon: "person-check", title: "User-Friendly Interface", text: "Easy navigation with responsive design for various devices." },
                    { icon: "graph-up", title: "Financial Analytics", text: "Budget tracking, expense categorization, and personalized insights." },
                    { icon: "headset", title: "Customer Support", text: "24/7 service via chat, email, phone, and a detailed help center." },
                    { icon: "shield-lock", title: "Security Features", text: "Data encryption, fraud detection, and prevention mechanisms." },
                  ].map((item, i) => (
                    <div
                      className="col-sm-6 text-center"
                      key={i}

                    >
                      <div className="icon mb-3">
                        <i className={`bi bi-${item.icon} fs-4`}></i>
                      </div>
                      <h5 className="fw-bold mb-2">{item.title}</h5>
                      <p className="mb-0">{item.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* ---------- CTA ---------- */}
      <section className="cta-section scroll-section split" data-reveal="split">
        <div className="container">
          <Card className="cta-card ">
            <Row justify="space-between" align="middle">
              {/* Left half */}
              <Col xs={24} lg={14} className="split-left">
                <Title level={3} >Sẵn sàng lập kế hoạch bỏ thuốc?</Title>
                <Paragraph>
                  Đăng nhập hôm nay và bắt đầu kế hoạch bỏ thuốc cá nhân hóa với
                  HealthyBite.
                </Paragraph>
              </Col>

              {/* Right half */}
              <Col xs={24} lg={10} className="split-right" >
                <Button
                  type="primary"
                  size="large"
                  onClick={() => {
                    navigate("/login");
                  }}
                >
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



      <section className="about-block scroll-section" ref={sectionRef} data-reveal="up" >
        <div className="container">
          <Row gutter={[48, 48]} align="bottom">
            <Col xs={24} lg={12} className="about-left">
              <div className="about-grid">
                <div className="about-exp-box" onAnimationEnd={handleAnimationEnd}>
                  <h1 className="display-1 mb-0 ">
                    {inView && (
                      <CountUp start={0} end={25} duration={2} />
                    )}
                  </h1>
                  <small className="fs-5 fw-bold">Years Experience</small>
                </div>
                <div className="about-img-container">
                  <img className="about-img img1" src={about1} alt="about1" />
                </div>
                <div className="about-img-container">
                  <img className="about-img img2" src={about2} alt="about2" />
                </div>
                <div className="about-img-container">
                  <img className="about-img img3" src={about3} alt="about3" />
                </div>
              </div>
            </Col>

            <Col xs={24} lg={12}>
              <p className="section-title bg-white text-start text-primary pe-3">About Us</p>
              <Title level={2} className="mb-4">Know About Our Dairy Farm & Our History</Title>
              <Paragraph>Tempor erat elitr rebum at clita…</Paragraph>

              <Row gutter={32} style={{ marginTop: 16 }}>
                <Col xs={12}>
                  <div className="about-feature">
                    <img src={iconService} alt="service" />
                    <div>
                      <h5>Dedicated Services</h5>
                      <span>Clita erat ipsum et lorem…</span>
                    </div>
                  </div>
                </Col>
                <Col xs={12}>
                  <div className="about-feature">
                    <img src={iconProduct} alt="product" />
                    <div>
                      <h5>Organic Products</h5>
                      <span>Clita erat ipsum et lorem…</span>
                    </div>
                  </div>
                </Col>
              </Row>

              <Button size="large" type="primary" className="mt-4 rounded-pill">
                Explore More
              </Button>
            </Col>
          </Row>
        </div>
      </section>


      <section className="whyus-block scroll-section" data-reveal="right" ref={sectionRef}>
        <div className="container">
          <Row gutter={[48, 48]} align="middle">
            <Col xs={24} lg={12}>
              <p className="section-title bg-white text-start text-primary pe-3">Why Us!</p>
              <Title level={2}>Few Reasons Why People Choosing Us!</Title>
              <Paragraph>Tempor erat elitr rebum at clita…</Paragraph>
              <ul className="checklist">
                <li><CheckOutlined /> Justo magna erat amet</li>
                <li><CheckOutlined /> Aliqu diam amet diam et eos</li>
                <li><CheckOutlined /> Clita erat ipsum et lorem et sit</li>
              </ul>
              <Button size="large" type="primary" className="mt-3 rounded-pill">
                Explore More
              </Button>
            </Col>

            <Col xs={24} lg={12}>
              <div className="counter-grid">
                {counters.map((c, i) => (
                  <div key={i} className="counter-tile text-center">
                    <img src={c.icon} alt="ico" className="mb-3" />
                    <h1 className="display-6">
                      {inView && (
                        <CountUp start={0} end={c.num} duration={8} />
                      )}
                    </h1>
                    <span className="fs-5 fw-semi-bold text-secondary">{c.label}</span>
                  </div>
                ))}
              </div>
            </Col>
          </Row>
        </div>
      </section>

      <Parallax bgImage={bannerImg} strength={500}>
        <div className="custom-banner">
          <div className="container">
            <div className="row g-4">
              <div className="col-lg-6">
                <div className="row g-4 align-items-center">
                  <div className="col-sm-4">
                    <img className="img-fluid rounded banner-img" src={bannerImg1} alt="Banner 1" />
                  </div>
                  <div className="col-sm-8">
                    <Title level={2} className="text-white mb-3">We Sell Best Dairy Products</Title>
                    <Paragraph className="text-white mb-4">Clita erat ipsum et lorem et sit, sed stet lorem sit clita duo justo magna dolore erat amet</Paragraph>
                    <Button className="btn-read-more" href="#">Read More</Button>
                  </div>
                </div>
              </div>

              <div className="col-lg-6">
                <div className="row g-4 align-items-center">
                  <div className="col-sm-4">
                    <img className="img-fluid rounded banner-img" src={bannerImg2} alt="Banner 2" />
                  </div>
                  <div className="col-sm-8">
                    <Title level={2} className="text-white mb-3">We Deliver Fresh Mild Worldwide</Title>
                    <Paragraph className="text-white mb-4">Clita erat ipsum et lorem et sit, sed stet lorem sit clita duo justo magna dolore erat amet</Paragraph>
                    <Button className="btn-read-more" href="#">Read More</Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Parallax>



      <section className="service-section scroll-section">
        <div className="container-xxl py-5">
          <div className="container">
            <div className="text-center mx-auto pb-4" data-aos="fade-up" data-aos-delay="100" style={{ maxWidth: "500px" }}>
              <p className="section-title bg-white text-center text-primary px-3">Our Services</p>
              <h1 className="mb-5">Services That We Offer For Entrepreneurs</h1>
            </div>
            <div className="row gy-5 gx-4">
              <div className="col-lg-4 col-md-6 pt-5" data-aos="fade-up" data-aos-delay="100">
                <div className="service-item d-flex h-100">
                  <div className="service-img">
                    <img className="img-fluid" src={service1} alt="" />
                  </div>
                  <div className="service-text p-5 pt-0">
                    <div className="service-icon">
                      <img className="img-fluid rounded-circle" src={service1} alt="" />
                    </div>
                    <h5 className="mb-3">Best Animal Selection</h5>
                    <p className="mb-4">Erat ipsum justo amet duo et elitr dolor, est duo duo eos lorem sed diam stet diam sed stet.</p>
                    <a className="btn btn-square rounded-circle" href="#"><i className="bi bi-chevron-double-right"></i></a>
                  </div>
                </div>
              </div>
              <div className="col-lg-4 col-md-6 pt-5" data-aos="fade-up" data-aos-delay="300">
                <div className="service-item d-flex h-100">
                  <div className="service-img">
                    <img className="img-fluid" src={service2} alt="" />
                  </div>
                  <div className="service-text p-5 pt-0">
                    <div className="service-icon">
                      <img className="img-fluid rounded-circle" src={service2} alt="" />
                    </div>
                    <h5 className="mb-3">Breeding & Veterinary</h5>
                    <p className="mb-4">Erat ipsum justo amet duo et elitr dolor, est duo duo eos lorem sed diam stet diam sed stet.</p>
                    <a className="btn btn-square rounded-circle" href="#"><i className="bi bi-chevron-double-right"></i></a>
                  </div>
                </div>
              </div>
              <div className="col-lg-4 col-md-6 pt-5" data-aos="fade-up" data-aos-delay="500">
                <div className="service-item d-flex h-100">
                  <div className="service-img">
                    <img className="img-fluid" src={service3} alt="" />
                  </div>
                  <div className="service-text p-5 pt-0">
                    <div className="service-icon">
                      <img className="img-fluid rounded-circle" src={service3} alt="" />
                    </div>
                    <h5 className="mb-3">Care & Milking</h5>
                    <p className="mb-4">Erat ipsum justo amet duo et elitr dolor, est duo duo eos lorem sed diam stet diam sed stet.</p>
                    <a className="btn btn-square rounded-circle" href="#"><i className="bi bi-chevron-double-right"></i></a>
                  </div>
                </div>
              </div>
            </div>
          </div>
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
                  Đội ngũ chuyên gia dinh dưỡng của chúng tôi ở đây để giúp bạn
                  đạt được mục tiêu sức khỏe và thể chất. Các chuyên gia dinh
                  dưỡng của chúng tôi là những chuyên gia được đào tạo cao và có
                  trình độ với sự hiểu biết sâu sắc về khoa học đằng sau dinh
                  dưỡng và cách nó có thể tác động đến cơ thể và tâm trí của
                  bạn.
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

      {/* ---------------- TESTIMONIALS ---------------- */}
      <section className="testimonial-section scroll-section">
        <div className="container-xxl py-5">
          <div className="container">
            <div className="text-center  mx-auto " data-aos="fade-up" data-aos-delay="100" style={{ maxWidth: "500px" }}>
              <h6 className="section-title bg-white text-center text-primary px-3">Testimonial </h6>
              <h1 className="mb-5">Our Clients Say!</h1>
            </div>

            <Carousel
              dots
              autoplay
              infinite
              draggable
              className="testimonial-carousel"
              centerMode
              slidesToShow={3}
              responsive={[{ breakpoint: 991, settings: { slidesToShow: 1 } }]}
            >
              {testimonials.map((t, idx) => (

                <div key={idx} className="testimonial-item text-center px-3">
                  <Badge.Ribbon text={t.date} color=" red" placement="end"></Badge.Ribbon>
                  <img
                    className="bg-light rounded-circle p-2 mx-auto mb-3"
                    src={t.img}
                    style={{ width: 80, height: 80, objectFit: "cover" }}
                  />
                  <h5 className="mb-0">{t.name}</h5>
                  <Text type="secondary">{t.job}</Text>
                  <Card
                    className="testimonial-text bg-light text-center mt-3"
                    bordered={false}
                    style={{ borderRadius: 0 }}
                  >
                    <Paragraph className="mb-0" style={{ fontStyle: "italic" }}>
                      {t.text}
                    </Paragraph>
                  </Card>
                </div>
              ))}
            </Carousel>
          </div>
        </div>
      </section>



      <section className="experience-section bg-img py-5 mb-5" >
        <div className="container py-5 " >
          <Row gutter={[32, 32]}>
            <Col lg={6} md={12}>
              <div className="d-flex " >
                <div className="bg-primary border-inner d-flex align-items-center justify-content-center mb-3" style={{ width: "60px", height: "60px" }}>
                  <FaStar className="text-white" />
                </div>
                <div className="ps-4">
                  <h6 className="text-primary text-uppercase">Our Experience</h6>
                  <h1 className="display-5 text-white mb-0"> {inView && <CountUp start={0} end={12345} duration={17} />}</h1>
                </div>
              </div>
            </Col>
            <Col lg={6} md={12}>
              <div className="d-flex">
                <div className="bg-primary border-inner d-flex align-items-center justify-content-center mb-3" style={{ width: "60px", height: "60px" }}>
                  <FaUsers className="text-white" />
                </div>
                <div className="ps-4">
                  <h6 className="text-primary text-uppercase">Cake Specialist</h6>
                  <h1 className="display-5 text-white mb-0">{inView && <CountUp start={0} end={12345} duration={18} />}</h1>
                </div>
              </div>
            </Col>
            <Col lg={6} md={12}>
              <div className="d-flex">
                <div className="bg-primary border-inner d-flex align-items-center justify-content-center mb-3" style={{ width: "60px", height: "60px" }}>
                  <FaCheck className="text-white" />
                </div>
                <div className="ps-4">
                  <h6 className="text-primary text-uppercase">Complete Project</h6>
                  <h1 className="display-5 text-white mb-0">{inView && <CountUp start={0} end={12345} duration={19} />}</h1>
                </div>
              </div>
            </Col>
            <Col lg={6} md={12}>
              <div className="d-flex">
                <div className="bg-primary border-inner d-flex align-items-center justify-content-center mb-3" style={{ width: "60px", height: "60px" }}>
                  <FaMugHot className="text-white" />
                </div>
                <div className="ps-4">
                  <h6 className="text-primary text-uppercase">Happy Clients</h6>
                  <h1 className="display-5 text-white mb-0">{inView && <CountUp start={0} end={12345} duration={20} />}</h1>
                </div>
              </div>
            </Col>
          </Row>
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


      {/* ----------RANKING --------- */}
      <section className="ranking-section">
        <div className="container">
          <div className="container">
            <div className="text-center mx-auto pb-4" style={{ maxWidth: "500px" }}>
              <p className="section-title bg-white text-center text-primary px-3"> Bảng Xếp Hạng</p>
            </div>
            <div className="row">
              {/* Left side: Clickable titles */}
              <div className="col-md-6">
                <div className="ranking-titles">
                  {rankingData.map((item, index) => (
                    <div
                      key={index}
                      className={`ranking-title ${activeIndex === index ? "active" : ""}`}
                      onClick={() => changeContent(index)}
                    >
                      <Title level={3}>{`0${index + 1} ${item.title}`}</Title>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right side: Content */}
              <div className="col-md-6">
                <div className="ranking-content-wrapper">
                  <div className="ranking-content">
                    <Card
                      className="ranking-card"
                      title="What we do"
                      bordered={false}
                      style={{
                        backgroundColor: "#f0faff",
                        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                        borderRadius: "8px",
                      }}
                    >
                      <Title className="ranking-title" level={4}>{rankingData[activeIndex].title}</Title>
                      <Paragraph>{rankingData[activeIndex].description}</Paragraph>
                    </Card>
                  </div>
                </div>
              </div>
            </div>
          </div>
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
