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
        transform: `translate(-50%, -50%)`,
        transformOrigin: "center",
      }}
    >
      <img
        src="/assets/enemy.png"
        alt="Enemy"
        style={{
          width: "100%",
          height: "100%",
          transformOrigin: "center",
        }}
      />
    </div>
  );
};

export default Enemy;