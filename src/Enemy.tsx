import React from "react";

interface EnemyProps {
  enemy: { id: number; x: number; y: number; hits: number; image: string; isBoss?: boolean; hp?: number };
  isFading: boolean;
}

const Enemy: React.FC<EnemyProps> = ({ enemy, isFading }) => {
  const size = enemy.isBoss ? 100 : 30; // Final boss daha büyük
  return (
    <div
      className={`absolute ${isFading ? "fade-out" : ""}`}
      style={{
        left: `${enemy.x}px`,
        top: `${enemy.y}px`,
        width: `${size}px`,
        height: `${size}px`,
        transform: "translate(-50%, -50%)",
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