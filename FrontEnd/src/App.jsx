import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login/Login";
import Register from "./pages/Register/Register";
import HomePage from "./pages/HomePage/HomePage";
import ForgetPassword from "./pages/ResetPassword/ForgetPassword";
import ResetPassword from "./pages/ResetPassword/ResetPassword";
import GoogleRedirectHandler from "./components/GoogleRedirectHandler";
import UserDashboard from "./pages/UserDashboard/UserDashboard";
import CoachDashboard from "./pages/CoachDashboard/CoachDashboard";
import AdminDashboard from "./pages/AdminDashboard/AdminDashboard";
import "./App.css";

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

          {/* Protected routes - User Dashboard */}
          <Route path="/user-dashboard" element={
            <ProtectedRoute allowedRoles={['user', 'coach', 'admin']}>
              <UserDashboard />
            </ProtectedRoute>
          } />

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
