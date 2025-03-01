import React from "react";

interface BulletProps {
  bullet: {
    id: string;
    x: number;
    y: number;
    isNeon?: boolean;
    isRedNeon?: boolean;
    isBossBullet?: boolean;
  };
}

const Bullet: React.FC<BulletProps> = ({ bullet }) => {
  return (
    <div
      className="absolute"
      style={{
        left: `${bullet.x}px`,
        top: `${bullet.y}px`,
        width: bullet.isBossBullet ? "5px" : bullet.isNeon ? "5px" : "10px",
        height: bullet.isBossBullet ? "20px" : bullet.isNeon ? "20px" : "10px",
        backgroundColor: bullet.isBossBullet
          ? "#E100FF" // Neon lacivert (boss mermisi)
          : bullet.isNeon
          ? "#00FFFF"
          : bullet.isRedNeon
          ? "#FF0000"
          : "#FACC15",
        borderRadius: bullet.isBossBullet || bullet.isNeon ? "0" : "50%",
        boxShadow: bullet.isBossBullet
          ? "0 0 10px #E2E2E2, 0 0 20px #E2E2E2" // Neon lacivert efekt
          : bullet.isNeon
          ? "0 0 10px #00FFFF, 0 0 20px #00FFFF"
          : bullet.isRedNeon
          ? "0 0 10px #FF0000, 0 0 20px #FF0000"
          : "none",
        transform: "translate(-50%, -50%)",
      }}
    />
  );
};

export default Bullet;