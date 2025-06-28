// src/Payment/CheckoutPage.jsx
import React, { useState, useEffect } from 'react';
import { Typography, Card, Radio, Button, Row, Col, Spin, message } from 'antd';
import { CheckCircleTwoTone } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const { Title, Paragraph } = Typography;

const CheckoutPage = () => {
    const [selectedPackage, setSelectedPackage] = useState(null);
    const [packages, setPackages] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    // Lấy danh sách packages từ API
    useEffect(() => {
        const fetchPackages = async () => {
            try {
                const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
                const response = await axios.get(`${baseURL}/api/subscriptions/packages`);

                setPackages(response.data);
                // Chọn package đầu tiên làm mặc định
                if (response.data.length > 0) {
                    setSelectedPackage(response.data[0].package_id);
                }
            } catch (error) {
                console.error('Error fetching packages:', error);
                message.error('Không thể tải danh sách gói dịch vụ');
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

    const handleContinue = () => {
        const packageData = getSelectedPackageData();
        if (!packageData) {
            message.error('Vui lòng chọn gói dịch vụ');
            return;
        }

        // Chuyển đến trang thanh toán với thông tin package
        navigate('/payment/vietqr', {
            state: {
                packageId: packageData.package_id,
                amount: packageData.price,
                packageName: packageData.package_name,
                description: `Thanh toán gói ${packageData.package_name}`
            }
        });
    };

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: '100px 0' }}>
                <Spin size="large" />
                <div style={{ marginTop: 16 }}>Đang tải danh sách gói dịch vụ...</div>
            </div>
        );
    }

    return (
        <div style={{
            maxWidth: 1000,
            margin: '40px auto',
            background: '#fff',
            borderRadius: 12,
            boxShadow: '0 4px 24px rgba(0,0,0,0.1)',
            padding: 32
        }}>
            <Title level={2} style={{ textAlign: 'center', marginBottom: 32 }}>
                Chọn gói dịch vụ
            </Title>

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
                                    minHeight: 220,
                                    textAlign: 'center',
                                    transition: 'all 0.2s',
                                    cursor: 'pointer'
                                }}
                                onClick={() => setSelectedPackage(pkg.package_id)}
                                bodyStyle={{ padding: 20 }}
                            >
                                <Radio value={pkg.package_id} style={{ marginBottom: 12 }}>
                                    <Title level={4} style={{ margin: 0 }}>
                                        {pkg.package_name}
                                    </Title>
                                </Radio>

                                <div style={{
                                    fontSize: 24,
                                    fontWeight: 'bold',
                                    color: '#52c41a',
                                    margin: '12px 0'
                                }}>
                                    {pkg.price === 0 ? 'Miễn phí' : `${pkg.price.toLocaleString()} đ`}
                                </div>

                                <Paragraph style={{
                                    minHeight: 40,
                                    color: '#666',
                                    fontSize: 14
                                }}>
                                    {pkg.description}
                                </Paragraph>

                                <div style={{ fontSize: 12, color: '#999', marginBottom: 8 }}>
                                    Thời hạn: {pkg.duration_days} ngày
                                </div>

                                {/* Hiển thị features */}
                                <div style={{ fontSize: 12, color: '#666' }}>
                                    {pkg.coach_access && <div>✓ Truy cập huấn luyện viên</div>}
                                    {pkg.community_access && <div>✓ Truy cập cộng đồng</div>}
                                    {pkg.premium_content && <div>✓ Nội dung premium</div>}
                                </div>

                                {selectedPackage === pkg.package_id && (
                                    <CheckCircleTwoTone
                                        twoToneColor="#52c41a"
                                        style={{ fontSize: 24, marginTop: 12 }}
                                    />
                                )}
                            </Card>
                        </Col>
                    ))}
                </Row>
            </Radio.Group>

            <div style={{ marginTop: 32, textAlign: 'center' }}>
                <Button
                    type="primary"
                    size="large"
                    onClick={handleContinue}
                    disabled={!selectedPackage}
                    style={{ minWidth: 120 }}
                >
                    Tiếp tục thanh toán
                </Button>
            </div>
        </div>
    );
};

export default CheckoutPage;