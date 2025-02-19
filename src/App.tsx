import React, { useEffect, useState, useCallback, useRef } from 'react';

interface Position {
  x: number;
  y: number;
}

interface Enemy extends Position {
  id: number;
  level: number;
  hits: number;
}

interface Bullet extends Position {
  id: number;
}

interface ScoreAnimation {
  value: number;
  id: string;
  x: number;
  y: number;
}

function App() {
  const [shipPosition, setShipPosition] = useState({ x: window.innerWidth / 2 });
  const [bullets, setBullets] = useState<Bullet[]>([]);
  const [enemies, setEnemies] = useState<Enemy[]>([]);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const [scoreAnimations, setScoreAnimations] = useState<ScoreAnimation[]>([]);
  const [isScoreDecreasing, setIsScoreDecreasing] = useState(false);
  
  const keysPressed = useRef<{ [key: string]: boolean }>({});
  const animationFrameId = useRef<number>();
  const animationCounter = useRef(0);

  const generateUniqueId = useCallback(() => {
    animationCounter.current += 1;
    return `${Date.now()}-${animationCounter.current}`;
  }, []);

  const moveShip = useCallback(() => {
    setShipPosition((prev) => {
      let newX = prev.x;
      const moveSpeed = 8;

      if (keysPressed.current['ArrowLeft']) {
        newX = Math.max(30, prev.x - moveSpeed);
      }
      if (keysPressed.current['ArrowRight']) {
        newX = Math.min(window.innerWidth - 30, prev.x + moveSpeed);
      }

      return { x: newX };
    });

    animationFrameId.current = requestAnimationFrame(moveShip);
  }, []);

  const shoot = useCallback(() => {
    setBullets(prev => [...prev, {
      id: Date.now(),
      x: shipPosition.x,
      y: window.innerHeight - 100
    }]);
  }, [shipPosition.x]);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (gameOver) return;
    
    keysPressed.current[event.key] = true;
    
    if (event.key === ' ') {
      shoot();
    }
  }, [gameOver, shoot]);

  const handleKeyUp = useCallback((event: KeyboardEvent) => {
    delete keysPressed.current[event.key];
  }, []);

  // Timer
  useEffect(() => {
    if (gameOver) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 0) {
          setGameOver(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameOver]);

  // Keyboard controls
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    animationFrameId.current = requestAnimationFrame(moveShip);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [handleKeyDown, handleKeyUp, moveShip]);

  // Game loop
  useEffect(() => {
    if (gameOver) return;

    const gameLoop = setInterval(() => {
      // Move bullets
      setBullets(prev => 
        prev
          .map(bullet => ({ ...bullet, y: bullet.y - 5 }))
          .filter(bullet => bullet.y > 0)
      );

      // Move enemies
      setEnemies(prev => {
        const newEnemies = prev
          .map(enemy => ({ ...enemy, y: enemy.y + 2 }))
          .filter(enemy => {
            if (enemy.y >= window.innerHeight) {
              // Enemy escaped, decrease score
              setScore(s => s - 10);
              setIsScoreDecreasing(true);
              setTimeout(() => setIsScoreDecreasing(false), 500);
              setScoreAnimations(prev => [...prev, {
                value: -10,
                id: generateUniqueId(),
                x: enemy.x,
                y: window.innerHeight - 50
              }]);
              return false;
            }
            return true;
          });

        // Add new enemy randomly
        if (Math.random() < 0.02) {
          newEnemies.push({
            id: Date.now(),
            x: Math.random() * (window.innerWidth - 60) + 30,
            y: 0,
            level: Math.floor(Math.random() * 3) + 1,
            hits: 0
          });
        }

        return newEnemies;
      });

      // Check collisions
      setBullets(prev => {
        const remainingBullets = [...prev];
        setEnemies(prevEnemies => {
          const remainingEnemies = prevEnemies.filter(enemy => {
            const hitByBullet = remainingBullets.some((bullet, bulletIndex) => {
              if (
                Math.abs(bullet.x - enemy.x) < 30 &&
                Math.abs(bullet.y - enemy.y) < 30
              ) {
                remainingBullets.splice(bulletIndex, 1);
                enemy.hits += 1;
                if (enemy.hits >= enemy.level) {
                  setScore(s => s + enemy.level * 10);
                  setScoreAnimations(prev => [...prev, {
                    value: enemy.level * 10,
                    id: generateUniqueId(),
                    x: enemy.x,
                    y: enemy.y
                  }]);
                  return false;
                }
                return true;
              }
              return false;
            });
            return !hitByBullet;
          });
          return remainingEnemies;
        });
        return remainingBullets;
      });

      // Clean up old score animations
      setScoreAnimations(prev => 
        prev.filter(animation => {
          const [timestamp] = animation.id.split('-');
          return Date.now() - parseInt(timestamp) < 1000;
        })
      );
    }, 16);

    return () => clearInterval(gameLoop);
  }, [gameOver, generateUniqueId]);

  const getShipSize = () => {
    if (score >= 1000) return 60;
    if (score >= 500) return 40;
    return 20;
  };

  const getEnemyColor = (level: number) => {
    switch (level) {
      case 1: return 'red';
      case 2: return 'darkred';
      case 3: return 'maroon';
      default: return 'red';
    }
  };

  const drawShip = (ctx: CanvasRenderingContext2D, size: number) => {
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
  };

  const drawEnemy = (ctx: CanvasRenderingContext2D, size: number, color: string) => {
    ctx.clearRect(0, 0, size, size);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(size / 2, 0);
    ctx.lineTo(size, size / 2);
    ctx.lineTo(size / 2, size);
    ctx.lineTo(0, size / 2);
    ctx.closePath();
    ctx.fill();
  };

  useEffect(() => {
    const shipCanvas = document.getElementById('shipCanvas') as HTMLCanvasElement;
    if (shipCanvas) {
      const ctx = shipCanvas.getContext('2d');
      if (ctx) {
        drawShip(ctx, getShipSize());
      }
    }
  }, [shipPosition, score]);

  useEffect(() => {
    enemies.forEach(enemy => {
      const enemyCanvas = document.getElementById(`enemyCanvas-${enemy.id}`) as HTMLCanvasElement;
      if (enemyCanvas) {
        const ctx = enemyCanvas.getContext('2d');
        if (ctx) {
          drawEnemy(ctx, 30, getEnemyColor(enemy.level));
        }
      }
    });
  }, [enemies]);

  useEffect(() => {
    function start() {
      resize(), anim();
    }
    function resize() {
      w = parseInt(document.documentElement.clientWidth.toString());
      h = parseInt(document.documentElement.clientHeight.toString());
      x = Math.round(w / 2);
      y = Math.round(h / 2);
      z = (w + h) / 2;
      star_color_ratio = 1 / z;
      cursor_x = x;
      cursor_y = y;
      init();
    }
    function init() {
      for (let t = 0; t < n; t++) {
        star[t] = new Array(5);
        star[t][0] = Math.random() * w * 2 - 2 * x;
        star[t][1] = Math.random() * h * 2 - 2 * y;
        star[t][2] = Math.round(Math.random() * z);
        star[t][3] = 0;
        star[t][4] = 0;
      }

      r.width = w;
      r.height = h;
      context = r.getContext("2d")!;
      context.fillStyle = "rgb(0,0,0)";
      context.strokeStyle = "rgb(0,255,255)";
    }
    function anim() {
      context.fillRect(0, 0, w, h);

      for (let t = 0; t < n; t++) {
        star_x_save = star[t][3];
        star_y_save = star[t][4];
        star[t][2] -= star_speed;
        if (star[t][2] < 0) {
          star[t][2] += z;
        }
        star[t][3] = x + (star[t][0] / star[t][2]) * star_ratio;
        star[t][4] = y + (star[t][1] / star[t][2]) * star_ratio;
        context.lineWidth = 2 * (1 - star_color_ratio * star[t][2]);
        context.beginPath();
        context.moveTo(star_x_save, star_y_save);
        context.lineTo(star[t][3], star[t][4]);
        context.stroke();
        context.closePath();
      }
      setTimeout(anim, fps);
    }
    let r = document.getElementById("field") as HTMLCanvasElement;
    let n = 812;
    let w = 0;
    let h = 0;
    let x = 0;
    let y = 0;
    let z = 0;
    let star_color_ratio = 0;
    let star_x_save: number;
    let star_y_save: number;
    let star_ratio = 115;
    let star_speed = 0.5;
    let star: number[][] = new Array(n);
    let cursor_x = 0;
    let cursor_y = 0;
    let context: CanvasRenderingContext2D;
    let fps = 10;
    start();
  }, []);

  return (
    <div className="relative w-screen h-screen bg-black overflow-hidden">
      <canvas id="field" className="absolute inset-0 z-0 pointer-events-none"></canvas>

      {/* Timer */}
      <div className="absolute top-4 right-4 text-white text-xl font-bold">
        Time: {timeLeft}s
      </div>

      {/* Score */}
      <div className={`absolute top-4 left-4 text-2xl font-bold transition-all duration-500 ${
        isScoreDecreasing ? 'text-red-500' : 'text-white'
      }`}>
        Score: {score}
      </div>

      {/* Score Animations */}
      {scoreAnimations.map(animation => (
        <div
          key={animation.id}
          className={`absolute text-lg font-bold ${
            animation.value > 0 ? 'text-green-500' : 'text-red-500'
          }`}
          style={{
            left: `${animation.x}px`,
            top: `${animation.y}px`,
            transform: 'translate(-50%, -50%)',
            animation: 'float-up 1s ease-out forwards'
          }}
        >
          {animation.value > 0 ? '+' : ''}{animation.value}
        </div>
      ))}

      {/* Game Over */}
      {gameOver && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75">
          <div className="text-center text-white">
            <h2 className="text-4xl font-bold mb-4">Game Over!</h2>
            <p className="text-2xl">Final Score: {score}</p>
            <button
              className="mt-4 px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              onClick={() => window.location.reload()}
            >
              Play Again
            </button>
          </div>
        </div>
      )}

      {/* Ship */}
      <div
        className="absolute bottom-10 transform -translate-x-1/2 text-blue-500"
        style={{ left: `${shipPosition.x}px` }}
      >
        <canvas id="shipCanvas" width={getShipSize()} height={getShipSize()} />
      </div>

      {/* Bullets */}
      {bullets.map(bullet => (
        <div
          key={bullet.id}
          className="absolute w-2 h-4 bg-yellow-400 rounded"
          style={{
            left: `${bullet.x}px`,
            top: `${bullet.y}px`,
            transform: 'translate(-50%, -50%)'
          }}
        />
      ))}

      {/* Enemies */}
      {enemies.map(enemy => (
        <div
          key={enemy.id}
          className="absolute transform -translate-x-1/2 -translate-y-1/2"
          style={{
            left: `${enemy.x}px`,
            top: `${enemy.y}px`
          }}
        >
          <canvas id={`enemyCanvas-${enemy.id}`} width="30" height="30" />
        </div>
      ))}
    </div>
  );
}

export default App;