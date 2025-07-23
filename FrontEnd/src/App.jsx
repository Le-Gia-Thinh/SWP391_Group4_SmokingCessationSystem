import React from "react";
import UserProgressStats from "./pages/QuitPlanStats/UserProgressStats";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Card, Typography, Space, Button } from "antd";
import { AuthProvider } from "./contexts/AuthContext";
import { SocketProvider } from "./contexts/SocketContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login/Login";
import Register from "./pages/Register/Register";
import HomePage from "./pages/HomePage/HomePage";
import ForgetPassword from "./pages/ResetPassword/ForgetPassword";
import ResetPassword from "./pages/ResetPassword/ResetPassword";
import GoogleRedirectHandler from "./components/GoogleRedirectHandler";
import BookingPage from "./pages/BookingPage/BookingPage";
import MemberBookings from "./pages/MemberBookings/MemberBookings";
import CoachDashboard from "./pages/CoachDashboard/CoachDashboard";
import AdminPage from "./pages/Admin_Page/AdminPage";
import ScheduleManagement from "./pages/ScheduleManagement/ScheduleManagement";
import FtndTest from "./pages/FtndTest/FtndTest";
import QuitPlanCalendar from "./pages/QuitPlanning/QuitPlanCalendar";
import QuitPlanDetail from "./pages/QuitPlanning/QuitPlanDetail";
import RankingBoard from "./pages/Ranking/RankingBoard";
import Profile from "./pages/Profile/Profile.jsx";
import Notifications from "./pages/Notifications/Notifications.jsx";
import "./App.css";
import CheckoutPage from "./pages/Payment/CheckoutPage";
import PostApproval from "./pages/PostApproval/PostApproval";
import CommunityPage from "./pages/Community/CommunityPage";
import RevenueStats from "./pages/AdminManageCoach/RevenueStats.jsx";
import AdminManageCoach from "./pages/AdminManageCoach/AdminManageCoach.jsx";
const { Title, Paragraph } = Typography;
import PaymentSuccess from "./pages/Payment/PaymentSuccess";
import PackageCrudPage from "./pages/Admin_Page/PackageCrudPage";
import AchievementCrudPage from "./pages/Admin_Page/AchievementCrudPage";
function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <Router>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/home" element={<HomePage />} />
            <Route
              path="/login"
              element={
                <ProtectedRoute requireAuth={false}>
                  <Login />
                </ProtectedRoute>
              }
            />
            <Route
              path="/register"
              element={
                <ProtectedRoute requireAuth={false}>
                  <Register />
                </ProtectedRoute>
              }
            />
            <Route path="/ForgetPassword" element={<ForgetPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />
            <Route
              path="/auth/google/redirect"
              element={<GoogleRedirectHandler />}
            />
            <Route path="/book-coach" element={<BookingPage />} />
            <Route path="/FtndTest" element={<FtndTest />} />
            <Route path="/QuitPlanCalendar" element={<QuitPlanCalendar />} />
            <Route
              path="/quit-plan-detail/:date"
              element={<QuitPlanDetail />}
            />
            <Route path="/RankingBoard" element={<RankingBoard />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/user/stats" element={<UserProgressStats />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            {/* <Route path="/blog" element={<BlogList />} />
            <Route path="/chat" element={<ChatPage />} /> */}
            <Route path="/payment-success" element={<PaymentSuccess />} />
            <Route path="/community" element={<CommunityPage />} />

            {/* Protected routes - Member Bookings */}
            <Route
              path="/my-bookings"
              element={
                <ProtectedRoute allowedRoles={["member"]}>
                  <MemberBookings />
                </ProtectedRoute>
              }
            />

            {/* Protected routes - Coach Dashboard */}
            <Route
              path="/coach-dashboard"
              element={
                <ProtectedRoute allowedRoles={["coach"]}>
                  <CoachDashboard />
                </ProtectedRoute>
              }
            />

            {/* Protected routes - Admin Dashboard */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <AdminPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/adminManageCoach"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <AdminManageCoach />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/packages"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <PackageCrudPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/achievements"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <AchievementCrudPage />
                </ProtectedRoute>
              }
            />
            {/* Protected routes - Schedule Management */}
            <Route
              path="/schedule-management"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <ScheduleManagement />
                </ProtectedRoute>
              }
            />

            {/* Protected routes - Post Approval */}
            <Route
              path="/post-approval"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <PostApproval />
                </ProtectedRoute>
              }
            />

            {/* Protected routes - Admin Revenue Stats */}
            <Route
              path="/admin/revenue-stats"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <RevenueStats />
                </ProtectedRoute>
              }
            />

            {/* Fallback route */}
            <Route path="*" element={<HomePage />} />
          </Routes>
        </Router>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
