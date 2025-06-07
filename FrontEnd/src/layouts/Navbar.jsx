// FrontEnd/src/components/Navbar.jsx
import React from "react";
import { Link, useNavigate } from "react-router-dom";
import Avatar from "../components/Avatar";
import axios from "axios";
import "./Navbar.css";

const Navbar = () => {
  const navigate = useNavigate();

  // Lấy user từ localStorage
  const storedUser = localStorage.getItem("user");
  const user = storedUser ? JSON.parse(storedUser) : null;

  // ====== BẮT ĐẦU PHẦN THÊM ======
  // Hàm xử lý logout
  const handleLogout = async () => {
    try {
      // Gửi request POST /logout để server destroy session (nếu có)
      await axios.post(
        "http://localhost:5000/api/auth/logout",
        {},
        {
          withCredentials: true, // bắt buộc nếu server cần cookie để hủy session
        }
      );
    } catch (err) {
      console.error("Error when calling /api/auth/logout:", err);
      // dù có lỗi vẫn tiếp tục xóa localStorage bên client
    }

    // Xóa user khỏi localStorage
    localStorage.removeItem("user");

    // Chuyển về trang login
    navigate("/login");
  };
  // ====== KẾT THÚC PHẦN THÊM ======

  return (
    <header className="navbar">
      <div className="navbar-logo">
        <Link to="/" className="logo-text">
          QuitSmoking
        </Link>
      </div>

      <nav className="navbar-links">
        <Link to="/">Home</Link>
        <Link to="/ranking">Ranking</Link>
        <Link to="/blog">Blog</Link>
        <Link to="/membership">Membership</Link>
        {user?.role === "coach" ? (
          <Link to="/my-appointments">My Schedule</Link>
        ) : (
          <Link to="/coaches">Coaches</Link>
        )}
      </nav>

      <div className="navbar-actions">
        {!user ? (
          <>
            <Link to="/login" className="btn-outline">
              Sign in
            </Link>
            <Link to="/register" className="btn-solid">
              Sign up
            </Link>
          </>
        ) : (
          <>
            {/* Giữ nguyên code Avatar cũ */}
            <Avatar name={user.name || user.email} avatarUrl={user.avatar} />

            {/* ====== THÊM NÚT Logout ====== */}
            <button onClick={handleLogout} className="btn-logout">
              Logout
            </button>
          </>
        )}
      </div>
    </header>
  );
};

export default Navbar;
