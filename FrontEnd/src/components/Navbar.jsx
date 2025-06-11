import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Avatar from "./Avatar";
import axios from "axios";
import "./Navbar.css";

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const storedUser = localStorage.getItem("user");
  const user = storedUser ? JSON.parse(storedUser) : null;

  const handleLogout = async () => {
    try {
      await axios.post(
        "http://localhost:5000/api/auth/logout",
        {},
        {
          withCredentials: true,
        }
      );
    } catch (err) {
      console.error("Error when calling /api/auth/logout:", err);
    }

    localStorage.removeItem("user");
    navigate("/login");
  };

  const handlePlanClick = async () => {
    if (!user) {
      navigate("/login");
      return;
    }

    try {
      const res = await axios.get(
        `http://localhost:5000/api/ftnd/exists/${user.id}`,
        { withCredentials: true }
      );

      const hasFtnd = res.data?.exists;
      navigate(hasFtnd ? "/QuitPlanCalendar" : "/FtndTest");
    } catch (err) {
      console.error("Lỗi khi kiểm tra FTND:", err);
      navigate("/FtndTest");
    }
  };

  return (
    <header className="navbar">
      <div className="navbar-logo">
        <Link to="/" className="logo-text">
          QuitSmoking
        </Link>
      </div>

      <nav className="navbar-links">
        <Link to="/">Home</Link>

        <span
          onClick={handlePlanClick}
          className={`nav-link ${
            location.pathname.startsWith("/FtndTest") ||
            location.pathname.startsWith("/quit-plan")
              ? "active"
              : ""
          }`}
        >
          Plan
        </span>

        <Link to="/ranking">Ranking</Link>
        <Link to="/blog">Blog</Link>
        <Link to="/membership">Membership</Link>
        <Link to="/coaches">Coaches</Link>
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
            <Avatar name={user.name || user.email} avatarUrl={user.avatar} />
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
