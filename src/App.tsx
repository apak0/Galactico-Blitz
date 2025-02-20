import React, { useEffect, useState, useCallback, useRef } from 'react';
import Ship from './Ship';
import Bullet from './Bullet';
import Enemy from './Enemy';
import ScoreAnimation from './ScoreAnimation';

interface Position {
  x: number;
  y: number;
}

interface Enemy extends Position {
  id: number;
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
                setScore(s => s + 10);
                setScoreAnimations(prev => [...prev, {
                  value: 10,
                  id: generateUniqueId(),
                  x: enemy.x,
                  y: enemy.y
                }]);
                return false;
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
        <ScoreAnimation key={animation.id} animation={animation} />
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
      <Ship position={shipPosition} size={getShipSize()} />

      {/* Bullets */}
      {bullets.map(bullet => (
        <Bullet key={bullet.id} bullet={bullet} />
      ))}

      {/* Enemies */}
      {enemies.map(enemy => (
        <Enemy key={enemy.id} enemy={enemy} />
      ))}
    </div>
  );
}

export default App;