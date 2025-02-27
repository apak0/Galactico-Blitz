import React from "react";

interface ScoreAnimationProps {
  animation: { value: number; id: string; x: number; y: number };
}

const ScoreAnimation: React.FC<ScoreAnimationProps> = ({ animation }) => {
  return (
    <div
      key={animation.id}
      className={`absolute text-lg font-bold ${
        animation.value > 0 ? "text-green-500" : "text-red-500"
      }`}
      style={{
        left: `${animation.x}px`,
        top: `${animation.y}px`,
        transform: "translate(-50%, -50%)",
        animation: "fadeOut 1s linear forwards",
      }}
    >
      {animation.value > 0 ? "+" : ""}
      {animation.value}
    </div>
  );
};

// fadeOut animasyonu için CSS (index.css veya ayrı bir stil dosyasında)
export default ScoreAnimation;
