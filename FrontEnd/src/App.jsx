import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import HomePage from "./pages/HomePage";
import ForgetPassword from "./pages/ForgetPassword";
import ResetPassword from "./pages/ResetPassword";
import GoogleRedirectHandler from "./components/GoogleRedirectHandler";
import FtndTest from "./pages/FtndTest";
import QuitPlanCalendar from "./pages/QuitPlanCalendar";
import QuitPlanDetail from "./pages/QuitPlanDetail";
import "./App.css";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<QuitPlanCalendar />} />
        <Route path="/" element={<HomePage />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/ForgetPassword" element={<ForgetPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/FtndTest" element={<FtndTest />} />
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
