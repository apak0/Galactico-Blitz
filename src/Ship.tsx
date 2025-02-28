import React from "react";

interface ShipProps {
  position: { x: number; y: number };
  size: number;
  image: string;
  isFading: boolean;
}

const Ship: React.FC<ShipProps> = ({ position, size, image, isFading }) => {
  return (
    <div
      className={`absolute ${isFading ? "fade-out" : ""}`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${size}px`,
        height: `${size}px`,
        transform: "translate(-50%, -50%)",
        transformOrigin: "center",
      }}
    >
      <img
        src={image}
        alt="Spaceship"
        style={{
          width: "100%",
          height: "100%",
        }}
      />
    </div>
  );
};

export default Ship;