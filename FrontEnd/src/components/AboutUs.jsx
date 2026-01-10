import React, { useState, useEffect } from 'react';
import { ArrowLeft, Heart, Users, Award, Target, Clock, Shield, Star, CheckCircle, Calendar, Phone, Mail, MapPin } from 'lucide-react';
import './AboutUs.css';

const AboutUs = ({ onBack }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [activeTab, setActiveTab] = useState('story');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Scroll to top when component mounts
        window.scrollTo({ top: 0, behavior: 'smooth' });

        // Simulate loading and then show content
        const timer = setTimeout(() => {
            setIsLoading(false);
            setIsVisible(true);
        }, 300);

        return () => clearTimeout(timer);
    }, []);

    const stats = [
        { icon: <Users className="about-stats-icon" />, number: "5000+", label: "Người đã bỏ thuốc thành công" },
        { icon: <Clock className="about-stats-icon" />, number: "5", label: "Năm kinh nghiệm hỗ trợ" },
        { icon: <Award className="about-stats-icon" />, number: "95%", label: "Tỷ lệ thành công" },
        { icon: <Heart className="about-stats-icon" />, number: "24/7", label: "Hỗ trợ không ngừng nghỉ" }
    ];

    const team = [
        {
            name: "Dr. Nguyễn Văn Minh",
            role: "Chuyên gia Tâm lý",
            experience: "15 năm kinh nghiệm",
            image: "👨‍⚕️",
            specialties: ["Tâm lý hành vi", "Cai nghiện", "CBT Therapy"]
        },
        {
            name: "Dr. Trần Thị Hoa",
            role: "Bác sĩ Nội khoa",
            experience: "12 năm kinh nghiệm",
            image: "👩‍⚕️",
            specialties: ["Hô hấp", "Tim mạch", "Điều trị nghiện"]
        },
        {
            name: "Lê Quang Đức",
            role: "Huấn luyện viên cai nghiện",
            experience: "8 năm kinh nghiệm",
            image: "👨‍🏫",
            specialties: ["Coaching", "Động lực", "Hỗ trợ nhóm"]
        }
    ];

    const milestones = [
        { year: "2019", title: "Thành lập", desc: "Khởi đầu với sứ mệnh hỗ trợ cai nghiện thuốc lá" },
        { year: "2020", title: "1000 người đầu tiên", desc: "Đạt mốc 1000 người bỏ thuốc thành công" },
        { year: "2021", title: "Mở rộng dịch vụ", desc: "Ra mắt tư vấn online và ứng dụng di động" },
        { year: "2022", title: "Công nhận quốc tế", desc: "Nhận chứng nhận từ Tổ chức Y tế Thế giới" },
        { year: "2023", title: "Cộng đồng 5000+", desc: "Xây dựng cộng đồng hỗ trợ lớn nhất Việt Nam" },
        { year: "2024", title: "Công nghệ AI", desc: "Tích hợp AI để cá nhân hóa trải nghiệm" }
    ];

    const services = [
        {
            icon: <Target className="about-service-icon" />,
            title: "Kế hoạch cá nhân hóa",
            description: "Đánh giá tình trạng và tạo lộ trình riêng cho từng người",
            features: ["Đánh giá mức độ nghiện", "Lên kế hoạch theo tuần", "Theo dõi tiến trình", "Điều chỉnh linh hoạt"]
        },
        {
            icon: <Users className="about-service-icon" />,
            title: "Tư vấn chuyên gia",
            description: "Đội ngũ bác sĩ và chuyên gia tâm lý giàu kinh nghiệm",
            features: ["Tư vấn 1:1", "Nhóm hỗ trợ", "Theo dõi định kỳ", "Hỗ trợ khẩn cấp"]
        },
        {
            icon: <Shield className="about-service-icon" />,
            title: "Cộng đồng hỗ trợ",
            description: "Kết nối với những người cùng hành trình bỏ thuốc",
            features: ["Forum thảo luận", "Nhóm chat", "Sự kiện định kỳ", "Chia sẻ kinh nghiệm"]
        },
        {
            icon: <Calendar className="about-service-icon" />,
            title: "Theo dõi sức khỏe",
            description: "Ghi nhận sự cải thiện sức khỏe sau khi bỏ thuốc",
            features: ["Đo lường tiến bộ", "Báo cáo sức khỏe", "Thống kê tiết kiệm", "Huy hiệu thành tựu"]
        }
    ];

    const handleBackClick = () => {
        // Smooth scroll to top before navigation
        window.scrollTo({ top: 0, behavior: 'smooth' });

        // Delay navigation to allow scroll animation
        setTimeout(() => {
            // Navigate back to homepage
            window.location.href = '/';
            // Fallback if onBack is provided
            if (onBack) {
                onBack();
            }
        }, 300);
    };

    return (
        <div className={`about-container ${isVisible ? 'about-visible' : ''}`}>
            {/* Loading overlay */}
            {isLoading && (
                <div className="about-loading-overlay">
                    <div className="about-loading-spinner"></div>
                    <p className="about-loading-text">Đang tải...</p>
                </div>
            )}
            {/* Header with Back Button */}
            <div className="about-header">
                <div className="about-header-content">
                    <button
                        onClick={handleBackClick}
                        className="about-back-button"
                    >
                        <ArrowLeft className="about-back-icon" />
                        <span className="about-back-text">Quay lại</span>
                    </button>
                    <div className="about-header-title">
                        <h1 className="about-main-title">Về Chúng Tôi</h1>
                        <p className="about-subtitle">BookCoach - Đồng hành cùng bạn bỏ thuốc</p>
                    </div>
                    <div className="about-header-spacer"></div>
                </div>
            </div>

            {/* Hero Section */}
            <section className="about-hero">
                <div className="about-hero-overlay"></div>
                <div className="about-hero-content">
                    <div className="about-hero-text">
                        <h2 className="about-hero-title">
                            Sứ Mệnh Của <span className="about-hero-highlight">Chúng Tôi</span>
                        </h2>
                        <p className="about-hero-description">
                            Giúp mỗi người Việt Nam có cơ hội bỏ thuốc lá một cách khoa học, hiệu quả và bền vững,
                            hướng tới một cuộc sống khỏe mạnh và hạnh phúc hơn.
                        </p>
                        <div className="about-hero-icons">
                            <div className="about-hero-icon-item">
                                <Heart className="about-hero-icon heart" />
                            </div>
                            <div className="about-hero-icon-item">
                                <Users className="about-hero-icon users" />
                            </div>
                            <div className="about-hero-icon-item">
                                <Shield className="about-hero-icon shield" />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="about-stats-section">
                <div className="about-stats-container">
                    <div className="about-stats-grid">
                        {stats.map((stat, index) => (
                            <div key={index} className="about-stats-item">
                                <div className="about-stats-icon-container">
                                    {stat.icon}
                                </div>
                                <h3 className="about-stats-number">{stat.number}</h3>
                                <p className="about-stats-label">{stat.label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Navigation Tabs */}
            <section className="about-tabs-section">
                <div className="about-tabs-container">
                    <div className="about-tabs-wrapper">
                        {[
                            { key: 'story', label: 'Câu Chuyện', icon: <Heart className="about-tab-icon" /> },
                            { key: 'team', label: 'Đội Ngũ', icon: <Users className="about-tab-icon" /> },
                            { key: 'services', label: 'Dịch Vụ', icon: <Target className="about-tab-icon" /> },
                            { key: 'timeline', label: 'Hành Trình', icon: <Clock className="about-tab-icon" /> }
                        ].map((tab) => (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                className={`about-tab-button ${activeTab === tab.key ? 'about-tab-active' : ''}`}
                            >
                                {tab.icon}
                                <span className="about-tab-label">{tab.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </section>

            {/* Content Sections */}
            <section className="about-content-section">
                <div className="about-content-container">
                    {/* Story Tab */}
                    {activeTab === 'story' && (
                        <div className="about-tab-content about-fade-in">
                            <div className="about-section-header">
                                <h3 className="about-section-title">Câu Chuyện Của Chúng Tôi</h3>
                                <p className="about-section-description">
                                    BookCoach ra đời từ khát vọng giúp đỡ những người muốn bỏ thuốc lá nhưng không biết bắt đầu từ đâu.
                                </p>
                            </div>

                            <div className="about-story-grid">
                                <div className="about-story-text">
                                    <h4 className="about-story-subtitle">Khởi Nguồn Ý Tưởng</h4>
                                    <div className="about-story-content">
                                        <p className="about-story-paragraph">
                                            Năm 2019, khi chứng kiến những người thân yêu gặp khó khăn trong việc bỏ thuốc lá,
                                            chúng tôi nhận ra rằng cần có một hệ thống hỗ trợ toàn diện và khoa học.
                                        </p>
                                        <p className="about-story-paragraph">
                                            Thay vì chỉ dựa vào ý chí cá nhân, chúng tôi tin rằng việc kết hợp giữa khoa học,
                                            công nghệ và sự hỗ trợ từ cộng đồng sẽ mang lại hiệu quả cao hơn.
                                        </p>
                                        <div className="about-story-features">
                                            <div className="about-story-feature">
                                                <CheckCircle className="about-story-check" />
                                                <span>Phương pháp khoa học được chứng minh</span>
                                            </div>
                                            <div className="about-story-feature">
                                                <CheckCircle className="about-story-check" />
                                                <span>Hỗ trợ 24/7 từ chuyên gia</span>
                                            </div>
                                            <div className="about-story-feature">
                                                <CheckCircle className="about-story-check" />
                                                <span>Cộng đồng chia sẻ và động viên</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="about-vision-card">
                                    <div className="about-vision-content">
                                        <div className="about-vision-icon">
                                            <Heart className="about-vision-heart" />
                                        </div>
                                        <h5 className="about-vision-title">Tầm Nhìn 2030</h5>
                                        <p className="about-vision-text">
                                            Trở thành nền tảng hỗ trợ cai nghiện thuốc lá hàng đầu Đông Nam Á,
                                            giúp 100,000 người bỏ thuốc thành công.
                                        </p>
                                        <div className="about-vision-stat">
                                            <div className="about-vision-number">100,000+</div>
                                            <div className="about-vision-label">Mục tiêu người được hỗ trợ</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Team Tab */}
                    {activeTab === 'team' && (
                        <div className="about-tab-content about-fade-in">
                            <div className="about-section-header">
                                <h3 className="about-section-title">Đội Ngũ Chuyên Gia</h3>
                                <p className="about-section-description">
                                    Những chuyên gia tâm lý, bác sĩ và huấn luyện viên giàu kinh nghiệm sẽ đồng hành cùng bạn.
                                </p>
                            </div>

                            <div className="about-team-grid">
                                {team.map((member, index) => (
                                    <div key={index} className="about-team-card">
                                        <div className="about-team-avatar">{member.image}</div>
                                        <h4 className="about-team-name">{member.name}</h4>
                                        <p className="about-team-role">{member.role}</p>
                                        <p className="about-team-experience">{member.experience}</p>
                                        <div className="about-team-specialties">
                                            {member.specialties.map((specialty, idx) => (
                                                <div key={idx} className="about-team-specialty">
                                                    {specialty}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Services Tab */}
                    {activeTab === 'services' && (
                        <div className="about-tab-content about-fade-in">
                            <div className="about-section-header">
                                <h3 className="about-section-title">Dịch Vụ Của Chúng Tôi</h3>
                                <p className="about-section-description">
                                    Hệ thống dịch vụ toàn diện từ tư vấn cá nhân đến hỗ trợ cộng đồng.
                                </p>
                            </div>

                            <div className="about-services-grid">
                                {services.map((service, index) => (
                                    <div key={index} className="about-service-card">
                                        <div className="about-service-header">
                                            <div className="about-service-icon-wrapper">
                                                {service.icon}
                                            </div>
                                            <div className="about-service-info">
                                                <h4 className="about-service-title">{service.title}</h4>
                                                <p className="about-service-description">{service.description}</p>
                                            </div>
                                        </div>
                                        <div className="about-service-features">
                                            {service.features.map((feature, idx) => (
                                                <div key={idx} className="about-service-feature">
                                                    <div className="about-service-check">
                                                        <CheckCircle className="about-service-check-icon" />
                                                    </div>
                                                    <span className="about-service-feature-text">{feature}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Timeline Tab */}
                    {activeTab === 'timeline' && (
                        <div className="about-tab-content about-fade-in">
                            <div className="about-section-header">
                                <h3 className="about-section-title">Hành Trình Phát Triển</h3>
                                <p className="about-section-description">
                                    Từ ý tưởng ban đầu đến việc trở thành nền tảng hỗ trợ cai nghiện hàng đầu.
                                </p>
                            </div>

                            <div className="about-timeline">
                                <div className="about-timeline-line"></div>

                                <div className="about-timeline-items">
                                    {milestones.map((milestone, index) => (
                                        <div key={index} className={`about-timeline-item ${index % 2 === 0 ? 'about-timeline-left' : 'about-timeline-right'}`}>
                                            <div className="about-timeline-content">
                                                <div className="about-milestone-card">
                                                    <div className="about-milestone-year">{milestone.year}</div>
                                                    <h4 className="about-milestone-title">{milestone.title}</h4>
                                                    <p className="about-milestone-description">{milestone.desc}</p>
                                                </div>
                                            </div>

                                            <div className="about-timeline-dot"></div>
                                            <div className="about-timeline-spacer"></div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </section>

            {/* Contact Section */}
            <section className="about-contact-section">
                <div className="about-contact-container">
                    <h3 className="about-contact-title">Liên Hệ Với Chúng Tôi</h3>
                    <div className="about-contact-grid">
                        <div className="about-contact-item">
                            <Phone className="about-contact-icon" />
                            <h4 className="about-contact-label">Hotline</h4>
                            <p className="about-contact-value">1900-1234</p>
                        </div>
                        <div className="about-contact-item">
                            <Mail className="about-contact-icon" />
                            <h4 className="about-contact-label">Email</h4>
                            <p className="about-contact-value">support@bookcoach.vn</p>
                        </div>
                        <div className="about-contact-item">
                            <MapPin className="about-contact-icon" />
                            <h4 className="about-contact-label">Địa chỉ</h4>
                            <p className="about-contact-value">123 Nguyễn Huệ, Q1, TP.HCM</p>
                        </div>
                    </div>
                    <button
                        onClick={handleBackClick}
                        className="about-contact-button"
                    >
                        Bắt Đầu Hành Trình Bỏ Thuốc
                    </button>
                </div>
            </section>
        </div>
    );
};

export default AboutUs;