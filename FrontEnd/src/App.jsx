import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Card, Typography, Space } from "antd";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login/Login";
import Register from "./pages/Register/Register";
import HomePage from "./pages/HomePage/HomePage";
import ForgetPassword from "./pages/ResetPassword/ForgetPassword";
import ResetPassword from "./pages/ResetPassword/ResetPassword";
import GoogleRedirectHandler from "./components/GoogleRedirectHandler";
import FtndTest from "./pages/FtndTest";
import QuitPlanCalendar from "./pages/QuitPlanCalendar";
import QuitPlanDetail from "./pages/QuitPlanDetail";
import "./App.css";

const { Title, Paragraph } = Typography;

// Placeholder components for missing pages
const RankingPage = () => (
  <div style={{ minHeight: '100vh', width: '100%' }}>
    <Navbar />
    <div style={{ padding: '50px 24px', width: '100%' }}>
      <Card style={{ maxWidth: 1200, margin: '0 auto' }}>
        <Space direction="vertical" size="large" style={{ width: '100%', textAlign: 'center' }}>
          <Title level={1}>🏆 Ranking Page</Title>
          <Paragraph style={{ fontSize: '18px' }}>
            This page will show user rankings and achievements in their smoking cessation journey.
          </Paragraph>
        </Space>
      </Card>
    </div>
  </div>
);

const BlogPage = () => (
  <div style={{ minHeight: '100vh', width: '100%' }}>
    <Navbar />
    <div style={{ padding: '50px 24px', width: '100%' }}>
      <Card style={{ maxWidth: 1200, margin: '0 auto' }}>
        <Space direction="vertical" size="large" style={{ width: '100%', textAlign: 'center' }}>
          <Title level={1}>📝 Blog Page</Title>
          <Paragraph style={{ fontSize: '18px' }}>
            This page will show articles and tips about quitting smoking from experts and community members.
          </Paragraph>
        </Space>
      </Card>
    </div>
  </div>
);

const MembershipPage = () => (
  <div style={{ minHeight: '100vh', width: '100%' }}>
    <Navbar />
    <div style={{ padding: '50px 24px', width: '100%' }}>
      <Card style={{ maxWidth: 1200, margin: '0 auto' }}>
        <Space direction="vertical" size="large" style={{ width: '100%', textAlign: 'center' }}>
          <Title level={1}>💎 Membership Page</Title>
          <Paragraph style={{ fontSize: '18px' }}>
            This page will show membership plans and benefits for premium users.
          </Paragraph>
        </Space>
      </Card>
    </div>
  </div>
);

const CoachesPage = () => (
  <div style={{ minHeight: '100vh', width: '100%' }}>
    <Navbar />
    <div style={{ padding: '50px 24px', width: '100%' }}>
      <Card style={{ maxWidth: 1200, margin: '0 auto' }}>
        <Space direction="vertical" size="large" style={{ width: '100%', textAlign: 'center' }}>
          <Title level={1}>👥 Coaches Page</Title>
          <Paragraph style={{ fontSize: '18px' }}>
            This page will show all available coaches and their specializations.
          </Paragraph>
        </Space>
      </Card>
    </div>
  </div>
);

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/ForgetPassword" element={<ForgetPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/FtndTest" element={<FtndTest />} />
        <Route path="/QuitPlanCalendar" element={<QuitPlanCalendar />} />
        <Route path="/quit-plan-detail/:date" element={<QuitPlanDetail />} />
        {/* Route này phải được đặt TRƯỚC route wildcard (*) */}
        <Route
          path="/auth/google/redirect"
          element={<GoogleRedirectHandler />}
        />
        {/* Route wildcard phải được đặt cuối cùng */}
        <Route path="*" element={<Login />} />
      </Routes>
    </Router>
  );
}

export default App;
