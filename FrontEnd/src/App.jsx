import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import HomePage from "./pages/HomePage";
import ForgetPassword from "./pages/ForgetPassword";
import ResetPassword from "./pages/ResetPassword";
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
        <Route path="/ResetPassword" element={<ResetPassword />} />
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
