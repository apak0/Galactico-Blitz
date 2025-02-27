import React from "react";

interface ShipProps {
  position: { x: number; y: number }; // Hem x hem y koordinatını al
  size: number;
  image: string;
  isFading: boolean;
}

const Ship: React.FC<ShipProps> = ({ position, size, image, isFading }) => {
  return (
    <div
      className={`absolute ${isFading ? "fade-out" : ""}`}
      style={{
        left: `${position.x}px`, // Yatay pozisyon
        top: `${position.y}px`, // Dikey pozisyon ekledik
        width: `${size}px`,
        height: `${size}px`,
        transform: "translate(-50%, -50%)", // Merkezden hizalı
        transformOrigin: "center", // Animasyon merkezi
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