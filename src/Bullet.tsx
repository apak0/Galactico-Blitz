import React from 'react';

interface BulletProps {
  bullet: { id: number; x: number; y: number };
}

const Bullet: React.FC<BulletProps> = ({ bullet }) => {
  return (
    <div
      className="absolute w-2 h-4 bg-yellow-400 rounded"
      style={{
        left: `${bullet.x}px`,
        top: `${bullet.y}px`,
        transform: 'translate(-50%, -50%)'
      }}
    />
  );
};

export default Bullet;