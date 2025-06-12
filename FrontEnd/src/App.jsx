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
import BookingPage from "./pages/BookingPage/BookingPage";
import CoachDashboard from "./pages/CoachDashboard/CoachDashboard";
import AdminDashboard from "./pages/AdminDashboard/AdminDashboard";
import Navbar from "./layouts/Navbar";
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
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/home" element={<HomePage />} />
          <Route path="/login" element={
            <ProtectedRoute requireAuth={false}>
              <Login />
            </ProtectedRoute>
          } />
          <Route path="/register" element={
            <ProtectedRoute requireAuth={false}>
              <Register />
            </ProtectedRoute>
          } />
          <Route path="/ForgetPassword" element={<ForgetPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="/auth/google/redirect" element={<GoogleRedirectHandler />} />
          <Route path="/book-coach" element={<BookingPage />} />
          <Route path="/ranking" element={<RankingPage />} />
          <Route path="/blog" element={<BlogPage />} />
          <Route path="/membership" element={<MembershipPage />} />
          <Route path="/coaches" element={<CoachesPage />} />
          <Route path="/FtndTest" element={<FtndTest />} />
          <Route path="/QuitPlanCalendar" element={<QuitPlanCalendar />} />
          <Route path="/quit-plan-detail/:date" element={<QuitPlanDetail />} />
          {/* Protected routes - Coach Dashboard */}
          <Route path="/coach-dashboard" element={
            <ProtectedRoute allowedRoles={['coach']}>
              <CoachDashboard />
            </ProtectedRoute>
          } />

          {/* Protected routes - Admin Dashboard */}
          <Route path="/admin-dashboard" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          } />

          {/* Fallback route */}
          <Route path="*" element={<HomePage />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
