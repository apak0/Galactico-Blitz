import React from "react";

interface BulletProps {
  bullet: { id: number; x: number; y: number; isNeon?: boolean };
}

const Bullet: React.FC<BulletProps> = ({ bullet }) => {
  return (
    <div
      className="absolute"
      style={{
        left: `${bullet.x}px`,
        top: `${bullet.y}px`,
        width: bullet.isNeon ? "5px" : "10px", // Neon mermi için daralt, mevcut sarı mermi için 2px
        height: bullet.isNeon ? "20px" : "10px", // Neon mermi için uzat, mevcut sarı mermi için 4px
        backgroundColor: bullet.isNeon ? "#00FFFF" : "#FACC15", // Neon mavi (#00FFFF) veya mevcut sarı (#FACC15)
        borderRadius: bullet.isNeon ? "0" : "50%", // Neon mermi için yuvarlak kenarları kaldır, sarı mermi için yuvarlak
        boxShadow: bullet.isNeon ? "0 0 10px #00FFFF, 0 0 20px #00FFFF" : "none", // Neon efekti
        transform: "translate(-50%, -50%)", // Merkezden hizalı
      }}
    />
  );
};

export default Bullet;