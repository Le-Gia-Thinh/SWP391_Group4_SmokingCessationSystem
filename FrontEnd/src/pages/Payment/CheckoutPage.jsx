import React, { useState, useEffect } from 'react';
import { Typography, Card, Radio, Button, Row, Col, Spin, message } from 'antd';
import { CheckCircleTwoTone, CreditCardOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from "../../layouts/Navbar";
const { Title, Paragraph } = Typography;

const CheckoutPage = () => {
    const [selectedPackage, setSelectedPackage] = useState(null);
    const [packages, setPackages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const navigate = useNavigate();

    // Lấy danh sách packages từ API
    useEffect(() => {
        const fetchPackages = async () => {
            try {
                const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
                const response = await axios.get(`${baseURL}/api/subscriptions/packages`);

                if (response.data) {
                    setPackages(response.data);
                    // Chọn package đầu tiên làm mặc định
                    if (response.data.length > 0) {
                        setSelectedPackage(response.data[0].package_id);
                    }
                } else {
                    throw new Error('Không có dữ liệu packages');
                }
            } catch (error) {
                console.error('Error fetching packages:', error);
                message.error('Không thể tải danh sách gói dịch vụ: ' + error.message);
            } finally {
                setLoading(false);
            }
        };

        fetchPackages();
    }, []);

    const handlePackageChange = (e) => {
        setSelectedPackage(e.target.value);
    };

    const getSelectedPackageData = () => {
        return packages.find(pkg => pkg.package_id === selectedPackage);
    };

    const handleContinue = async () => {
        const packageData = getSelectedPackageData();
        if (!packageData) {
            message.error('Vui lòng chọn gói dịch vụ');
            return;
        }

        setProcessing(true);

        try {
            const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
            const token = localStorage.getItem('token');

            if (!token) {
                message.error('Vui lòng đăng nhập để tiếp tục');
                navigate('/login');
                return;
            }

            console.log('🔄 Gửi request thanh toán:', {
                packageId: packageData.package_id,
                amount: packageData.price,
                description: `Thanh toán gói ${packageData.package_name}`
            });

            const response = await axios.post(`${baseURL}/api/payment`, {
                packageId: packageData.package_id, // Thêm dòng này!
                amount: packageData.price,
                description: `Thanh toán gói ${packageData.package_name}`
            }, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log('✅ Server response:', response.data);

            if (response.data.success && response.data.checkoutUrl) {
                console.log('🔗 Redirect to PayOS:', response.data.checkoutUrl);
                // Lưu thông tin order để theo dõi
                localStorage.setItem('pendingOrder', JSON.stringify({
                    orderCode: response.data.orderCode,
                    packageId: packageData.package_id,
                    amount: packageData.price
                }));

                window.location.href = response.data.checkoutUrl;
            } else {
                throw new Error(response.data.message || 'Không nhận được URL thanh toán');
            }

        } catch (error) {
            console.error('❌ Payment error:', error);

            if (error.response) {
                // Server trả về lỗi
                const errorMessage = error.response.data?.message || error.response.data?.error || 'Lỗi từ server';
                message.error(`Lỗi thanh toán: ${errorMessage}`);
            } else if (error.request) {
                // Không nhận được phản hồi từ server
                message.error('Không thể kết nối đến server. Vui lòng thử lại.');
            } else {
                // Lỗi khác
                message.error(`Lỗi: ${error.message}`);
            }
        } finally {
            setProcessing(false);
        }
    };

    if (loading) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '50vh',
                flexDirection: 'column'
            }}>
                <Spin size="large" />
                <div style={{ marginTop: 16, fontSize: 16 }}>Đang tải danh sách gói dịch vụ...</div>
            </div>
        );
    }

    if (packages.length === 0) {
        return (
            <div style={{ textAlign: 'center', padding: '100px 20px' }}>
                <Title level={3}>Không có gói dịch vụ nào</Title>
                <Paragraph>Vui lòng liên hệ quản trị viên để biết thêm chi tiết.</Paragraph>
                <Button type="primary" onClick={() => navigate('/home')}>
                    Về trang chủ
                </Button>
            </div>
        );
    }

    return (
        <>
            <Navbar />
            <div style={{
                maxWidth: 1000,
                margin: '40px auto',
                padding: 32,
                background: '#fff',
                borderRadius: 12,
                boxShadow: '0 4px 24px rgba(0,0,0,0.1)',
            }}>
                <div style={{ textAlign: 'center', marginBottom: 40 }}>
                    <CreditCardOutlined style={{ fontSize: 48, color: '#52c41a', marginBottom: 16 }} />
                    <Title level={2} style={{ margin: 0 }}>
                        Chọn gói dịch vụ
                    </Title>
                    <Paragraph type="secondary" style={{ fontSize: 16, marginTop: 8 }}>
                        Chọn gói dịch vụ phù hợp để nâng cao trải nghiệm của bạn
                    </Paragraph>
                </div>

                <Radio.Group
                    onChange={handlePackageChange}
                    value={selectedPackage}
                    style={{ width: '100%' }}
                >
                    <Row gutter={[24, 24]}>
                        {packages.map(pkg => (
                            <Col xs={24} sm={12} lg={8} key={pkg.package_id}>
                                <Card
                                    hoverable
                                    style={{
                                        border: selectedPackage === pkg.package_id ? '2px solid #52c41a' : '1px solid #d9d9d9',
                                        boxShadow: selectedPackage === pkg.package_id ? '0 0 12px rgba(82, 196, 26, 0.2)' : undefined,
                                        borderRadius: 10,
                                        minHeight: 280,
                                        textAlign: 'center',
                                        transition: 'all 0.3s ease',
                                        cursor: 'pointer',
                                        position: 'relative'
                                    }}
                                    onClick={() => setSelectedPackage(pkg.package_id)}
                                    bodyStyle={{ padding: 20 }}
                                >
                                    <Radio
                                        value={pkg.package_id}
                                        style={{
                                            marginBottom: 16,
                                            display: 'block'
                                        }}
                                    >
                                        <Title level={4} style={{ margin: 0, color: '#1890ff' }}>
                                            {pkg.package_name}
                                        </Title>
                                    </Radio>

                                    <div style={{
                                        fontSize: 28,
                                        fontWeight: 'bold',
                                        color: '#52c41a',
                                        margin: '16px 0',
                                        lineHeight: 1
                                    }}>
                                        {pkg.price === 0 ? 'Miễn phí' : `${pkg.price.toLocaleString()} đ`}
                                    </div>

                                    <Paragraph style={{
                                        minHeight: 60,
                                        color: '#666',
                                        fontSize: 14,
                                        marginBottom: 16
                                    }}>
                                        {pkg.description}
                                    </Paragraph>

                                    <div style={{
                                        fontSize: 13,
                                        color: '#999',
                                        marginBottom: 16,
                                        padding: '8px 0',
                                        borderTop: '1px solid #f0f0f0'
                                    }}>
                                        <strong>Thời hạn:</strong> {pkg.duration_days} ngày
                                    </div>

                                    {/* Hiển thị features */}
                                    <div style={{
                                        fontSize: 12,
                                        color: '#666',
                                        textAlign: 'left',
                                        marginBottom: 16
                                    }}>
                                        {pkg.coach_access && (
                                            <div style={{ marginBottom: 4 }}>
                                                ✓ Truy cập huấn luyện viên
                                            </div>
                                        )}
                                        {pkg.community_access && (
                                            <div style={{ marginBottom: 4 }}>
                                                ✓ Truy cập cộng đồng
                                            </div>
                                        )}
                                        {pkg.premium_content && (
                                            <div style={{ marginBottom: 4 }}>
                                                ✓ Nội dung premium
                                            </div>
                                        )}
                                    </div>

                                    {selectedPackage === pkg.package_id && (
                                        <div style={{
                                            position: 'absolute',
                                            top: 10,
                                            right: 10
                                        }}>
                                            <CheckCircleTwoTone
                                                twoToneColor="#52c41a"
                                                style={{ fontSize: 24 }}
                                            />
                                        </div>
                                    )}
                                </Card>
                            </Col>
                        ))}
                    </Row>
                </Radio.Group>

                <div style={{
                    marginTop: 40,
                    textAlign: 'center',
                    padding: '20px 0',
                    borderTop: '1px solid #f0f0f0'
                }}>
                    <Button
                        type="primary"
                        size="large"
                        onClick={handleContinue}
                        disabled={!selectedPackage || processing}
                        loading={processing}
                        style={{
                            minWidth: 200,
                            height: 50,
                            fontSize: 16,
                            fontWeight: 'bold'
                        }}
                    >
                        {processing ? 'Đang xử lý...' : 'Tiếp tục thanh toán'}
                    </Button>

                    <div style={{ marginTop: 16, fontSize: 12, color: '#999' }}>
                        Bạn sẽ được chuyển hướng đến trang thanh toán PayOS
                    </div>
                </div>
            </div>
        </>
    );
};

export default CheckoutPage;