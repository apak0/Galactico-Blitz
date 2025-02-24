import React from "react";

interface ScoreAnimationProps {
  animation: { value: number; id: string; x: number; y: number };
}

const ScoreAnimation: React.FC<ScoreAnimationProps> = ({ animation }) => {
  return (
    <div
      className={`absolute text-lg font-bold ${
        animation.value > 0 ? "text-green-500" : "text-red-500"
      }`}
      style={{
        left: `${animation.x}px`,
        top: `${animation.y}px`,
        transform: "translate(-50%, -50%)",
        animation: "float-up 1s ease-out forwards",
      
      }}
    >
      {animation.value > 0 ? "+" : ""}
      {animation.value}
    </div>
  );
};

export default ScoreAnimation;