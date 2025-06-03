import React from "react";
import { Link } from "react-router-dom";
import Avatar from "./Avatar"; // ⬅️ Avatar component bạn đã tạo
import "./Navbar.css";

const Navbar = () => {
  const user = JSON.parse(localStorage.getItem("user")); // lấy user từ localStorage

  return (
    <header className="navbar">
      <div className="navbar-logo">
        <Link to="/" className="logo-text">QuitSmoking</Link>
      </div>

      <nav className="navbar-links">
        <Link to="/">Home</Link>
        <Link to="/ranking">Ranking</Link>
        <Link to="/blog">Blog</Link>
        <Link to="/membership">Membership</Link>
        <Link to="/coaches">Coaches</Link>
      </nav>

      <div className="navbar-actions">
        {!user ? (
          <>
            <Link to="/login" className="btn-outline">Sign in</Link>
            <Link to="/register" className="btn-solid">Sign up</Link>
          </>
        ) : (
          <Avatar name={user.name} avatarUrl={user.avatar} />
        )}
      </div>
    </header>
  );
};

export default Navbar;
