import React from "react";

interface EnemyProps {
  enemy: { id: number; x: number; y: number; hits: number };
  isFading: boolean;
}

const Enemy: React.FC<EnemyProps> = ({ enemy, isFading }) => {
  return (
    <div
      className={`absolute ${isFading ? "fade-out" : ""}`}
      style={{
        left: `${enemy.x}px`,
        top: `${enemy.y}px`,
        width: "30px",
        height: "30px",
        transform: `translate(-50%, -50%) `, // Merkezde hizalı ve dönmüş
        transformOrigin: "center", // Ana div'in merkezi
      }}
    >
      <img
        src="/assets/enemy.png"
        alt="Enemy"
        style={{
          width: "100%",
          height: "100%",
          transformOrigin: "center", // Görüntünün merkezi
        }}
      />
    </div>
  );
};

export default Enemy;