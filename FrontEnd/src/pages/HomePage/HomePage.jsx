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
  ExperimentOutlined, TeamOutlined,
} from "@ant-design/icons";
import {
  FaSkullCrossbones,
  FaHeartbeat,
  FaAward,
  FaUserFriends,
  FaClock,
  FaMoneyBillWave,
  FaLungsVirus,
} from "react-icons/fa";
import {
  Target,
  TrendingUp,
  Zap,
  Shield,
  CheckCircle,
  Star,
  Clock,
  Heart,
  Award,
  Users,
  Gift,
  MessageCircle,
  BookOpen,
  Calendar,
  Leaf,
  Wind,
  Activity
} from 'lucide-react';
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
    tag: "// Smoking Cessation //",
    title: "Bỏ Thuốc Lá",
    img: car1,
  },
  {
    isVideo: false,
    bg: bg2,
    tag: "// Smoking Cessation //",
    title: "Khỏe Mạnh Hơn Từng Ngày",
    img: car2,
  },
];


/* ===== DỮ LIỆU TĨNH ===== */
const roadmapItems = [
  { title: "1–7 ngày", desc: "Vị giác & khứu giác phục hồi" },
  { title: "1 tháng", desc: "Ít ho, đờm; thở dễ hơn" },
  { title: "3 tháng", desc: "Tuần hoàn cải thiện, bớt mệt" },
  { title: "1 năm", desc: "Nguy cơ tim mạch giảm 50%" },
  { title: "5–10 năm", desc: "Nguy cơ ung thư phổi giảm đáng kể" },
];

const benefits = [
  "Cải thiện sức khỏe thể chất",
  "Sức khỏe tinh thần tốt hơn",
  "Tăng tuổi thọ",
  "Quản lý cân nặng",
  "Tăng sự tự tin",
  "Giảm căng thẳng",
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
  { icon: FaClock, num: 7, label: "Ngày Không Hút" },
  { icon: FaSkullCrossbones, num: 0, label: "Mức Độc Tố" },
  { icon: FaMoneyBillWave, num: 10000000, label: "Tiết Kiệm (₫)" },
  { icon: FaAward, num: 5, label: "Huy Hiệu Đạt Được" }  // <-- thêm mục này
];

const categoryFeatures = [
  "Giảm nguy cơ ung thư và bệnh tim mạch",
  "Cải thiện chức năng phổi và hô hấp",
  "Giảm căng thẳng, lo âu",
  "Tiết kiệm chi phí hàng tháng",
  "Làm gương cho gia đình",
];
const expertQualifications = [
  "Chuyên gia dinh dưỡng đã đăng ký với Viện Dinh dưỡng và Chế độ ăn",
  "Hơn 5 năm kinh nghiệm trong lĩnh vực",
  "Chuyên về quản lý cân nặng, phòng ngừa bệnh mãn tính và dinh dưỡng thể thao",
  "Thành thạo trong việc phát triển công thức và kế hoạch bữa ăn",
  "Đam mê giúp mọi người sống khỏe mạnh, trọn vẹn",
  "Cam kết cập nhật những nghiên cứu và xu hướng mới nhất trong dinh dưỡng",
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
const quitMethods = [
  {
    id: 'gradual',
    title: 'Giảm Dần Từng Bước',
    icon: <TrendingUp className="method-icon" />,
    description: 'Phương pháp khoa học giảm từ từ số điếu thuốc mỗi ngày',
    features: [
      'Lên lịch giảm 20% mỗi tuần',
      'Thay thế thói quen hút thuốc',
      'Ghi nhật ký cảm xúc',
      'Sử dụng kẹo cao su hoặc tăm'
    ],
    color: '#10B981',
    duration: '4-6 tuần',
    successRate: 75
  },
  {
    id: 'immediate',
    title: 'Dừng Ngay Lập Tức',
    icon: <Zap className="method-icon" />,
    description: 'Quyết tâm cứng rắn, dừng hoàn toàn từ ngày đầu tiên',
    features: [
      'Loại bỏ tất cả thuốc lá',
      'Thay đổi môi trường sống',
      'Tập thể dục thường xuyên',
      'Uống nhiều nước, ăn trái cây'
    ],
    color: '#3B82F6',
    duration: '2-3 tuần khó khăn',
    successRate: 60
  },
  {
    id: 'support',
    title: 'Hỗ Trợ Y Tế',
    icon: <Shield className="method-icon" />,
    description: 'Sử dụng thuốc thay thế nicotine và tư vấn chuyên gia',
    features: [
      'Miếng dán nicotine',
      'Thuốc kê đơn hỗ trợ',
      'Tư vấn tâm lý định kỳ',
      'Theo dõi sức khỏe'
    ],
    color: '#0EA5E9',
    duration: '8-12 tuần',
    successRate: 85
  }
];

const successStories = [
  {
    name: 'Anh Minh Tuấn',
    age: 35,
    profession: 'Nhân viên văn phòng',
    smokingYears: 15,
    quitDays: 180,
    avatar: '👨‍💼',
    story: 'Sau 15 năm hút thuốc, tôi đã bỏ được nhờ phương pháp giảm dần. Giờ tôi cảm thấy khỏe mạnh hơn rất nhiều!',
    benefits: ['Hết ho mãn tính', 'Tiết kiệm 3 triệu/tháng', 'Vợ con vui vẻ hơn'],
    method: 'Giảm dần từng bước'
  },
  {
    name: 'Chị Thu Hương',
    age: 28,
    profession: 'Giáo viên',
    smokingYears: 8,
    quitDays: 90,
    avatar: '👩‍🏫',
    story: 'Là giáo viên, tôi cần làm gương cho học sinh. Việc bỏ thuốc giúp tôi tự tin hơn trong công việc.',
    benefits: ['Giọng nói trong hơn', 'Không còn mùi thuốc', 'Làm việc tập trung'],
    method: 'Dừng ngay lập tức'
  },
  {
    name: 'Ông Văn Nam',
    age: 52,
    profession: 'Tài xế',
    smokingYears: 25,
    quitDays: 365,
    avatar: '👨‍🚛',
    story: 'Bác sĩ cảnh báo về sức khỏe tim mạch. Với sự hỗ trợ y tế, tôi đã thành công bỏ thuốc sau 25 năm.',
    benefits: ['Huyết áp ổn định', 'Ít mệt mỏi', 'Tiết kiệm tiền khám bệnh'],
    method: 'Hỗ trợ y tế'
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
  const [animTick, setAnimTick] = useState(0);
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
  const aboutRef = useRef(null); // cho phần "about"
  const whyusRef = useRef(null);
  const expRef = useRef(null); // cho phần "why us"
  const [inViewAbout, setInViewAbout] = useState(false);
  const [inViewWhyus, setInViewWhyus] = useState(false);
  const [inViewExp, setInViewExp] = useState(false);
  useEffect(() => {
    const aboutObserver = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setInViewAbout(true);
      },
      { threshold: 0.5 } // Kích hoạt khi 50% phần tử xuất hiện
    );

    const whyusObserver = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setInViewWhyus(true);
      },
      { threshold: 0.5 } // Kích hoạt khi 50% phần tử xuất hiện
    );
    const expObserver = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setInViewExp(true);
      },
      { threshold: 0.5 } // Kích hoạt khi 50% phần tử xuất hiện
    );
    if (aboutRef.current) aboutObserver.observe(aboutRef.current);
    if (whyusRef.current) whyusObserver.observe(whyusRef.current);
    if (expRef.current) expObserver.observe(expRef.current);
    return () => {
      if (aboutRef.current) aboutObserver.unobserve(aboutRef.current);
      if (whyusRef.current) whyusObserver.unobserve(whyusRef.current);
      if (expRef.current) expObserver.unobserve(expRef.current);
    };
  }, []);

  const [activeMethod, setActiveMethod] = useState(0);
  const [activeSuccess, setActiveSuccess] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);

    const methodInterval = setInterval(() => {
      setActiveMethod(prev => (prev + 1) % quitMethods.length);
    }, 5000);

    const storyInterval = setInterval(() => {
      setActiveSuccess(prev => (prev + 1) % successStories.length);
    }, 6000);

    return () => {
      clearInterval(methodInterval);
      clearInterval(storyInterval);
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



      {/* ---------- LIFESTYLE STEPS (Tác hại hút thuốc) ---------- */}
      <section
        className="features__v2 section scroll-section"
        data-reveal="right"
        id="features"
      >
        <div className="container">
          <div className="content p-5 rounded-4">
            <div className="row align-items-center">
              {/* Left block */}
              <div className="col-lg-5 mb-5 mb-lg-0">
                <h2 className="mb-4">
                  Bạn Có Biết Tác Hại <span className="smoking-highlight">HÚT THUỐC</span>?
                </h2>
                <p className="mb-5">
                  Hút thuốc lá gây ảnh hưởng nghiêm trọng đến sức khỏe thể chất,
                  tinh thần và tài chính. Khói thuốc không chỉ làm tăng nguy cơ
                  mắc nhiều bệnh mạn tính mà còn ảnh hưởng xấu đến chất lượng cuộc
                  sống và những người xung quanh.
                </p>
                <a
                  href="https://www.youtube.com/watch?v=sEvGwOa-tHE"
                  className="btn-play d-inline-flex align-items-center gap-2 mb-0"
                >
                  <ExperimentOutlined style={{ fontSize: 20, color: "#fff" }} />
                  <span>Watch the Video</span>
                </a>
              </div>

              {/* Right grid: Tác hại hút thuốc */}
              <div className="col-lg-7">
                <div className="row g-4">
                  {[
                    {
                      icon: <FaSkullCrossbones size={32} color="#f5222d" />,
                      title: "Ung thư",
                      text: "Tăng nguy cơ mắc ung thư phổi, miệng, họng, thực quản và nhiều loại khác."
                    },
                    {
                      icon: <FaHeartbeat size={32} color="#eb2f96" />,
                      title: "Bệnh tim mạch",
                      text: "Gia tăng nguy cơ đau tim, đột quỵ và xơ vữa động mạch."
                    },
                    {
                      icon: <FaLungsVirus size={32} color="#fa8c16" />,
                      title: "Bệnh phổi mạn tính",
                      text: "Gây viêm, hẹp đường thở, ho mãn tính và khó thở."
                    },
                    {
                      icon: <FaUserFriends size={32} color="#52c41a" />,
                      title: "Hút thuốc thụ động",
                      text: "Ảnh hưởng xấu tới người xung quanh, đặc biệt trẻ em và người già."
                    },
                    {
                      icon: <FaClock size={32} color="#1890ff" />,
                      title: "Lão hóa sớm",
                      text: "Da nhăn nheo, chảy xệ, mất độ đàn hồi và xỉn màu."
                    },
                    {
                      icon: <FaMoneyBillWave size={32} color="#13c2c2" />,
                      title: "Tốn kém chi phí",
                      text: "Tiêu tốn hàng triệu đồng mỗi tháng cho thuốc lá và điều trị bệnh."
                    },
                  ].map((item, i) => (
                    <div className="col-sm-6 text-center" key={i}>
                      <div className="icon mb-3">
                        <div
                          style={{
                            width: 64,
                            height: 64,
                            borderRadius: "50%",
                            backgroundColor: "#e6fffb",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          {item.icon}
                        </div>
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


      {/* ---------- QUIT SMOKING SUPPORT BANNER ---------- */}
      <section className="support-section scroll-section" data-reveal="left">
        <div className="container">
          <div className="support-content">
            <div className="support-icon">
              <div className="icon-wrapper">
                <div className="heart-pulse">
                  ❤️
                  <div className="pulse-ring"></div>
                  <div className="pulse-ring-2"></div>
                </div>
              </div>
            </div>

            <div className="support-text">
              <h2 className="support-title">
                Chúng tôi ở đây để <span className="brand-highlight">hỗ trợ bạn</span>
              </h2>
              <div className="support-message">
                <div className="message-item">
                  <span className="message-label">Cai nghiện thuốc lá</span>
                  <span className="message-value">Không phải là hành trình một mình</span>
                </div>
              </div>
              <p className="support-subtitle">
                Cùng nhau vượt qua thử thách, hướng tới cuộc sống khỏe mạnh
              </p>
              <div className="support-stats">
                <div className="stat-item">
                  <span className="stat-number">24/7</span>
                  <span className="stat-label">Hỗ trợ</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number">95%</span>
                  <span className="stat-label">Thành công</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number">1000+</span>
                  <span className="stat-label">Người đã cai</span>
                </div>
              </div>
            </div>

            <div className="support-visual">
              <div className="before-card">
                <div className="card-icon">🚬</div>
                <div className="card-title">Trước khi cai</div>
                <div className="card-stats">
                  <div>Căng thẳng</div>
                  <div>Sức khỏe yếu</div>
                  <div>Tốn kém</div>
                </div>
              </div>
              <div className="transform-arrow">
                <div className="arrow-body">→</div>
                <span className="transform-text">Thay đổi</span>
              </div>
              <div className="after-card">
                <div className="card-icon">🌟</div>
                <div className="card-title">Sau khi cai</div>
                <div className="card-stats">
                  <div>Tự tin</div>
                  <div>Khỏe mạnh</div>
                  <div>Tiết kiệm</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>


      <section className="about-block scroll-section " data-reveal="right" ref={aboutRef}  >
        <div className="container">
          <Row gutter={[48, 48]} align="bottom">
            <Col xs={24} lg={12} className="about-left">
              <div className="about-grid">
                <div className="about-exp-box" onAnimationEnd={handleAnimationEnd}>
                  <h1>{inViewAbout && <CountUp start={0} end={25} duration={5} />}</h1>
                  <small className="fs-5 fw-bold">Năm Hỗ Trợ Bỏ Thuốc</small>
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
              <p className="section-title bg-white text-start text-primary pe-3">Về Chúng Tôi</p>
              <Title level={2} className="mb-4"> Cam Kết Hỗ Trợ Bỏ Thuốc Thành Công </Title>
              <Paragraph>  Với hơn 5 năm đồng hành cùng hàng ngàn người, HealthyQuit cung cấp
                kế hoạch cá nhân hóa, lời khuyên chuyên gia và cộng đồng chia sẻ để
                giúp bạn bỏ thuốc vĩnh viễn.</Paragraph>

              <Row gutter={32} style={{ marginTop: 16 }}>
                <Col xs={12}>
                  <div className="about-feature">
                    <ExperimentOutlined style={{ fontSize: 32, color: "#f5222d" }} />
                    <div>
                      <h5>Kế Hoạch Cá Nhân Hóa</h5>
                      <span>Được thiết kế riêng cho mức độ nghiện và lối sống của bạn.</span>
                    </div>
                  </div>
                </Col>
                <Col xs={12}>
                  <div className="about-feature">
                    <TeamOutlined style={{ fontSize: 32, color: "#52c41a" }} />
                    <div>
                      <h5>Cộng Đồng Hỗ Trợ</h5>
                      <span>Chia sẻ kinh nghiệm, động lực và nhận lời khuyên từ bạn bè
                        cùng mục tiêu.</span>
                    </div>
                  </div>
                </Col>
              </Row>

              <Button size="large" type="primary" className="mt-4 rounded-pill">
                Tìm Hiểu Thêm
              </Button>
            </Col>
          </Row>
        </div>
      </section>


      <section className="whyus-block scroll-section" data-reveal="right" ref={whyusRef}>
        <div className="container">
          <Row gutter={[48, 48]} align="middle">
            <Col xs={24} lg={12}>
              <p className="section-title bg-white text-start text-primary pe-3">Tại Sao Chọn Chúng Tôi ?</p>
              <Title level={2}>3 Lý Do Để Bỏ Thuốc Thành Công</Title>
              <Paragraph>Chúng tôi kết hợp phương pháp khoa học, hỗ trợ chuyên nghiệp và
                giao diện thân thiện để đồng hành cùng bạn trên mỗi bước.</Paragraph>
              <ul className="checklist">
                <li><CheckOutlined /> Lộ trình giảm dần khoa học, dễ áp dụng</li>
                <li><CheckOutlined /> Nhắc nhở & động viên hàng ngày</li>
                <li><CheckOutlined /> Đổi điểm lấy quà và huy hiệu khích lệ</li>
              </ul>
              <Button size="large" type="primary" className="mt-3 rounded-pill">
                Bắt Đầu Ngay
              </Button>
            </Col>

            <Col xs={24} lg={12}>
              <div className="counter-grid">

                {counters.map((c, i) => {
                  const IconComp = c.icon;
                  return (
                    <div key={i} className="counter-tile text-center">
                      <div
                        style={{
                          width: 64,
                          height: 64,
                          borderRadius: "50%",
                          backgroundColor: "#e6fffb",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          margin: "0 auto 1rem"
                        }}
                      >
                        <IconComp size={32} color="#1890ff" />
                      </div>
                      <h1 className="display-6">
                        {inViewWhyus && <CountUp start={0} end={c.num} duration={5} />}
                      </h1>
                      <span className="fs-5 fw-semi-bold text-secondary">
                        {c.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </Col>
          </Row>
        </div>
      </section>





      {/* ---------- PLANS (Roadmap) ---------- */}
      <RoadmapCarousel roadmapItems={roadmapItems} />
      {/* ---------- END PLANS ---------- */}



      <Parallax bgImage={bannerImg} strength={500}>
        <div className="custom-banner">
          <div className="container">
            <div className="row g-4">
              <div className="col-lg-6">
                <div className="row g-4 align-items-center">
                  <div className="col-sm-4">
                    <img
                      className="img-fluid rounded banner-img"
                      src={bannerImg1}
                      alt="Khởi Đầu"
                    />
                  </div>
                  <div className="col-sm-8">
                    <Title level={2} className="text-white mb-3">
                      Bắt Đầu Hành Trình Không Khói
                    </Title>
                    <Paragraph className="text-white mb-4">
                      Khám phá công cụ cá nhân hóa để bỏ thuốc lá, cải thiện sức khỏe và tiết kiệm chi phí.
                    </Paragraph>
                    <Button className="btn-read-more" href="#">
                      Tìm Hiểu Thêm
                    </Button>
                  </div>
                </div>
              </div>

              <div className="col-lg-6">
                <div className="row g-4 align-items-center">
                  <div className="col-sm-4">
                    <img
                      className="img-fluid rounded banner-img"
                      src={bannerImg2}
                      alt="Cộng Đồng"
                    />
                  </div>
                  <div className="col-sm-8">
                    <Title level={2} className="text-white mb-3">
                      Cộng Đồng Đồng Hành
                    </Title>
                    <Paragraph className="text-white mb-4">
                      Tham gia nhóm chia sẻ kinh nghiệm, hỗ trợ lẫn nhau và nhận huy hiệu khích lệ.
                    </Paragraph>
                    <Button className="btn-read-more" href="#">
                      Tham Gia Ngay
                    </Button>
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
            <div
              className="text-center mx-auto pb-4"
              data-aos="fade-up"
              data-aos-delay="100"
              style={{ maxWidth: "500px" }}
            >
              <p className="section-title bg-white text-center text-primary px-3">
                Các Tính Năng
              </p>
              <h1 className="mb-5">
                Những Hỗ Trợ Và Dịch Vụ Chúng Tôi Cung Cấp
              </h1>
            </div>
            <div className="row gy-5 gx-4">
              <div
                className="col-lg-4 col-md-6 pt-5"
                data-aos="fade-up"
                data-aos-delay="100"
              >
                <div className="service-item d-flex h-100">
                  <div className="service-img">
                    <img className="img-fluid" src={service1} alt="Kế hoạch" />
                  </div>
                  <div className="service-text p-5 pt-0">
                    <div className="service-icon">
                      <img
                        className="img-fluid rounded-circle"
                        src={service1}
                        alt="Kế hoạch"
                      />
                    </div>
                    <h5 className="mb-3">Kế Hoạch Cá Nhân</h5>
                    <p className="mb-4">
                      Lộ trình giảm dần liều thuốc thiết kế riêng theo mức độ nghiện.
                    </p>
                    <a className="btn btn-square rounded-circle" href="#">
                      <i className="bi bi-chevron-double-right"></i>
                    </a>
                  </div>
                </div>
              </div>
              <div
                className="col-lg-4 col-md-6 pt-5"
                data-aos="fade-up"
                data-aos-delay="300"
              >
                <div className="service-item d-flex h-100">
                  <div className="service-img">
                    <img className="img-fluid" src={service2} alt="Theo dõi" />
                  </div>
                  <div className="service-text p-5 pt-0">
                    <div className="service-icon">
                      <img
                        className="img-fluid rounded-circle"
                        src={service2}
                        alt="Theo dõi"
                      />
                    </div>
                    <h5 className="mb-3">Theo Dõi Tiến Trình</h5>
                    <p className="mb-4">
                      Biểu đồ trực quan về ngày không hút, tiền tiết kiệm và huy hiệu.
                    </p>
                    <a className="btn btn-square rounded-circle" href="#">
                      <i className="bi bi-chevron-double-right"></i>
                    </a>
                  </div>
                </div>
              </div>
              <div
                className="col-lg-4 col-md-6 pt-5"
                data-aos="fade-up"
                data-aos-delay="500"
              >
                <div className="service-item d-flex h-100">
                  <div className="service-img">
                    <img className="img-fluid" src={service3} alt="Hỗ trợ" />
                  </div>
                  <div className="service-text p-5 pt-0">
                    <div className="service-icon">
                      <img
                        className="img-fluid rounded-circle"
                        src={service3}
                        alt="Hỗ trợ"
                      />
                    </div>
                    <h5 className="mb-3">Hỗ Trợ Chuyên Gia</h5>
                    <p className="mb-4">
                      Chat trực tiếp với bác sĩ và coach để nhận tư vấn cá nhân.
                    </p>
                    <a className="btn btn-square rounded-circle" href="#">
                      <i className="bi bi-chevron-double-right"></i>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>


      <div className="quit-smoking-sections">
        {/* Methods Section */}
        <section className={`methods-section ${isVisible ? 'fade-in' : ''}`}>
          <div className="quit-smoking-sections-container">
            <div className="quit-smoking-section-header">
              <div className="quit-smoking-sections-badge">
                <Leaf className="badge-icon" />
                <span>Phương Pháp Hiệu Quả</span>
              </div>
              <h2 className="quit-smoking-sections-title">
                Chọn Phương Pháp <span className="highlight">Phù Hợp</span> Với Bạn
              </h2>
              <p className="quit-smoking-sections-subtitle">
                Mỗi người có một hành trình khác nhau. Hãy tìm phương pháp tốt nhất cho bản thân để thoát khỏi tệ nạn thuốc lá.
              </p>
            </div>

            <div className="methods-container">
              <div className="methods-tabs">
                {quitMethods.map((method, index) => (
                  <button
                    key={method.id}
                    className={`method-tab ${index === activeMethod ? 'active' : ''}`}
                    onClick={() => setActiveMethod(index)}
                    style={{ '--method-color': method.color }}
                  >
                    <div className="method-tab-icon">
                      {method.icon}
                    </div>
                    <span className="method-tab-title">{method.title}</span>
                    <div className="method-tab-duration">{method.duration}</div>
                    <div className="method-tab-rate">{method.successRate}% thành công</div>
                  </button>
                ))}
              </div>

              <div className="method-content">
                <div className="method-card">
                  <div className="method-header">
                    <div
                      className="method-icon-large"
                      style={{
                        background: `linear-gradient(135deg, ${quitMethods[activeMethod].color}20, ${quitMethods[activeMethod].color}40)`,
                        color: quitMethods[activeMethod].color
                      }}
                    >
                      {quitMethods[activeMethod].icon}
                    </div>
                    <div className="method-info">
                      <h3>{quitMethods[activeMethod].title}</h3>
                      <p>{quitMethods[activeMethod].description}</p>
                      <div className="method-badges">
                        <div className="method-badge">
                          <Clock className="badge-icon-small" />
                          {quitMethods[activeMethod].duration}
                        </div>
                        <div className="method-badge success-rate">
                          <Activity className="badge-icon-small" />
                          {quitMethods[activeMethod].successRate}% thành công
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="method-features">
                    <h4>
                      <Wind className="section-icon" />
                      Các bước thực hiện:
                    </h4>
                    <div className="features-grid">
                      {quitMethods[activeMethod].features.map((feature, idx) => (
                        <div key={idx} className="feature-item" style={{ animationDelay: `${idx * 0.1}s` }}>
                          <CheckCircle className="feature-check" />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="method-actions">
                    <button className="btn-primary">
                      <Target className="btn-icon" />
                      Bắt Đầu Phương Pháp Này
                    </button>
                    <button className="btn-secondary">
                      <BookOpen className="btn-icon" />
                      Tìm Hiểu Thêm
                    </button>
                  </div>
                </div>

                <div className="method-visual">
                  <div className="progress-circle">
                    <svg width="220" height="220" viewBox="0 0 220 220">
                      <defs>
                        <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" style={{ stopColor: quitMethods[activeMethod].color, stopOpacity: 1 }} />
                          <stop offset="100%" style={{ stopColor: quitMethods[activeMethod].color, stopOpacity: 0.6 }} />
                        </linearGradient>
                      </defs>
                      <circle
                        cx="110"
                        cy="110"
                        r="90"
                        fill="none"
                        stroke="#e0f2fe"
                        strokeWidth="12"
                      />
                      <circle
                        cx="110"
                        cy="110"
                        r="90"
                        fill="none"
                        stroke="url(#progressGradient)"
                        strokeWidth="12"
                        strokeLinecap="round"
                        strokeDasharray="565.2"
                        strokeDashoffset={565.2 - (565.2 * quitMethods[activeMethod].successRate) / 100}
                        className="progress-stroke"
                      />
                    </svg>
                    <div className="progress-content">
                      <div className="progress-number">{quitMethods[activeMethod].successRate}%</div>
                      <div className="progress-label">Tỷ lệ thành công</div>
                      <Leaf className="progress-leaf" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Success Stories Section */}
        <section className={`success-stories-section ${isVisible ? 'fade-in' : ''}`}>
          <div className="container">
            <div className="quit-smoking-sections-header">
              <div className="quit-smoking-sections-badge">
                <Star className="badge-icon" />
                <span>Câu Chuyện Thành Công</span>
              </div>
              <h2 className="quit-smoking-sections-title">
                Họ Đã <span className="highlight">Thành Công</span>, Bạn Cũng Có Thể!
              </h2>
              <p className="  subtitle">
                Những câu chuyện truyền cảm hứng từ những người đã vượt qua thử thách cai thuốc và tìm lại cuộc sống khỏe mạnh.
              </p>
            </div>

            <div className="stories-container">
              <div className="story-navigation">
                {successStories.map((_, index) => (
                  <button
                    key={index}
                    className={`story-nav-dot ${index === activeSuccess ? 'active' : ''}`}
                    onClick={() => setActiveSuccess(index)}
                  />
                ))}
              </div>

              <div className="story-card">
                <div className="story-header">
                  <div className="story-avatar">
                    <span className="avatar-emoji">{successStories[activeSuccess].avatar}</span>
                    <div className="avatar-status">
                      <CheckCircle className="success-icon" />
                    </div>
                  </div>
                  <div className="story-info">
                    <h3>{successStories[activeSuccess].name}</h3>
                    <p className="story-profession">
                      {successStories[activeSuccess].profession}, {successStories[activeSuccess].age} tuổi
                    </p>
                    <div className="story-stats">
                      <div className="stat">
                        <span className="stat-number">{successStories[activeSuccess].smokingYears}</span>
                        <span className="stat-label">năm hút thuốc</span>
                      </div>
                      <div className="stat-divider"></div>
                      <div className="stat">
                        <span className="stat-number">{successStories[activeSuccess].quitDays}</span>
                        <span className="stat-label">ngày đã cai</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="story-content">
                  <blockquote className="story-quote">
                    <span className="quote-mark">"</span>
                    {successStories[activeSuccess].story}
                    <span className="quote-mark">"</span>
                  </blockquote>

                  <div className="story-method">
                    <Target className="method-icon-small" />
                    <span>Phương pháp: <strong>{successStories[activeSuccess].method}</strong></span>
                  </div>

                  <div className="story-benefits">
                    <h4>
                      <Heart className="section-icon" />
                      Những thay đổi tích cực:
                    </h4>
                    <div className="benefits-list">
                      {successStories[activeSuccess].benefits.map((benefit, idx) => (
                        <div key={idx} className="benefit-tag" style={{ animationDelay: `${idx * 0.1}s` }}>
                          <Leaf className="benefit-icon" />
                          {benefit}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="story-actions">
                  <button className="btn-primary">
                    <MessageCircle className="btn-icon" />
                    Chia Sẻ Câu Chuyện Của Bạn
                  </button>
                  <button className="btn-secondary">
                    <Users className="btn-icon" />
                    Kết Nối Với {successStories[activeSuccess].name.split(' ')[1]}
                  </button>
                </div>
              </div>

              <div className="community-stats">
                <div className="community-card">
                  <div className="community-icon">
                    <Users className="icon" />
                  </div>
                  <div className="community-content">
                    <h4>Cộng Đồng Hỗ Trợ</h4>
                    <p>5,247 thành viên đang cùng hành trình</p>
                    <div className="community-actions">
                      <button className="join-btn">
                        <Users className="btn-icon-small" />
                        Tham Gia Ngay
                      </button>
                    </div>
                  </div>
                </div>

                <div className="achievement-showcase">
                  <h4>
                    <Award className="section-icon" />
                    Thành tích cộng đồng
                  </h4>
                  <div className="achievements-grid">
                    <div className="achievement-item">
                      <div className="achievement-icon-bg">
                        <Award className="achievement-icon" />
                      </div>
                      <div className="achievement-text">
                        <span className="achievement-number">1,234</span>
                        <span className="achievement-label">Người đã cai thành công</span>
                      </div>
                    </div>
                    <div className="achievement-item">
                      <div className="achievement-icon-bg">
                        <Gift className="achievement-icon" />
                      </div>
                      <div className="achievement-text">
                        <span className="achievement-number">50M+</span>
                        <span className="achievement-label">Đồng tiết kiệm được</span>
                      </div>
                    </div>
                    <div className="achievement-item">
                      <div className="achievement-icon-bg">
                        <Calendar className="achievement-icon" />
                      </div>
                      <div className="achievement-text">
                        <span className="achievement-number">365</span>
                        <span className="achievement-label">Ngày không hút dài nhất</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>


      {/* ---------- MEET ARTISTS (3/4 ảnh + 1/4 list) ---------- */}
      <section className="artists-section section-padding  scroll-section" data-reveal="up" id="section_3">
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



      <section className="experience-section bg-img py-5 mb-5" ref={expRef}>
        <div className="container py-5 ">
          <Row gutter={[32, 32]}>
            <Col lg={6} md={12}>
              <div className="d-flex">
                <div className="bg-primary border-inner d-flex align-items-center justify-content-center mb-3" style={{ width: "60px", height: "60px" }}>
                  <FaStar className="text-white" />
                </div>
                <div className="ps-4">
                  <h6 className="text-primary text-uppercase">Our Experience</h6>
                  <h1 className="display-5 text-white mb-0">
                    {inViewExp && <CountUp start={0} end={123456} duration={5} />}
                  </h1>
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
                  <h1 className="display-5 text-white mb-0">
                    {inViewExp && <CountUp start={0} end={123456} duration={5} />}
                  </h1>
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
                  <h1 className="display-5 text-white mb-0">
                    {inViewExp && <CountUp start={0} end={123456} duration={5} />}
                  </h1>
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
                  <h1 className="display-5 text-white mb-0">
                    {inViewExp && <CountUp start={0} end={123456} duration={5} />}
                  </h1>
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
