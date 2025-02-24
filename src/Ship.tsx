import React from "react";

interface ShipProps {
  position: { x: number };
  size: number;
  image: string;
  isFading: boolean;
}

const Ship: React.FC<ShipProps> = ({ position, size, image, isFading }) => {
  return (
    <div
      className={`absolute bottom-10 transform -translate-x-1/2 ${isFading ? "fade-out" : ""}`}
      style={{
        left: `${position.x}px`,
        width: `${size}px`,
        height: `${size}px`,
      }}
    >
      <img src={image} alt="Spaceship" style={{ width: "100%", height: "100%" }} />
    </div>
  );
};

export default Ship;