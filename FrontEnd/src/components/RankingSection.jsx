import React, { useState, useEffect } from 'react';
import { Card, Typography, Avatar, Badge, Spin, Alert, message, Button } from 'antd';
import { TrophyOutlined, CrownOutlined, StarOutlined, FireOutlined, ArrowRightOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom'; // Import useNavigate để điều hướng
import axios from 'axios';
const { Title, Text } = Typography;

const RankingSection = () => {
    const [rankingData, setRankingData] = useState([]);
    const [myRanking, setMyRanking] = useState(null);
    const [activeIndex, setActiveIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const navigate = useNavigate(); // Hook để điều hướng

    // Base URL cho API
    const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

    // Mock data fallback nếu API lỗi
    const mockRankingData = [
        {
            rank: 1,
            user_id: 1,
            full_name: "Nguyễn Văn Thành",
            avatar_url: "👨‍💼",
            total_points: 850,
            current_level: "Advanced",
            progress_to_next: 75,
            smokeFree: 180,
            moneySaved: 15,
            description: "Sau 15 năm hút thuốc, tôi đã bỏ được nhờ ứng dụng này. Giờ tôi cảm thấy khỏe mạnh hơn rất nhiều!"
        },
        {
            rank: 2,
            user_id: 2,
            full_name: "Trần Thị Hương",
            avatar_url: "👩‍🏫",
            total_points: 720,
            current_level: "Advanced",
            progress_to_next: 45,
            smokeFree: 120,
            moneySaved: 12,
            description: "Là giáo viên, tôi cần làm gương cho học sinh. Việc bỏ thuốc giúp tôi tự tin hơn trong công việc."
        },
        {
            rank: 3,
            user_id: 3,
            full_name: "Lê Minh Tâm",
            avatar_url: "👨‍🚛",
            total_points: 650,
            current_level: "Intermediate",
            progress_to_next: 85,
            smokeFree: 90,
            moneySaved: 8,
            description: "Bác sĩ cảnh báo về sức khỏe tim mạch. Với sự hỗ trợ của app, tôi đã thành công bỏ thuốc."
        },
        {
            rank: 4,
            user_id: 4,
            full_name: "Phạm Văn Đức",
            avatar_url: "👨‍⚕️",
            total_points: 580,
            current_level: "Intermediate",
            progress_to_next: 60,
            smokeFree: 75,
            moneySaved: 6,
            description: "Hành trình bỏ thuốc không dễ dàng, nhưng với sự kiên trì và hỗ trợ từ cộng đồng, tôi đã làm được."
        }
    ];

    // Fetch ranking data từ API
    const fetchRankingData = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await axios.get(`${API_BASE_URL}/api/user-score/ranking`, {
                timeout: 10000, // 10 seconds timeout
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            console.log('✅ Response từ API ranking:', response.data);

            if (response.data && response.data.success && Array.isArray(response.data.data)) {
                // Thêm thông tin mở rộng cho mỗi user
                const enrichedData = response.data.data.map((user, index) => ({
                    ...user,
                    // Đảm bảo có rank nếu API không trả về
                    rank: user.rank || (index + 1),
                    // Tính toán smokeFree và moneySaved từ total_points (có thể thay bằng API thật)
                    smokeFree: calculateSmokeFreedays(user.total_points),
                    moneySaved: calculateMoneySaved(user.total_points),
                    description: getDescriptionByLevel(user.current_level, user.full_name),
                    avatar_url: user.avatar_url || getRandomAvatar()
                }));

                setRankingData(enrichedData);
                console.log('✅ Đã cập nhật ranking data:', enrichedData);
            } else {
                throw new Error('Dữ liệu API không hợp lệ');
            }
        } catch (err) {
            console.error('❌ Lỗi khi lấy dữ liệu ranking:', err);

            let errorMessage = 'Không thể tải dữ liệu từ server.';

            if (err.code === 'ECONNABORTED') {
                errorMessage = 'Kết nối timeout. Vui lông thử lại.';
            } else if (err.response) {
                errorMessage = `Lỗi server: ${err.response.status}`;
            } else if (err.request) {
                errorMessage = 'Không thể kết nối đến server.';
            }

            setError(errorMessage + ' Hiển thị dữ liệu mẫu.');
            setRankingData(mockRankingData);

            // Hiển thị thông báo lỗi
            message.warning('Đang sử dụng dữ liệu mẫu do không thể kết nối server');
        } finally {
            setLoading(false);
        }
    };

    // Fetch my ranking
    const fetchMyRanking = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                console.log('⚠️ Không có token, bỏ qua lấy thứ hạng cá nhân');
                return;
            }

            const response = await axios.get(`${API_BASE_URL}/api/user-score/ranking/me`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                timeout: 10000
            });

            console.log('✅ Response thứ hạng cá nhân:', response.data);

            if (response.data && response.data.success && response.data.data) {
                const myData = {
                    ...response.data.data,
                    smokeFree: calculateSmokeFreedays(response.data.data.total_points),
                    moneySaved: calculateMoneySaved(response.data.data.total_points)
                };
                setMyRanking(myData);
            }
        } catch (err) {
            console.error('❌ Lỗi khi lấy thứ hạng cá nhân:', err);
            // Không hiển thị lỗi cho thứ hạng cá nhân vì không bắt buộc
        }
    };

    // Helper functions
    const calculateSmokeFreedays = (points) => {
        // Giả sử 1 điểm = 1 ngày không hút thuốc
        return Math.floor(points / 5) + Math.floor(Math.random() * 50) + 30;
    };

    const calculateMoneySaved = (points) => {
        // Giả sử tiết kiệm được dựa trên điểm số
        return Math.floor(points / 50) + Math.floor(Math.random() * 20) + 5;
    };

    const getDescriptionByLevel = (level, name) => {
        const descriptions = {
            'Beginner': `${name} đang bắt đầu hành trình bỏ thuốc với quyết tâm cao. Mỗi ngày không hút thuốc là một chiến thắng!`,
            'Intermediate': `${name} đã vượt qua giai đoạn khó khăn nhất và đang kiểm soát tốt cơn thèm thuốc. Tiếp tục phát huy!`,
            'Advanced': `${name} đã trở thành hình mẫu cho cộng đồng với thành tích ấn tượng trong việc bỏ thuốc lá.`,
            'Master': `${name} là bậc thầy trong việc bỏ thuốc, đã hoàn toàn thoát khỏi tệ nạn và trở thành nguồn cảm hứng cho mọi người.`
        };
        return descriptions[level] || descriptions['Beginner'];
    };

    const getRandomAvatar = () => {
        const avatars = ['👨‍💼', '👩‍🏫', '👨‍⚕️', '👩‍💻', '👨‍🚛', '👩‍🍳', '👨‍🏭', '👩‍🎓'];
        return avatars[Math.floor(Math.random() * avatars.length)];
    };

    const getLevelIcon = (level) => {
        const icons = {
            'Beginner': <StarOutlined style={{ color: '#52c41a' }} />,
            'Intermediate': <FireOutlined style={{ color: '#fa8c16' }} />,
            'Advanced': <TrophyOutlined style={{ color: '#1890ff' }} />,
            'Master': <CrownOutlined style={{ color: '#f5222d' }} />
        };
        return icons[level] || icons['Beginner'];
    };

    const getLevelColor = (level) => {
        const colors = {
            'Beginner': '#52c41a',
            'Intermediate': '#fa8c16',
            'Advanced': '#1890ff',
            'Master': '#f5222d'
        };
        return colors[level] || colors['Beginner'];
    };

    // Hàm chuyển hướng đến trang ranking
    const handleViewMoreRanking = () => {
        navigate('/RankingBoard'); // Điều hướng đến route /ranking
    };

    useEffect(() => {
        fetchRankingData();
        fetchMyRanking();
    }, []);

    const changeContent = (index) => {
        setActiveIndex(index);
    };

    if (loading) {
        return (
            <section className="ranking-section">
                <div className="container">
                    <div className="text-center" style={{ padding: '60px 0' }}>
                        <Spin size="large" />
                        <p style={{ marginTop: 16 }}>Đang tải bảng xếp hạng...</p>
                    </div>
                </div>
            </section>
        );
    }

    // Kiểm tra nếu không có dữ liệu
    if (!rankingData || rankingData.length === 0) {
        return (
            <section className="ranking-section">
                <div className="container">
                    <div className="text-center" style={{ padding: '60px 0' }}>
                        <Alert
                            message="Không có dữ liệu xếp hạng"
                            description="Hiện tại chưa có dữ liệu xếp hạng để hiển thị."
                            type="info"
                            showIcon
                        />
                    </div>
                </div>
            </section>
        );
    }

    const currentUser = rankingData[activeIndex];

    return (
        <section className="ranking-section">
            <div className="container">
                <div className="container">
                    <div className="text-center mx-auto pb-4" style={{ maxWidth: "500px" }}>
                        <p className="section-title bg-white text-center text-primary px-3">
                            <span className="title-icon">🏆</span>
                            Bảng Xếp Hạng
                            <span className="title-underline"></span>
                        </p>
                        {error && (
                            <Alert
                                message={error}
                                type="warning"
                                showIcon
                                style={{ marginBottom: 20 }}
                                closable
                            />
                        )}
                    </div>

                    {/* My Ranking Banner */}
                    {myRanking && (
                        <div className="mb-4 p-3" style={{
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            borderRadius: '12px',
                            color: 'white',
                            textAlign: 'center'
                        }}>
                            <h4>🌟 Thứ hạng của bạn: #{myRanking.rank}</h4>
                            <p>Điểm số: {myRanking.total_points} | Cấp độ: {myRanking.current_level}</p>
                            <p>Tiến độ: {myRanking.progress_to_next}% đến cấp tiếp theo</p>
                        </div>
                    )}

                    <div className="row">
                        {/* Left side: Clickable titles */}
                        <div className="col-md-6">
                            <div className="ranking-titles">
                                {rankingData.map((item, index) => (
                                    <div
                                        key={item.user_id}
                                        className={`ranking-title ${activeIndex === index ? "active" : ""}`}
                                        onClick={() => changeContent(index)}
                                    >
                                        <div className="ranking-number">
                                            {String(item.rank).padStart(2, '0')}
                                        </div>
                                        <div className="ranking-content-preview">
                                            <Title level={3} className="ranking-item-title">
                                                {item.full_name}
                                            </Title>
                                            <div className="ranking-stats">
                                                <span className="stat-badge">
                                                    <span className="stat-icon">{getLevelIcon(item.current_level)}</span>
                                                    {Math.round(item.total_points)} điểm
                                                </span>
                                                <span className="stat-badge">
                                                    <span className="stat-icon">📅</span>
                                                    {item.smokeFree} ngày
                                                </span>
                                            </div>
                                            <div className="level-badge" style={{
                                                backgroundColor: getLevelColor(item.current_level),
                                                color: 'white',
                                                padding: '2px 8px',
                                                borderRadius: '12px',
                                                fontSize: '12px',
                                                marginTop: '4px'
                                            }}>
                                                {item.current_level}
                                            </div>
                                        </div>
                                        <div className="ranking-hover-effect"></div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Right side: Content */}
                        <div className="col-md-6">
                            <div className="ranking-content-wrapper">
                                <div className="ranking-content" key={activeIndex}>
                                    <Card
                                        className="ranking-card"
                                        title={
                                            <div className="card-title-wrapper">
                                                <span>{getLevelIcon(currentUser?.current_level)}</span>
                                                <span>Hồ Sơ Thành Viên Hạng #{currentUser?.rank}</span>
                                                <div className="title-decoration"></div>
                                            </div>
                                        }
                                        bordered={false}
                                        style={{
                                            backgroundColor: "transparent",
                                            boxShadow: "none",
                                            borderRadius: "20px",
                                        }}
                                    >
                                        <div className="card-inner">
                                            <div className="member-avatar">
                                                <div className="avatar-ring" style={{
                                                    borderColor: getLevelColor(currentUser?.current_level)
                                                }}></div>
                                                <div className="avatar-content">
                                                    {currentUser?.avatar_url || "👤"}
                                                </div>
                                                <div className="success-indicator">
                                                    {getLevelIcon(currentUser?.current_level)}
                                                </div>
                                            </div>

                                            <Title className="member-name" level={4}>
                                                {currentUser?.full_name}
                                            </Title>

                                            <div className="level-info" style={{
                                                textAlign: 'center',
                                                marginBottom: '20px'
                                            }}>
                                                <Badge
                                                    color={getLevelColor(currentUser?.current_level)}
                                                    text={`Cấp độ: ${currentUser?.current_level}`}
                                                />
                                                <div style={{ marginTop: '8px' }}>
                                                    <div style={{
                                                        width: '100%',
                                                        backgroundColor: '#f0f0f0',
                                                        borderRadius: '10px',
                                                        height: '8px'
                                                    }}>
                                                        <div style={{
                                                            width: `${Math.min(currentUser?.progress_to_next || 0, 100)}%`,
                                                            backgroundColor: getLevelColor(currentUser?.current_level),
                                                            height: '100%',
                                                            borderRadius: '10px',
                                                            transition: 'width 0.3s ease'
                                                        }}></div>
                                                    </div>
                                                    <small>Tiến độ lên cấp: {currentUser?.progress_to_next || 0}%</small>
                                                </div>
                                            </div>

                                            <div className="achievement-stats">
                                                <div className="stat-item">
                                                    <div className="stat-circle">
                                                        <span className="stat-number">
                                                            {currentUser?.smokeFree || 0}
                                                        </span>
                                                        <span className="stat-label">Ngày không hút</span>
                                                    </div>
                                                </div>
                                                <div className="stat-item">
                                                    <div className="stat-circle">
                                                        <span className="stat-number">
                                                            {currentUser?.moneySaved || 0}
                                                        </span>
                                                        <span className="stat-label">Triệu tiết kiệm</span>
                                                    </div>
                                                </div>
                                                <div className="stat-item">
                                                    <div className="stat-circle">
                                                        <span className="stat-number">
                                                            {Math.round(currentUser?.total_points || 0)}
                                                        </span>
                                                        <span className="stat-label">Điểm tích lũy</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="member-story">
                                                <Text className="story-text">
                                                    {currentUser?.description}
                                                </Text>
                                            </div>

                                            <div className="achievement-badges">
                                                <span className="badge badge-green">🏃‍♂️ Sức khỏe tốt</span>
                                                <span className="badge badge-blue">💰 Tiết kiệm</span>
                                                <span className="badge badge-teal">🎯 Mục tiêu đạt</span>
                                                {currentUser?.current_level === 'Master' && (
                                                    <span className="badge badge-gold">👑 Bậc thầy</span>
                                                )}
                                            </div>
                                        </div>
                                    </Card>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Nút Xem thêm */}
                    <div className="text-center mt-5 mb-4">
                        <Button
                            type="primary"
                            size="large"
                            icon={<ArrowRightOutlined />}
                            onClick={handleViewMoreRanking}
                            style={{
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                border: 'none',
                                borderRadius: '25px',
                                padding: '8px 32px',
                                height: 'auto',
                                fontSize: '16px',
                                fontWeight: '600',
                                boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
                                transition: 'all 0.3s ease'
                            }}
                            onMouseEnter={(e) => {
                                e.target.style.transform = 'translateY(-2px)';
                                e.target.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.6)';
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.transform = 'translateY(0)';
                                e.target.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.4)';
                            }}
                        >
                            <span style={{ marginRight: '8px' }}>🏆</span>
                            Xem Bảng Xếp Hạng Đầy Đủ
                        </Button>
                        <div style={{
                            marginTop: '8px',
                            color: '#666',
                            fontSize: '14px'
                        }}>
                            Khám phá thêm nhiều thành viên xuất sắc khác
                        </div>
                    </div>
                </div>
            </div>

            {/* Floating particles */}
            <div className="floating-particles">
                <div className="particle particle-1">🌿</div>
                <div className="particle particle-2">💚</div>
                <div className="particle particle-3">🌱</div>
                <div className="particle particle-4">✨</div>
            </div>
        </section>
    );
};

export default RankingSection;