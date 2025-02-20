import React from "react";

interface ShipProps {
  position: { x: number };
  size: number;
  image: string;
}

const Ship: React.FC<ShipProps> = ({ position, size, image }) => {
  const scaledSize = size * 3; // Boyutu 3 katına çıkar

  return (
    <div
      className="absolute bottom-10 transform -translate-x-1/2"
      style={{
        left: `${position.x}px`,
        width: `${scaledSize}px`,
        height: `${scaledSize}px`,
      }}
    >
      <img
        src={image}
        alt="Spaceship"
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
};

export default Ship;
