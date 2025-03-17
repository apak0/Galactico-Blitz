import React from "react";
import "./index.css"

interface ScoreAnimationProps {
  animation: { value: number; id: string; x: number; y: number };
}

const ScoreAnimation: React.FC<ScoreAnimationProps> = ({ animation }) => {
  console.log("Rendering Score Animation:", animation); 
  return (
    <div
      key={animation.id}
      className={`absolute text-lg font-bold ${
        animation.value > 0 ? "text-green-600" : "text-red-600"
      }`}
      style={{
        left: `${animation.x}px`,
        top: `${animation.y}px`,
        transform: "translate(-50%, -50%)",
        animation: "fadeOut 1s linear forwards",
      }}
    >
      {animation.value> 0 ? "+" : ""}
      {animation.value *2}
    </div>
  );
};



export default ScoreAnimation;