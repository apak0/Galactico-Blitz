import React, { useEffect, useState, useCallback, useRef } from "react";
import Ship from "./Ship";
import Bullet from "./Bullet";
import Enemy from "./Enemy";
import ScoreAnimation from "./ScoreAnimation";

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

const useStarfield = (canvasId: string) => {
  useEffect(() => {
    const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    const context = canvas.getContext("2d")!;
    let w = window.innerWidth;
    let h = window.innerHeight;
    const n = 812;
    const starRatio = 115;
    const starSpeed = 0.5;
    const stars = new Array(n).fill(0).map(() => [
      Math.random() * w * 2 - w,
      Math.random() * h * 2 - h,
      Math.round(Math.random() * ((w + h) / 2)),
      0,
      0,
    ]);

    const resize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w;
      canvas.height = h;
    };

    const animate = () => {
      context.fillStyle = "rgb(0,0,0)";
      context.fillRect(0, 0, w, h);
      context.strokeStyle = "rgb(0,255,255)";

      for (let i = 0; i < n; i++) {
        const [x, y, z, prevX, prevY] = stars[i];
        stars[i][2] -= starSpeed;
        if (stars[i][2] < 0) stars[i][2] += (w + h) / 2;
        stars[i][3] = w / 2 + (x / stars[i][2]) * starRatio;
        stars[i][4] = h / 2 + (y / stars[i][2]) * starRatio;

        context.lineWidth = 2 * (1 - 1 / ((w + h) / 2) * stars[i][2]);
        context.beginPath();
        context.moveTo(prevX, prevY);
        context.lineTo(stars[i][3], stars[i][4]);
        context.stroke();
        context.closePath();
      }

      requestAnimationFrame(animate);
    };

    resize();
    animate();
    window.addEventListener("resize", resize);

    return () => window.removeEventListener("resize", resize);
  }, [canvasId]);
};

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
  const lastFrameTime = useRef<number>(performance.now());

  const generateUniqueId = useCallback(() => {
    animationCounter.current += 1;
    return `${Date.now()}-${animationCounter.current}`;
  }, []);

  const shoot = useCallback(() => {
    setBullets((prev) => [
      ...prev,
      {
        id: Date.now(),
        x: shipPosition.x,
        y: window.innerHeight - (getShipImage() === "/assets/spaces-ship-huge.png" ? 140 : 100),
      },
    ]);
  }, [shipPosition.x]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (gameOver) return;
      keysPressed.current[event.key] = true;
      if (event.key === " ") shoot();
    },
    [gameOver, shoot]
  );

  const handleKeyUp = useCallback((event: KeyboardEvent) => {
    delete keysPressed.current[event.key];
  }, []);

  useStarfield("field");

  // Timer
  useEffect(() => {
    if (gameOver) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev <= 0 ? (setGameOver(true), 0) : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [gameOver]);

  // Game loop with requestAnimationFrame
  useEffect(() => {
    if (gameOver) return;

    const gameLoop = (currentTime: number) => {
      const deltaTime = (currentTime - lastFrameTime.current) / 1000; // Seconds
      lastFrameTime.current = currentTime;

      // Move ship
      setShipPosition((prev) => {
        let newX = prev.x;
        const moveSpeed = 8 / 0.016; // Eski 16ms baz alınarak sabit hız
        if (keysPressed.current["ArrowLeft"]) {
          newX = Math.max(30, prev.x - moveSpeed * deltaTime);
        }
        if (keysPressed.current["ArrowRight"]) {
          newX = Math.min(window.innerWidth - 30, prev.x + moveSpeed * deltaTime);
        }
        return { x: newX };
      });

      // Move bullets
      setBullets((prev) =>
        prev
          .map((b) => ({ ...b, y: b.y - (5 / 0.016) * deltaTime })) // Eski hıza eşitle
          .filter((b) => b.y > 0)
      );

      // Move enemies and check collision
      setEnemies((prev) => {
        let newEnemies = prev
          .map((e) => ({ ...e, y: e.y + 2 * deltaTime / 0.016 })) // Eski hıza eşitle (2 piksel/16ms)
          .filter((e) => {
            if (e.y >= window.innerHeight) {
              setScore((s) => s - 10);
              setIsScoreDecreasing(true);
              setTimeout(() => setIsScoreDecreasing(false), 500);
              setScoreAnimations((prev) => [
                ...prev,
                { value: -20, id: generateUniqueId(), x: e.x, y: window.innerHeight - 50 },
              ]);
              return false;
            }
            const shipSize = getShipSize();
            const shipY = window.innerHeight - (getShipImage() === "/assets/spaces-ship-huge.png" ? 140 : 100);
            if (
              Math.abs(e.x - shipPosition.x) < shipSize / 2 + 15 &&
              Math.abs(e.y - shipY) < shipSize / 2 + 15
            ) {
              setGameOver(true);
              return false;
            }
            return true;
          });
        if (Math.random() < 0.02) {
          newEnemies.push({
            id: Date.now(),
            x: Math.random() * (window.innerWidth - 60) + 30,
            y: 0,
            hits: 0,
          });
        }
        return newEnemies;
      });

      // Bullet-enemy collision
      setBullets((prevBullets) => {
        const bulletsCopy = [...prevBullets];
        setEnemies((prevEnemies) => {
          const enemiesCopy = prevEnemies.map((e) => ({ ...e }));
          bulletsCopy.forEach((bullet, bIndex) => {
            enemiesCopy.forEach((enemy, eIndex) => {
              if (
                Math.abs(bullet.x - enemy.x) < 30 &&
                Math.abs(bullet.y - enemy.y) < 30
              ) {
                bulletsCopy.splice(bIndex, 1);
                enemiesCopy.splice(eIndex, 1);
                setScore((s) => s + 10);
                setScoreAnimations((prev) => [
                  ...prev,
                  { value: 20, id: generateUniqueId(), x: enemy.x, y: enemy.y },
                ]);
              }
            });
          });
          return enemiesCopy;
        });
        return bulletsCopy;
      });

      // Clean up score animations
      setScoreAnimations((prev) =>
        prev.filter((a) => Date.now() - parseInt(a.id.split("-")[0]) < 1000)
      );

      animationFrameId.current = requestAnimationFrame(gameLoop);
    };

    animationFrameId.current = requestAnimationFrame(gameLoop);

    return () => {
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
    };
  }, [gameOver, generateUniqueId, shipPosition.x]);

  // Keyboard controls
  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  const getShipSize = () => (score >= 1000 ? 180 : score >= 500 ? 120 : 60);
  const getShipImage = () =>
    score >= 500
      ? "/assets/spaces-ship-huge.png"
      : score >= 200
      ? "/assets/spaces-ship-middle.png"
      : "/assets/spaces-ship-small.png";
  const getNextShipImage = () =>
    score >= 500 ? null : score >= 200 ? "/assets/spaces-ship-huge.png" : "/assets/spaces-ship-middle.png";
  const getScoreLevel = () =>
    score >= 500 ? "Huge Ship" : score >= 200 ? "Middle Ship" : "Small Ship";

  return (
    <div className="relative w-screen h-screen bg-black overflow-hidden">
      <canvas id="field" className="absolute inset-0 z-0 pointer-events-none" />
      <div className="absolute top-4 right-4 text-white text-xl font-bold">
        Time: {timeLeft}s
      </div>
      <div
        className={`absolute top-4 left-4 text-2xl font-bold transition-all duration-500 ${
          isScoreDecreasing ? "text-red-500" : "text-white"
        }`}
      >
        Score: {score}
        <div className="text-lg font-normal">{getScoreLevel()}</div>
        <div className="flex items-center space-x-2 mt-2">
          <img src={getShipImage()} alt="Current Ship" className="w-6 h-6" />
          {getNextShipImage() && (
            <>
              <span className="text-yellow-500 text-xl">→</span>
              <img src={getNextShipImage()} alt="Next Ship" className="w-6 h-6" />
            </>
          )}
        </div>
      </div>
      {scoreAnimations.map((animation) => (
        <ScoreAnimation key={animation.id} animation={animation} />
      ))}
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
      <Ship position={shipPosition} size={getShipSize()} image={getShipImage()} />
      {bullets.map((bullet) => (
        <Bullet key={bullet.id} bullet={bullet} />
      ))}
      {enemies.map((enemy) => (
        <Enemy key={enemy.id} enemy={enemy} />
      ))}
    </div>
  );
}

export default App;