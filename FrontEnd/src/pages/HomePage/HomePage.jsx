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
  Carousel,
  Badge,
  Layout,
  Tooltip,
  Modal,
  Divider,
  Timeline,

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
  HeartOutlined,
  CalendarOutlined,
  MessageOutlined,
  BookOutlined,
  TrophyOutlined,
  CloseOutlined,
  CheckCircleOutlined,
  StarOutlined,
  UserOutlined,
  BulbOutlined,
  SafetyOutlined,
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

import RankingSection from "../../components/RankingSection";

import bg2 from "../../assets/img/carousel-bg-2.jpg";
import car1 from "../../assets/img/carousel-1.jpeg";
import car2 from "../../assets/img/carousel-2.png";
import testi1 from "../../assets/img/anh1.jpg";
import testi2 from "../../assets/img/anh5.jpg";
import testi3 from "../../assets/img/anh2.jpg";
import testi4 from "../../assets/img/anh3.jpg";
import quitSupportImg from "../../assets/img/smokingsupport.jpg";
import therapySessionImg from "../../assets/img/theory.jpg";
import breathingImg from "../../assets/img/thien.jpg";

/* ---------- ASSETS CHO 2 KHỐI MỚI ---------- */
import about1 from "../../assets/img/quit-smoking-illustration_23-2148683677.jpg";
import about2 from "../../assets/img/OIP.jpg";
import about3 from "../../assets/img/OIP_2.jpg";
import bannerImg1 from '../../assets/img/banner-1.jpg';
import bannerImg2 from '../../assets/img/banner-2.jpg';
import banner4 from '../../assets/img/banner4.jpeg';
import service1 from '../../assets/img/mau-lap-ke-hoach-cong-viec-ca-nhan-7-.png';
import service1_2 from '../../assets/img/phan-mem-lap-ke-hoach-ca-nhan_1.jpg';
import service2 from '../../assets/img/theodoitientrinh2.jpg';
import service2_2 from '../../assets/img/theodoitientrinh.jpg';
import service3 from '../../assets/img/hotrochuyengia.png';
import service3_2 from '../../assets/img/hotrochuyengiabanner.png';
import { Parallax } from 'react-parallax';
import { FaStar, FaUsers, FaCheck, FaMugHot } from "react-icons/fa";

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
    video: videoList[0],
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
const testimonials = [
  {
    date: "12 Tháng 3",
    img: testi1,
    name: "Nguyễn Minh Tú",
    job: "Giáo viên Tiểu học",
    text: "Tôi đã hút thuốc hơn 15 năm. Nhờ sự hỗ trợ từ chuyên gia tại BookCoach, tôi đã bỏ thuốc được 6 tháng và cảm thấy khỏe mạnh hơn bao giờ hết.",
  },
  {
    date: "25 Tháng 4",
    img: testi2,
    name: "Lê Quang Huy",
    job: "Nhân viên văn phòng",
    text: "Không ngờ mình có thể từ bỏ thuốc nhờ những buổi tư vấn tâm lý kết hợp thiền và thở. Chương trình thật sự hiệu quả và rất dễ tiếp cận.",
  },
  {
    date: "08 Tháng 5",
    img: testi3,
    name: "Trần Hồng Nhung",
    job: "Nhà thiết kế",
    text: "Tôi từng thử nhiều cách để bỏ thuốc nhưng thất bại. Nhờ có người đồng hành và theo sát tiến trình, lần này tôi đã làm được!",
  },
  {
    date: "20 Tháng 6",
    img: testi4,
    name: "Phạm Tuấn Kiệt",
    job: "Sinh viên Đại học",
    text: "Sau 3 tuần tham gia chương trình, tôi đã giảm đáng kể số lượng thuốc hút mỗi ngày. Tôi cảm thấy bản thân kiểm soát được cơn thèm thuốc.",
  },
];

const counters = [
  { icon: FaClock, num: 7, label: "Ngày Không Hút Trở Lại" },
  { icon: FaSkullCrossbones, num: 0, label: "Mức Độc Tố" },
  { icon: FaMoneyBillWave, num: 10000000, label: "Tiết Kiệm (₫)" },
  { icon: FaAward, num: 30, label: "Huy Hiệu và Thành Tựu Để Đạt Được" }
];

const expertQualifications = [
  "Chuyên gia được đào tạo trong lĩnh vực cai nghiện thuốc lá và tâm lý hành vi",
  "Hơn 5 năm kinh nghiệm tư vấn bỏ thuốc thành công cho nhiều nhóm đối tượng",
  "Thành thạo các liệu pháp hành vi nhận thức (CBT), thư giãn, và hỗ trợ tinh thần",
  "Có chứng chỉ hỗ trợ điều trị nghiện từ các tổ chức y tế uy tín",
  "Cam kết đồng hành 1:1 và xây dựng lộ trình bỏ thuốc cá nhân hóa",
  "Thường xuyên cập nhật các phương pháp và công nghệ mới trong hỗ trợ cai nghiện",
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
const quitMethods = [
  {
    id: 'gradual',
    title: 'Giảm Dần Từng Bước',
    icon: <TrendingUp className="method-icon" />,
    description: 'Phương pháp khoa học giảm dần số điếu thuốc mỗi ngày',
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
const modalFeatures = [
  {
    icon: <HeartOutlined style={{ fontSize: 24, color: '#ff4d4f' }} />,
    title: 'Cai Nghiện Thuốc Lá',
    subtitle: 'Phương pháp khoa học',
    description: 'Hệ thống hỗ trợ cai nghiện toàn diện với các phương pháp được chứng minh hiệu quả, từ giảm dần đến dừng ngay lập tức, phù hợp với mọi mức độ nghiện.',
    highlights: [
      'Theo dõi tiến trình cai nghiện từng ngày',
      'Phương pháp cá nhân hóa theo mức độ nghiện',
      'Hỗ trợ vượt qua cơn thèm thuốc',
      'Thống kê sức khỏe được cải thiện'
    ]
  },
  {
    icon: <CalendarOutlined style={{ fontSize: 24, color: '#52c41a' }} />,
    title: 'Kế Hoạch Cá Nhân Hóa',
    subtitle: 'Thiết kế riêng cho bạn',
    description: 'Mỗi người có một hành trình cai nghiện khác nhau. Chúng tôi tạo ra kế hoạch riêng biệt dựa trên thói quen, mức độ nghiện và mục tiêu cá nhân của bạn.',
    highlights: [
      'Đánh giá mức độ nghiện ban đầu',
      'Lên lịch giảm thuốc theo tuần',
      'Đề xuất hoạt động thay thế',
      'Điều chỉnh kế hoạch linh hoạt'
    ]
  },
  {
    icon: <BookOutlined style={{ fontSize: 24, color: '#1890ff' }} />,
    title: 'Book Coach - Tư Vấn Chuyên Gia',
    subtitle: 'Đồng hành 1:1',
    description: 'Đặt lịch tư vấn trực tiếp với các chuyên gia tâm lý và bác sĩ có kinh nghiệm trong lĩnh vực cai nghiện thuốc lá, nhận được lời khuyên cá nhân hóa.',
    highlights: [
      'Chuyên gia có chứng chỉ quốc tế',
      'Tư vấn online hoặc offline',
      'Theo dõi tiến trình định kỳ',
      'Hỗ trợ tâm lý khi gặp khó khăn'
    ]
  },
  {
    icon: <MessageOutlined style={{ fontSize: 24, color: '#722ed1' }} />,
    title: 'Trò Chuyện Cộng Đồng',
    subtitle: 'Kết nối & chia sẻ',
    description: 'Tham gia cộng đồng hàng nghìn người đang cùng hành trình bỏ thuốc. Chia sẻ kinh nghiệm, nhận động lực và hỗ trợ lẫn nhau mỗi ngày.',
    highlights: [
      'Forum thảo luận theo chủ đề',
      'Nhóm chat theo khu vực',
      'Chia sẻ thành công & thất bại',
      'Tìm bạn đồng hành cùng mục tiêu'
    ]
  }
];

const successSteps = [
  { title: 'Đánh giá ban đầu', description: 'Xác định mức độ nghiện và động lực', status: 'finish' },
  { title: 'Tạo kế hoạch', description: 'Lên lịch cai nghiện cá nhân hóa', status: 'finish' },
  { title: 'Bắt đầu hành trình', description: 'Thực hiện kế hoạch với sự hỗ trợ', status: 'process' },
  { title: 'Theo dõi tiến trình', description: 'Ghi nhận thành tựu từng ngày', status: 'wait' },
  { title: 'Thành công', description: 'Hoàn thành mục tiêu bỏ thuốc', status: 'wait' }
];

/* ===== TRANG CHÍNH ===== */
const HomePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
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
      { threshold: 0.5 }
    );
    const expObserver = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setInViewExp(true);
      },
      { threshold: 0.5 }
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
  const [showFeatureModal, setShowFeatureModal] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);
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
                  <h1>{inViewAbout && <CountUp start={0} end={5} duration={10} />}</h1>
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
              <Paragraph>  Với hơn 5 năm đồng hành cùng hàng ngàn người, chúng tôi cung cấp
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

              <Button
                size="large"
                type="primary"
                className="mt-4 rounded-pill"
                onClick={() => setShowFeatureModal(true)}
                style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  border: 'none',
                  padding: '8px 32px',
                  height: 'auto',
                  fontSize: '16px',
                  fontWeight: '600'
                }}
              >
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



      <Parallax bgImage={banner4} strength={500}>
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
                    <img className="img-fluid" src={service1_2} alt="Kế hoạch" />
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
                    <img className="img-fluid" src={service2_2} alt="Theo dõi" />
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
                    <img className="img-fluid" src={service3_2} alt="Hỗ trợ" />
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
        <section className="methods-section">
          <div className={`methods-section-inner ${isVisible ? 'fade-in' : ''}`}>
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

      <section className="experience-section bg-img py-5 mb-5" ref={expRef}>
        <div className="experience-container container py-5">
          <Row gutter={[32, 32]}>
            <Col lg={6} md={12}>
              <div className="stat-item">
                <div className="stat-icon">
                  <FaStar />
                </div>
                <div className="stat-content">
                  <h6 className="stat-label">Buổi tư vấn đã thực hiện</h6>
                  <h1 className="stat-number">
                    {inViewExp && <CountUp start={0} end={3820} duration={4} />}
                  </h1>
                </div>
              </div>
            </Col>

            <Col lg={6} md={12}>
              <div className="stat-item">
                <div className="stat-icon">
                  <FaUsers />
                </div>
                <div className="stat-content">
                  <h6 className="stat-label">Coach chuyên môn</h6>
                  <h1 className="stat-number">
                    {inViewExp && <CountUp start={0} end={128} duration={4} />}
                  </h1>
                </div>
              </div>
            </Col>

            <Col lg={6} md={12}>
              <div className="stat-item">
                <div className="stat-icon">
                  <FaCheck />
                </div>
                <div className="stat-content">
                  <h6 className="stat-label">Nâng cấp Premium thành công</h6>
                  <h1 className="stat-number">
                    {inViewExp && <CountUp start={0} end={964} duration={4} />}
                  </h1>
                </div>
              </div>
            </Col>

            <Col lg={6} md={12}>
              <div className="stat-item">
                <div className="stat-icon">
                  <FaMugHot />
                </div>
                <div className="stat-content">
                  <h6 className="stat-label">Khách hàng hài lòng</h6>
                  <h1 className="stat-number">
                    {inViewExp && <CountUp start={0} end={1472} duration={4} />}
                  </h1>
                </div>
              </div>
            </Col>
          </Row>
        </div>
      </section>


      {/* ---------- MEET COACHES ---------- */}
      <section className="artists-section section-padding scroll-section" data-reveal="up" id="section_3">
        <div className="container">

          {/* Row A: Title */}
          <div className="row justify-content-center">
            <div className="text-center mx-auto" data-aos="fade-up" data-aos-delay="100" style={{ maxWidth: "500px" }}>
              <h2 className="section-title bg-white text-center text-primary px-3">Gặp các huán luyện viên tiêu biểu</h2>
            </div>
          </div>

          {/* Row B: 3/4 ảnh & 1/4 list */}
          <div className="row gx-4 gy-4 align-items-start">

            {/* —— 3/4 ảnh —— */}
            <div className="col-lg-9 col-12">
              <div className="row g-4">

                {/* Coach 1 - lớn */}
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
                      <p><strong>Tên:</strong> Lê Gia Thịnh</p>
                      <p><strong>Kinh nghiệm:</strong> 7 năm đồng hành cùng người bỏ thuốc</p>
                      <p><strong>Chuyên môn:</strong> Tư vấn tâm lý, thiền & kiểm soát cảm xúc</p>
                      <hr />
                      <p className="mb-0"><strong>Phương châm:</strong> "Cai thuốc là thay đổi cuộc sống"</p>
                    </div>
                  </div>
                </div>

                {/* Coach 2 & 3 - nhỏ */}
                <div className="col-lg-5 col-12 d-flex flex-column">
                  {/* Coach 2 */}
                  <div className="artists-thumb mb-4">
                    <div className="artists-image-wrap">
                      <img
                        src="assets/images/artists/abstral-official-bdlMO9z5yco-unsplash.jpg"
                        alt="Rihana"
                        className="artists-image img-fluid"
                      />
                    </div>
                    <div className="artists-hover">
                      <p><strong>Tên:</strong> Nghiêm Tuân Anh</p>
                      <p><strong>Kinh nghiệm:</strong> 5 năm hỗ trợ trị liệu hành vi</p>
                      <p><strong>Chuyên môn:</strong> CBT, quản lý stress, kỹ thuật thư giãn</p>
                      <hr />
                      <p className="mb-0"><strong>Phương châm:</strong> "Kiên trì là chìa khóa thành công"</p>
                    </div>
                  </div>

                  {/* Coach 3 */}
                  <div className="artists-thumb">
                    <div className="artists-image-wrap">
                      <img
                        src="assets/images/artists/soundtrap-rAT6FJ6wltE-unsplash.jpg"
                        alt="Bruno Bros"
                        className="artists-image img-fluid"
                      />
                    </div>
                    <div className="artists-hover">
                      <p><strong>Tên:</strong> Nguyễn Quốc Bảo</p>
                      <p><strong>Kinh nghiệm:</strong> 8 năm đào tạo & hướng dẫn bỏ thuốc</p>
                      <p><strong>Chuyên môn:</strong> Coaching 1:1, động lực cá nhân hóa</p>
                      <hr />
                      <p className="mb-0"><strong>Phương châm:</strong> "Bạn xứng đáng với một cuộc sống không khói thuốc"</p>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* —— 1/4 list —— */}
            <div className="col-lg-3 col-12">
              <ul className="custom-list h-100 d-flex flex-column justify-content-evenly">
                <li><i className="bi bi-check-circle-fill me-2"></i> Thân thiện và luôn lắng nghe</li>
                <li><i className="bi bi-check-circle-fill me-2"></i> Kỹ năng tư vấn tâm lý vững vàng</li>
                <li><i className="bi bi-check-circle-fill me-2"></i> Hiểu rõ hành vi nghiện</li>
                <li><i className="bi bi-check-circle-fill me-2"></i> Hỗ trợ từng bước tiến bộ</li>
                <li><i className="bi bi-check-circle-fill me-2"></i> Luôn đồng hành 1:1</li>
                <li><i className="bi bi-check-circle-fill me-2"></i> Được cấp chứng chỉ chuyên môn</li>
                <li><i className="bi bi-check-circle-fill me-2"></i> Cam kết bảo mật & tôn trọng</li>
              </ul>
            </div>

          </div>
        </div>
      </section>
      {/* ---------- PROFILE ---------- */}
      <section className="profile-section scroll-section" data-reveal="up">
        <div className="container">
          <div className="profile-header">
            <Badge.Ribbon text="Đồng hành cùng hành trình bỏ thuốc" color="green">
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
                <Paragraph className="profile-p">
                  Chúng tôi tự hào mang đến đội ngũ chuyên gia tâm lý, huấn luyện viên hành vi và cố vấn sức khỏe chuyên sâu
                  trong lĩnh vực hỗ trợ cai nghiện thuốc lá. Với sự thấu hiểu và đồng hành sát sao, họ sẽ giúp bạn vượt qua
                  cơn thèm thuốc, kiểm soát cảm xúc và từng bước xây dựng một cuộc sống lành mạnh, không khói thuốc.
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
                {[quitSupportImg, therapySessionImg, breathingImg].map((img, i) => (
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
            <div
              className="text-center mx-auto"
              data-aos="fade-up"
              data-aos-delay="100"
              style={{ maxWidth: "500px" }}
            >
              <h6 className="section-title bg-white text-center text-primary px-3">
                Câu chuyện thành công
              </h6>
              <h1 className="mb-5">Người thật – Trải nghiệm thật</h1>
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
                  <Badge.Ribbon text={t.date} color="red" placement="end" />
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



      <RankingSection />
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



      {/* Feature Introduction Modal */}
      <Modal
        visible={showFeatureModal}
        onCancel={() => setShowFeatureModal(false)}
        footer={null}
        width={1000}
        centered
        closeIcon={<CloseOutlined style={{ fontSize: 18, color: '#fff' }} />}
        styles={{
          header: {
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '8px 8px 0 0',
            padding: '20px 24px'
          },
          body: {
            padding: 0,
            background: '#f8fafc'
          }
        }}
        title={
          <div style={{ color: '#fff', textAlign: 'center' }}>
            <Title level={2} style={{ color: '#fff', margin: 0, fontSize: '28px' }}>
              🚭 Khám Phá Hệ Thống Hỗ Trợ Bỏ Thuốc Toàn Diện
            </Title>
            <Text style={{ color: '#e6f7ff', fontSize: '16px' }}>
              Hành trình khỏe mạnh bắt đầu từ những bước đi đầu tiên
            </Text>
          </div>
        }
      >
        <div style={{ padding: '24px' }}>
          {/* Hero Section */}
          <div style={{
            textAlign: 'center',
            marginBottom: '32px',
            padding: '24px',
            background: 'linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%)',
            borderRadius: '12px'
          }}>
            <Title level={3} style={{ color: '#1565c0', marginBottom: '16px' }}>
              Tại sao chọn hệ thống của chúng tôi?
            </Title>
            <Paragraph style={{ fontSize: '16px', color: '#37474f', maxWidth: '800px', margin: '0 auto' }}>
              Với hơn <strong>5 năm kinh nghiệm</strong> và <strong>hàng nghìn người thành công</strong> bỏ thuốc,
              chúng tôi đã phát triển một hệ sinh thái hoàn chỉnh để đồng hành cùng bạn từ những ngày đầu khó khăn
              cho đến khi hoàn toàn tự do khỏi thuốc lá.
            </Paragraph>

            <Row gutter={[16, 16]} style={{ marginTop: '20px' }} justify="center">
              <Col>
                <Badge count="5+" style={{ backgroundColor: '#52c41a' }}>
                  <div style={{ padding: '8px 16px', background: '#fff', borderRadius: '8px', minWidth: '80px' }}>
                    <Text strong>Năm kinh nghiệm</Text>
                  </div>
                </Badge>
              </Col>
              <Col>
                <Badge count="1000+" style={{ backgroundColor: '#1890ff' }}>
                  <div style={{ padding: '8px 16px', background: '#fff', borderRadius: '8px', minWidth: '80px' }}>
                    <Text strong>Người thành công</Text>
                  </div>
                </Badge>
              </Col>
              <Col>
                <Badge count="95%" style={{ backgroundColor: '#722ed1' }}>
                  <div style={{ padding: '8px 16px', background: '#fff', borderRadius: '8px', minWidth: '80px' }}>
                    <Text strong>Tỷ lệ thành công</Text>
                  </div>
                </Badge>
              </Col>
            </Row>
          </div>

          {/* Features Grid */}
          <Row gutter={[24, 24]} style={{ marginBottom: '32px' }}>
            {modalFeatures.map((feature, index) => (
              <Col xs={24} md={12} key={index}>
                <Card
                  hoverable
                  style={{
                    height: '100%',
                    border: activeFeature === index ? '2px solid #1890ff' : '1px solid #e8e8e8',
                    borderRadius: '12px',
                    background: activeFeature === index ? '#f6ffed' : '#fff',
                    transition: 'all 0.3s ease',
                    cursor: 'pointer'
                  }}
                  onClick={() => setActiveFeature(index)}
                  
                  bodyStyle={{ padding: 0, background: '#f8fafc' }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                    <div style={{
                      padding: '12px',
                      background: activeFeature === index ? '#fff' : '#f5f5f5',
                      borderRadius: '8px',
                      flexShrink: 0
                    }}>
                      {feature.icon}
                    </div>
                    <div style={{ flex: 1 }}>
                      <Title level={4} style={{ margin: '0 0 4px 0', color: '#262626' }}>
                        {feature.title}
                      </Title>
                      <Text type="secondary" style={{ fontSize: '14px' }}>
                        {feature.subtitle}
                      </Text>
                      <Paragraph style={{
                        margin: '12px 0 16px 0',
                        fontSize: '14px',
                        color: '#595959'
                      }}>
                        {feature.description}
                      </Paragraph>
                      <div>
                        {feature.highlights.map((highlight, idx) => (
                          <div key={idx} style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            marginBottom: '6px'
                          }}>
                            <CheckCircleOutlined style={{ color: '#52c41a', fontSize: '12px' }} />
                            <Text style={{ fontSize: '13px', color: '#666' }}>
                              {highlight}
                            </Text>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>

          <Divider style={{ margin: '32px 0' }} />

          {/* Process Timeline */}
          <div style={{
            padding: '24px',
            background: '#fff',
            borderRadius: '12px',
            border: '1px solid #e8e8e8'
          }}>
            <Title level={4} style={{ textAlign: 'center', marginBottom: '24px', color: '#1565c0' }}>
              <TrophyOutlined style={{ marginRight: '8px', color: '#faad14' }} />
              Hành Trình Thành Công Của Bạn
            </Title>
            <Timeline
              items={successSteps.map((step, index) => ({
                color: step.status === 'finish' ? '#52c41a' :
                  step.status === 'process' ? '#1890ff' : '#d9d9d9',
                children: (
                  <div>
                    <Text strong style={{ fontSize: '16px' }}>{step.title}</Text>
                    <br />
                    <Text type="secondary">{step.description}</Text>
                  </div>
                )
              }))}
              style={{ paddingLeft: '24px' }}
            />
          </div>

          {/* Call to Action */}
          <div style={{
            textAlign: 'center',
            marginTop: '24px',
            padding: '24px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '12px',
            color: '#fff'
          }}>
            <Title level={3} style={{ color: '#fff', marginBottom: '12px' }}>
              Sẵn sàng bắt đầu hành trình thay đổi cuộc đời?
            </Title>
            <Paragraph style={{ color: '#e6f7ff', fontSize: '16px', marginBottom: '20px' }}>
              Hàng nghìn người đã thành công - Bạn cũng có thể làm được!
            </Paragraph>
            <Space size="middle">
              <Button
                type="primary"
                size="large"
                style={{
                  background: '#fff',
                  color: '#667eea',
                  border: 'none',
                  fontWeight: '600'
                }}
                onClick={() => {
                  setShowFeatureModal(false);
                  // Navigate to sign up or start journey page
                }}
              >
                Bắt Đầu Ngay
              </Button>
              <Button
                size="large"
                style={{
                  background: 'transparent',
                  color: '#fff',
                  borderColor: '#fff'
                }}
                onClick={() => {
                  setShowFeatureModal(false);
                  // Navigate to consultation page
                }}
              >
                Tư Vấn Miễn Phí
              </Button>
            </Space>
          </div>
        </div>
      </Modal>
    </Layout>
  );
};

export default HomePage;
