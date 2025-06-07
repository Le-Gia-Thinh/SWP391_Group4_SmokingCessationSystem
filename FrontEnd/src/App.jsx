import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// Các trang đã đặt đúng theo cấu trúc
import Login from "./pages/Login/Login";
import Register from "./pages/Register/Register";
import HomePage from "./pages/HomePage/HomePage";
import ForgetPassword from "./pages/ResetPassword/ForgetPassword";
import ResetPassword from "./pages/ResetPassword/ResetPassword";
import AvailableCoaches from "./pages/AvailableCoaches";


import GoogleRedirectHandler from "./components/GoogleRedirectHandler";

import "./App.css";

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
        <Route path="/auth/google/redirect" element={<GoogleRedirectHandler />} />
        <Route path="/coaches" element={<AvailableCoaches />} />
        <Route path="*" element={<Login />} />
      </Routes>
    </Router>
  );
}

export default App;
