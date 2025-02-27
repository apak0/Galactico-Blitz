import React from "react";

interface BulletProps {
  bullet: { id: number; x: number; y: number; isNeon?: boolean; isRedNeon?: boolean };
}

const Bullet: React.FC<BulletProps> = ({ bullet }) => {
  return (
    <div
      className="absolute"
      style={{
        left: `${bullet.x}px`,
        top: `${bullet.y}px`,
        width: bullet.isNeon ? "5px" : "10px", // Neon mermi (skor >= 500) için daralt, diğerleri için 2px
        height: bullet.isNeon ? "20px" : "10px", // Neon mermi (skor >= 500) için uzat, diğerleri için 4px
        backgroundColor: bullet.isNeon
          ? "#00FFFF" // Neon mavi (skor >= 500)
          : bullet.isRedNeon
          ? "#FF0000" // Kırmızı neon (skor >= 200 ve < 500)
          : "#FACC15", // Sarı (skor < 200)
        borderRadius: bullet.isNeon ? "0" : "50%", // Neon mermi için yuvarlak kenarları kaldır, diğerleri yuvarlak
        boxShadow: bullet.isNeon
          ? "0 0 10px #00FFFF, 0 0 20px #00FFFF" // Neon mavi efekti
          : bullet.isRedNeon
          ? "0 0 10px #FF0000, 0 0 20px #FF0000" // Kırmızı neon efekti
          : "none", // Sarı mermilerde efekt yok
        transform: "translate(-50%, -50%)", // Merkezden hizalı
      }}
    />
  );
};

export default Bullet;