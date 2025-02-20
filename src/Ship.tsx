import React, { useEffect } from 'react';

interface ShipProps {
  position: { x: number };
  size: number;
}

const Ship: React.FC<ShipProps> = ({ position, size }) => {
  useEffect(() => {
    const shipCanvas = document.getElementById('shipCanvas') as HTMLCanvasElement;
    if (shipCanvas) {
      const ctx = shipCanvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, size, size);
        ctx.fillStyle = 'blue';
        ctx.beginPath();
        ctx.moveTo(size / 2, 0);
        ctx.lineTo(size, size);
        ctx.lineTo(size / 2, size * 0.8);
        ctx.lineTo(0, size);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(size / 2, size * 0.6, size * 0.1, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }, [position, size]);

  return (
    <div
      className="absolute bottom-10 transform -translate-x-1/2 text-blue-500"
      style={{ left: `${position.x}px` }}
    >
      <canvas id="shipCanvas" width={size} height={size} />
    </div>
  );
};

export default Ship;