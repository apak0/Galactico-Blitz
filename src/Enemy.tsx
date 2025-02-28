import React from "react";

interface EnemyProps {
  enemy: { id: number; x: number; y: number; hits: number; image: string; isBoss?: boolean; hp?: number; rotation?: number };
  isFading: boolean;
  isDamaged?: boolean; // Hasar alma efekti için
}

const Enemy: React.FC<EnemyProps> = ({ enemy, isFading, isDamaged }) => {
  const size = enemy.isBoss ? 200 : 30; // Final boss boyutunu 2 katına çıkardık (200px)
  return (
    <div
      className={`absolute ${isFading ? "fade-out" : ""} ${isDamaged ? "damage-effect" : ""}`}
      style={{
        left: `${enemy.x}px`,
        top: `${enemy.y}px`,
        width: `${size}px`,
        height: `${size}px`,
        transform: `translate(-50%, -50%) rotate(${enemy.rotation || 0}deg)`, // Dönme animasyonu
        transition: "transform 0.5s ease-in-out", // Smooth geçiş
      }}
    >
      <img
        src={enemy.image}
        alt={enemy.isBoss ? "Final Boss" : "Enemy"}
        style={{
          width: "100%",
          height: "100%",
        }}
      />
    </div>
  );
};

export default Enemy;