import React, { useState, useEffect } from "react";
import { Typography, Card, Radio, Button, Spin, message } from "antd";
import { CheckCircleTwoTone, CreditCardOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Navbar from "../../layouts/Navbar";
import "./CheckoutPage.css";
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
        const baseURL = import.meta.env.VITE_API_URL || "http://localhost:5000";
        const response = await axios.get(
          `${baseURL}/api/subscriptions/packages`
        );

        if (response.data) {
          setPackages(response.data);
          // Chọn package đầu tiên làm mặc định
          if (response.data.length > 0) {
            setSelectedPackage(response.data[0].package_id);
          }
        } else {
          throw new Error("Không có dữ liệu packages");
        }
      } catch (error) {
        console.error("Error fetching packages:", error);
        message.error("Không thể tải danh sách gói dịch vụ: " + error.message);
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
    return packages.find((pkg) => pkg.package_id === selectedPackage);
  };

  const handleContinue = async () => {
    const packageData = getSelectedPackageData();
    if (!packageData) {
      message.error("Vui lòng chọn gói dịch vụ");
      return;
    }

    setProcessing(true);

    try {
      const baseURL = import.meta.env.VITE_API_URL || "http://localhost:5000";
      const token = localStorage.getItem("token");

      if (!token) {
        message.error("Vui lòng đăng nhập để tiếp tục");
        navigate("/login");
        return;
      }

      console.log("🔄 Gửi request thanh toán:", {
        packageId: packageData.package_id,
        amount: packageData.price,
        description: `Thanh toán gói ${packageData.package_name}`,
      });

      const response = await axios.post(
        `${baseURL}/api/payment`,
        {
          packageId: packageData.package_id, // Thêm dòng này!
          amount: packageData.price,
          description: `Thanh toán gói ${packageData.package_name}`,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log("✅ Server response:", response.data);

      if (response.data.success && response.data.checkoutUrl) {
        console.log("🔗 Redirect to PayOS:", response.data.checkoutUrl);
        // Lưu thông tin order để theo dõi
        localStorage.setItem(
          "pendingOrder",
          JSON.stringify({
            orderCode: response.data.orderCode,
            packageId: packageData.package_id,
            amount: packageData.price,
          })
        );

        window.location.href = response.data.checkoutUrl;
      } else {
        throw new Error(
          response.data.message || "Không nhận được URL thanh toán"
        );
      }
    } catch (error) {
      console.error("❌ Payment error:", error);

      if (error.response) {
        // Server trả về lỗi
        const errorMessage =
          error.response.data?.message ||
          error.response.data?.error ||
          "Lỗi từ server";
        message.error(`Lỗi thanh toán: ${errorMessage}`);
      } else if (error.request) {
        // Không nhận được phản hồi từ server
        message.error("Không thể kết nối đến server. Vui lòng thử lại.");
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
      <>
        <Navbar />
        <div className="checkout-page">
          <div className="loading-container">
            <div className="text-center">
              <div className="loading-icon">
                <Spin size="large" style={{ color: "#52c41a" }} />
              </div>
              <div
                style={{
                  fontSize: 20,
                  color: "#2c3e50",
                  fontWeight: "600",
                  textShadow: "2px 2px 8px rgba(0,0,0,0.1)",
                }}
              >
                🚭 Đang tải danh sách gói dịch vụ...
              </div>
              <div
                style={{
                  fontSize: 14,
                  color: "#7f8c8d",
                  marginTop: 8,
                  fontStyle: "italic",
                }}
              >
                Chuẩn bị hành trình cai nghiện thuốc lá cho bạn
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (packages.length === 0) {
    return (
      <>
        <Navbar />
        <div className="checkout-page">
          <div className="loading-container">
            <div className="text-center">
              <div className="loading-icon">
                <CreditCardOutlined style={{ fontSize: 64, color: "#fff" }} />
              </div>
              <Title
                level={2}
                style={{
                  color: "#2c3e50",
                  textShadow: "2px 2px 8px rgba(0,0,0,0.1)",
                  marginBottom: 16,
                }}
              >
                🚭 Không có gói dịch vụ nào
              </Title>
              <Paragraph
                style={{
                  color: "#7f8c8d",
                  fontSize: 16,
                  marginBottom: 30,
                }}
              >
                Vui lòng liên hệ quản trị viên để được hỗ trợ về các gói dịch vụ
                cai nghiện thuốc lá.
              </Paragraph>
              <Button
                type="primary"
                size="large"
                onClick={() => navigate("/home")}
                className="continue-button"
                style={{
                  background:
                    "linear-gradient(135deg, #52c41a 0%, #389e0d 100%)",
                  borderColor: "#52c41a",
                  borderRadius: 25,
                  padding: "12px 40px",
                  fontSize: 16,
                  fontWeight: "bold",
                  boxShadow: "0 8px 24px rgba(82, 196, 26, 0.4)",
                  height: 50,
                }}
              >
                <i className="bi bi-house me-2"></i>
                Về trang chủ
              </Button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="checkout-page">
        <div className="checkout-wrapper">
          <div className="checkout-content">
            {/* Header Section */}
            <div className="header-section fade-in">
              <div className="header-icon d-inline-block p-4 rounded-circle mb-4">
                <CreditCardOutlined style={{ fontSize: 48, color: "#fff" }} />
              </div>
              <h1 className="header-title">Chọn gói dịch vụ</h1>
              <div className="header-badge">
                🚭 Hành trình cai nghiện thuốc lá của bạn
              </div>
              <p className="header-subtitle">
                Chọn gói dịch vụ phù hợp để được hỗ trợ tốt nhất trên con đường
                tự do khỏi thuốc lá
              </p>
            </div>

            {/* Package Selection */}
            <Radio.Group
              onChange={handlePackageChange}
              value={selectedPackage}
              style={{ width: "100%" }}
            >
              <div className="packages-container slide-up">
                {packages.map((pkg) => (
                  <div
                    key={pkg.package_id}
                    className={`package-card ${
                      selectedPackage === pkg.package_id ? "selected" : ""
                    }`}
                    onClick={() => setSelectedPackage(pkg.package_id)}
                  >
                    {/* Popular Badge */}
                    {pkg.package_name.includes("1 tháng") && (
                      <div className="package-badge popular">PHỔ BIẾN</div>
                    )}

                    {/* Best Value Badge */}
                    {pkg.package_name.includes("3 tháng") && (
                      <div className="package-badge best">TỐT NHẤT</div>
                    )}

                    {/* Package Header */}
                    <div className="package-header">
                      <Radio
                        value={pkg.package_id}
                        style={{ marginBottom: 15 }}
                      >
                        <h3 className="package-title">{pkg.package_name}</h3>
                      </Radio>

                      <div className="package-price">
                        {pkg.price === 0
                          ? "Miễn phí"
                          : `${pkg.price.toLocaleString()} đ`}
                      </div>

                      <div className="package-description">
                        <p>{pkg.description}</p>
                      </div>

                      <div className="package-duration">
                        ⏱️ Thời hạn: {pkg.duration_days} ngày
                      </div>
                    </div>

                    {/* Features List */}
                    <div className="features-list">
                      {pkg.coach_access && (
                        <div className="feature-item">
                          <div className="feature-icon">
                            <i className="bi bi-person-check"></i>
                          </div>
                          <span>Tư vấn từ huấn luyện viên chuyên nghiệp</span>
                        </div>
                      )}
                      {pkg.community_access && (
                        <div className="feature-item">
                          <div className="feature-icon">
                            <i className="bi bi-people"></i>
                          </div>
                          <span>Tham gia cộng đồng hỗ trợ</span>
                        </div>
                      )}
                      {pkg.premium_content && (
                        <div className="feature-item">
                          <div className="feature-icon">
                            <i className="bi bi-star"></i>
                          </div>
                          <span>Nội dung và tài liệu cao cấp</span>
                        </div>
                      )}
                    </div>

                    {/* Selection Indicator */}
                    {selectedPackage === pkg.package_id && (
                      <div className="selection-indicator">
                        <i className="bi bi-check"></i>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Radio.Group>

            {/* Continue Button Section */}
            <div className="continue-section fade-in">
              <Button
                type="primary"
                size="large"
                onClick={handleContinue}
                disabled={!selectedPackage || processing}
                loading={processing}
                className="continue-button"
              >
                {processing ? (
                  <span>
                    <i className="bi bi-hourglass-split me-2"></i>
                    Đang xử lý...
                  </span>
                ) : (
                  <span>
                    <i className="bi bi-credit-card me-2"></i>
                    Tiếp tục thanh toán
                  </span>
                )}
              </Button>

              <div className="security-info">
                <i className="bi bi-shield-check me-2"></i>
                <span>Bảo mật với PayOS - Thanh toán an toàn</span>
              </div>

              <div className="support-info">
                💡 Hỗ trợ 24/7 cho hành trình cai nghiện của bạn
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CheckoutPage;
