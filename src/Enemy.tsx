import React, { useEffect } from 'react';

interface EnemyProps {
  enemy: { id: number; x: number; y: number };
}

const Enemy: React.FC<EnemyProps> = ({ enemy }) => {
  useEffect(() => {
    const enemyCanvas = document.getElementById(`enemyCanvas-${enemy.id}`) as HTMLCanvasElement;
    if (enemyCanvas) {
      const ctx = enemyCanvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, 30, 30);
        ctx.fillStyle = 'red';
        ctx.beginPath();
        ctx.moveTo(15, 0);
        ctx.lineTo(30, 15);
        ctx.lineTo(15, 30);
        ctx.lineTo(0, 15);
        ctx.closePath();
        ctx.fill();
      }
    }
  }, [enemy]);

  return (
    <div
      className="absolute transform -translate-x-1/2 -translate-y-1/2"
      style={{
        left: `${enemy.x}px`,
        top: `${enemy.y}px`
      }}
    >
      <canvas id={`enemyCanvas-${enemy.id}`} width="30" height="30" />
    </div>
  );
};

export default Enemy;