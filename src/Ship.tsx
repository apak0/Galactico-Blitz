import React from 'react';

interface ShipProps {
  position: { x: number };
  size: number;
}

const Ship: React.FC<ShipProps> = ({ position, size }) => {
  const scaledSize = size * 3; // Boyutu 3 katına çıkar

  return (
    <div
      className="absolute bottom-10 transform -translate-x-1/2"
      style={{ left: `${position.x}px`, width: `${scaledSize}px`, height: `${scaledSize}px` }}
    >
      <img src="/assets/spaces-ship-small.png" alt="Spaceship" style={{ width: '100%', height: '100%' }} />
    </div>
  );
};

export default Ship;