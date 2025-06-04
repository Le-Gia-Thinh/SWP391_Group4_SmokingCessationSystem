import React from "react";
import "./Avatar.css";

const Avatar = ({ name, avatarUrl, size = 36 }) => {
    const getInitials = (name) => {
        if (!name) return "?";
        const parts = name.trim().split(" ");
        return parts.length === 1
            ? parts[0][0].toUpperCase()
            : (parts[0][0] + parts[1][0]).toUpperCase();
    };

    return avatarUrl ? (
        <img
            src={avatarUrl}
            alt="avatar"
            className="avatar-img"
            style={{ width: size, height: size }}
        />
    ) : (
        <div
            className="avatar-circle"
            style={{ width: size, height: size, fontSize: size / 2 }}
        >
            {getInitials(name)}
        </div>
    );
};

export default Avatar;
