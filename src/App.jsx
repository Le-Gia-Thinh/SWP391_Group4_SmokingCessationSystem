import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import HomePage from "./pages/HomePage";
import "./App.css";
import ForgetPassword from "./pages/ForgetPassword";
import RestPassword from "./pages/ResetPassword";
import VerifyCode from "./pages/VerifyCode";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} /> {/* 👈 trang gốc */}
        <Route path="/home" element={<HomePage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/ForgetPassword" element={<ForgetPassword />} />
        <Route path="/ResetPassword" element={<RestPassword />} />
        <Route path="/VerifyCode" element={<VerifyCode />} />
        <Route path="*" element={<Login />} />
      </Routes>
    </Router>
  );
}

export default App;
