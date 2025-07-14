/**
 * Navbar.jsx – hiển thị badge Premium theo số ngày còn lại
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Layout, Menu, Button, Avatar, Space, Badge, Drawer,
} from 'antd';
import {
  UserOutlined, LogoutOutlined, HomeOutlined, TrophyOutlined, BookOutlined,
  TeamOutlined, ContactsOutlined, CalendarOutlined, BellOutlined, MenuOutlined,
  MoreOutlined, ScheduleOutlined, FileDoneOutlined, MessageOutlined,
  BarChartOutlined,
} from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import './Navbar.css';
import { Dropdown } from 'antd';
import UserDropdownMenu from '../components/UserDropdownMenu';

const { Header } = Layout;

export default function Navbar() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, isCoach, isAdmin } = useAuth();
  const [remainingDays, setRemainingDays] = useState(null);

  /* ---------- Logout ---------- */
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  /* ---------- Lấy remainingDays mỗi khi user thay đổi ---------- */

  useEffect(() => {
    if (!user) { setRemainingDays(null); return; }

    const token = localStorage.getItem('token');
    const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

    axios
      .get(`${baseURL}/api/subscriptions/remaining`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then(({ data }) => setRemainingDays(data.remainingDays))
      .catch(() => setRemainingDays(null));
  }, [user]);

  /* ---------- Đi tới trang lập kế hoạch ---------- */
  const handlePlanClick = async () => {
    if (!user) return navigate('/login');
    try {
      const { data } = await axios.get(
        `http://localhost:5000/api/ftnd/exists/${user.id}`,
        { withCredentials: true },
      );
      navigate(data.exists ? '/QuitPlanCalendar' : '/FtndTest');
    } catch {
      navigate('/FtndTest');
    }
  };

  /* ---------- Menu items ---------- */
  const getMenuItems = () => {
    const items = [
      { key: '/', icon: <HomeOutlined />, label: 'Trang chủ', onClick: () => navigate('/') },
      { key: '/plan', icon: <CalendarOutlined />, label: 'Lập kế hoạch', onClick: handlePlanClick },
      { key: '/RankingBoard', icon: <TrophyOutlined />, label: 'Xếp hạng', onClick: () => navigate('/RankingBoard') },
      { key: '/blog', icon: <BookOutlined />, label: 'Blog', onClick: () => navigate('/blog') },
      { key: '/chat', icon: <MessageOutlined />, label: 'Chat', onClick: () => navigate('/chat') },
      { key: '/user/stats', icon: <BarChartOutlined />, label: 'Thống kê', onClick: () => navigate('/user/stats') },
    ];

    if (user?.role === 'member') {
      items.push({ key: '/membership', icon: <TeamOutlined />, label: 'Thành viên', onClick: () => navigate('/membership') });
    }

    if (!isCoach() && !isAdmin()) {
      items.push({ key: '/book-coach', icon: <ContactsOutlined />, label: 'Đặt huấn luyện viên', onClick: () => navigate('/book-coach') });
      if (user?.role === 'member') {
        items.push({ key: '/my-bookings', icon: <CalendarOutlined />, label: 'Lịch đặt của tôi', onClick: () => navigate('/my-bookings') });
      }
    }

    if (isAdmin()) {
      items.push(
        { key: '/admin-dashboard', icon: <UserOutlined />, label: 'Bảng điều khiển Admin', onClick: () => navigate('/admin-dashboard') },
        { key: '/schedule-management', icon: <ScheduleOutlined />, label: 'Quản lý Lịch', onClick: () => navigate('/schedule-management') },
        { key: '/post-approval', icon: <FileDoneOutlined />, label: 'Quản lý Bài Viết', onClick: () => navigate('/post-approval') },
        { key: '/admin/revenue-stats', icon: <BarChartOutlined />, label: 'Thống kê doanh thu', onClick: () => navigate('/admin/revenue-stats') },
      );
    }

    if (isCoach()) {
      items.push({ key: '/coach-dashboard', icon: <UserOutlined />, label: 'Bảng điều khiển Huấn luyện viên', onClick: () => navigate('/coach-dashboard') });
    }

    return items;
  };

  /* ---------- Xác định mục đang active ---------- */
  const selectedKey = /^\/(QuitPlanCalendar|FtndTest|quit-plan-detail)/.test(location.pathname)
    ? '/plan'
    : location.pathname;

  /* ---------- Tạo badge ---------- */
  const getBadgeText = () => {
    if (remainingDays && remainingDays > 0) {
      return remainingDays < 30
        ? `Premium ${remainingDays} ngày`
        : `Premium ${Math.floor(remainingDays / 30)} tháng`;
    }
    return user?.role === 'admin'
      ? 'Quản trị viên'
      : user?.role === 'coach'
        ? 'Huấn luyện viên'
        : 'Thành viên';
  };

  const badgeColor = remainingDays && remainingDays > 0
    ? '#52c41a'
    : user?.role === 'admin'
      ? '#ff4d4f'
      : '#52c41a';

  /* ---------- JSX ---------- */
  return (
    <Header className="navbar">
      <div className="navbar-content">
        {/* Logo */}
        <div className="navbar-logo" onClick={() => navigate('/')}>
          <span className="logo-text">QuitSmoking</span>
        </div>

        {/* Menu chính (desktop) */}
        <Menu
          mode="horizontal"
          selectedKeys={[selectedKey]}
          items={getMenuItems()}
          className="navbar-menu"
          overflowedIndicator={<MoreOutlined />}
        />

        {/* Nút hamburger (mobile) */}
        <Button
          className="mobile-menu-button"
          type="text"
          icon={<MenuOutlined />}
          onClick={() => setDrawerOpen(true)}
        />

        {/* User actions */}
        <div className="navbar-actions">
          {!user ? (
            <Space>
              <Button type="link" onClick={() => navigate('/login')}>Đăng nhập</Button>
              <Button type="primary" onClick={() => navigate('/register')}>Đăng ký</Button>
            </Space>
          ) : (
            <Space wrap={false}>
              {/* Thông báo */}
              <Button
                type="text"
                icon={<BellOutlined style={{ fontSize: 20, color: '#52c41a' }} />}
                onClick={() => navigate('/notifications')}
                style={{ marginRight: 4 }}
              />

              {/* Badge */}
              <Badge
                count={
                  remainingDays && remainingDays > 0
                    ? remainingDays < 30
                      ? `Premium ${remainingDays} ngày`
                      : `Premium ${Math.floor(remainingDays / 30)} tháng`
                    : user.role === 'admin'
                      ? 'Quản trị viên'
                      : user.role === 'coach'
                        ? 'Huấn luyện viên'
                        : 'Thành viên'
                }
                style={{
                  backgroundColor: remainingDays && remainingDays > 0 ? '#52c41a'
                    : user.role === 'admin' ? '#ff4d4f' : '#52c41a'
                }}
              />

              {/* Tên người dùng */}
              <span className="username-text">{user.name || user.email}</span>

              {/* Logout */}
              <Button type="text" icon={<LogoutOutlined />} onClick={handleLogout} danger>
                Logout
              </Button>
            </Space>
          )}
        </div>
      </div>

      {/* Drawer (mobile menu) */}
      <Drawer
        title="Menu"
        placement="left"
        onClose={() => setDrawerOpen(false)}
        open={drawerOpen}
        bodyStyle={{ padding: 0 }}
      >
        <Menu
          mode="inline"
          selectedKeys={[selectedKey]}
          items={getMenuItems()}
          style={{ borderRight: 0 }}
        />
      </Drawer>
    </Header>
  );
}
