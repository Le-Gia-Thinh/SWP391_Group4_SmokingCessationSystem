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
import MemberBookings from "./pages/MemberBookings/MemberBookings";
import CoachDashboard from "./pages/CoachDashboard/CoachDashboard";
import AdminDashboard from "./pages/AdminDashboard/AdminDashboard";
import Navbar from "./layouts/Navbar";
import FtndTest from "./pages/FtndTest/FtndTest";
import QuitPlanCalendar from "./pages/QuitPlanning/QuitPlanCalendar";
import QuitPlanDetail from "./pages/QuitPlanning/QuitPlanDetail";
import RankingBoard from "./pages/Ranking/RankingBoard";
import Profile from './pages/Profile/Profile.jsx';
import Notifications from './pages/Notifications/Notifications.jsx';
import "./App.css";

const { Title, Paragraph } = Typography;

function App() {
  return (
    <AuthProvider>
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
          <Route path="/quit-plan-detail/:date" element={<QuitPlanDetail />} />
          <Route path="/RankingBoard" element={<RankingBoard />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/notifications" element={<Notifications />} />

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
            path="/admin-dashboard"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* Fallback route */}
          <Route path="*" element={<HomePage />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
