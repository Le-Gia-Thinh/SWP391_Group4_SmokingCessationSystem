import React, { useState } from "react";
import "./Avatar.css";

const CustomAvatar = ({ name, avatarUrl, size = 36 }) => {
  const [imgError, setImgError] = useState(false);

  const getInitials = (name) => {
    if (!name) return "?";
    const parts = name.trim().split(" ");
    return parts.length === 1
      ? parts[0][0].toUpperCase()
      : (parts[0][0] + parts[1][0]).toUpperCase();
  };

  const handleImgError = () => {
    setImgError(true);
  };

  return avatarUrl && !imgError ? (
    <img
      src={avatarUrl}
      alt="avatar"
      className="avatar-img"
      onError={handleImgError}
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        objectFit: "cover",
      }}
    />
  ) : (
    <div
      className="avatar-circle"
      style={{
        width: size,
        height: size,
        fontSize: size / 2,
        borderRadius: "50%",
        backgroundColor: "#ccc",
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: "bold",
      }}
    >
      {getInitials(name)}
    </div>
  );
};

export default CustomAvatar;