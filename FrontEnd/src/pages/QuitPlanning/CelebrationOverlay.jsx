// components/CelebrationOverlay.jsx
import React, { useEffect } from "react";
import confetti from "canvas-confetti";
import { Howl } from "howler";

const CelebrationOverlay = ({ onClose }) => {
  useEffect(() => {
    // 🎧 Phát âm thanh nếu người dùng đã tương tác
    const playSound = () => {
      const sound = new Howl({
        src: ["/success.mp3"],
        volume: 0.7,
      });
      sound.play();
    };

    // Nếu chưa click, đợi click đầu tiên
    const handleFirstClick = () => {
      playSound();
      window.removeEventListener("click", handleFirstClick);
    };

    // Phát âm thanh ngay nếu trình duyệt cho phép
    try {
      playSound();
    } catch {
      window.addEventListener("click", handleFirstClick);
    }

    // 🎊 Confetti animation
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;

    const interval = setInterval(() => {
      if (Date.now() > animationEnd) return clearInterval(interval);
      confetti({
        particleCount: 70,
        startVelocity: 30,
        spread: 360,
        origin: { x: Math.random(), y: Math.random() - 0.2 },
      });
    }, 250);

    const timeout = setTimeout(() => {
      onClose(); // auto tắt sau 3s
    }, duration + 500);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
      window.removeEventListener("click", handleFirstClick);
    };
  }, []);

  return (
    <div className="celebration-overlay">
      <div className="celebration-text">🎉 Bạn đã hoàn thành xuất sắc! 🎉</div>
    </div>
  );
};

export default CelebrationOverlay;
