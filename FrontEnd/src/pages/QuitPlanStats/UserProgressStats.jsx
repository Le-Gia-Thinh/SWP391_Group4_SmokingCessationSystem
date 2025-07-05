import React, { useEffect, useState } from 'react';
import { Tabs, Card, Typography, Tag, Progress, List, Spin, message } from 'antd';
import axios from 'axios';
import Navbar from '../../layouts/Navbar';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

const UserProgressStats = () => {
  const [activeTab, setActiveTab] = useState("1");
  const [loading, setLoading] = useState(false);
  const [loadedTabs, setLoadedTabs] = useState({});
  const [stats, setStats] = useState({
    savings: {},
    frequency: {},
    achievements: [],
    health: {
      summary: "Phổi đang hồi phục, tuần hoàn máu tốt hơn, nguy cơ tim mạch giảm."
    }
  });
  const [progressSummary, setProgressSummary] = useState({
  avoidedCigarettes: 0,
  smokeFreeDays: 0
  });

  const fetchSavings = async () => {
  try {
    const token = localStorage.getItem("token");
    const res = await axios.get('/api/user/savings', {
      headers: { Authorization: `Bearer ${token}` }
    });
    setStats(prev => ({ ...prev, savings: res.data }));
    setLoadedTabs(prev => ({ ...prev, "1": true }));
  } catch (err) {
    console.error("❌ Lỗi tải tiết kiệm:", err);
    message.error('Không thể tải dữ liệu tiết kiệm');
  }
};

  const fetchFrequency = async () => {
  try {
    const token = localStorage.getItem("token");
    const res = await axios.get('/api/user/frequency', {
      headers: { Authorization: `Bearer ${token}` }
    });
    setStats(prev => ({ ...prev, frequency: res.data }));
    setLoadedTabs(prev => ({ ...prev, "2": true }));
  } catch (err) {
    console.error("❌ Lỗi tải tần suất:", err);
    message.error('Không thể tải dữ liệu tần suất');
  }
};

const fetchAchievements = async () => {
  try {
    const token = localStorage.getItem("token");
    const res = await axios.get('/api/user/achievements', {
      headers: { Authorization: `Bearer ${token}` }
    });
    setStats(prev => ({ ...prev, achievements: res.data.achievements || [] }));
    setLoadedTabs(prev => ({ ...prev, "3": true }));
  } catch (err) {
    console.error("❌ Lỗi tải thành tựu:", err);
    message.error('Không thể tải dữ liệu thành tựu');
  }
};

const fetchProgressSummary = async () => {
  try {
    const token = localStorage.getItem("token");
    const res = await axios.get('/api/user/progress-summary', {
      headers: { Authorization: `Bearer ${token}` }
    });
    setProgressSummary(res.data);
  } catch (err) {
    console.error("❌ Lỗi lấy tiến trình bỏ thuốc:", err);
    message.error('Không thể tải tiến trình bỏ thuốc');
  }
};

  useEffect(() => {
    const fetchData = async () => {
      if (loadedTabs[activeTab]) return;

      setLoading(true);
      if (activeTab === "1") {
        await fetchSavings();
        await fetchProgressSummary();
      }
      if (activeTab === "2") await fetchFrequency();
      if (activeTab === "3") await fetchAchievements();
      setLoading(false);
    };

    fetchData();
  }, [activeTab]);

  const { savings, frequency, achievements, health } = stats;

  return (
    <>
      <Navbar />
      <div style={{ maxWidth: 900, margin: '40px auto' }}>
        <Card style={{ borderRadius: 16 }}>
          <Tabs activeKey={activeTab} onChange={key => setActiveTab(key)} centered>
            <TabPane tab="💰 Tiết kiệm" key="1">
              {loading ? <Spin /> : (
                <>
                  <Title level={4}>Số tiền tiết kiệm được</Title>
                  <Text strong>{savings.amount ? savings.amount.toLocaleString() : '0'} VND</Text><br />

                  <Text strong>Số ngày không hút thuốc: </Text>
                  <Text>{progressSummary.smokeFreeDays} ngày</Text><br />

                  <Text strong>Số điếu thuốc đã tránh được: </Text>
                  <Text>{progressSummary.avoidedCigarettes} điếu</Text><br />

                  <Text type="secondary">
                    Từ ngày bắt đầu cai: {savings.startDate || '...'}
                  </Text>
                </>
              )}
            </TabPane>

            <TabPane tab="🚬 Tần suất hút" key="2">
              {loading ? <Spin /> : (
                <>
                  <Title level={4}>Tần suất hút thuốc</Title>
                  <Text>Trước: {frequency.initial || 0} điếu/ngày</Text><br />
                  <Text>Hiện tại: {frequency.current || 0} điếu/ngày</Text><br />
                  <Progress percent={frequency.reductionRate || 0} status="active" />
                </>
              )}
            </TabPane>

            <TabPane tab="🏆 Thành tựu" key="3">
              {loading ? <Spin /> : (
                <>
                  <Title level={4}>Thành tựu đã đạt</Title>
                  <List
                    dataSource={achievements}
                    renderItem={item => (
                      <List.Item>
                        <Tag color="green">{item.title}</Tag> - {item.description}
                      </List.Item>
                    )}
                    locale={{ emptyText: 'Chưa có thành tựu nào' }}
                  />
                </>
              )}
            </TabPane>

            <TabPane tab="❤️ Sức khỏe" key="4">
              <Title level={4}>Tình trạng sức khỏe</Title>
              <Text>{health.summary}</Text>
            </TabPane>
          </Tabs>
        </Card>
      </div>
    </>
  );
};

export default UserProgressStats;
