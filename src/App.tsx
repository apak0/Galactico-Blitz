import React, { useEffect, useState, useCallback, useRef } from "react";
import Ship from "./Ship";
import Bullet from "./Bullet";
import Enemy from "./Enemy";
import ScoreAnimation from "./ScoreAnimation";

interface Position {
  x: number;
  y: number;
}

// ... diğer interface’ler (Enemy, Bullet, ScoreAnimation, CollisionEffect, FadingEntity)

const useStarfield = (canvasId: string) => {
  // ... mevcut useStarfield kodu
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
  const [collisionEffects, setCollisionEffects] = useState<CollisionEffect[]>([]);
  const [fadingEntities, setFadingEntities] = useState<FadingEntity[]>([]);
  const [isLandscape, setIsLandscape] = useState(window.innerWidth > window.innerHeight);

  const keysPressed = useRef<{ [key: string]: boolean }>({});
  const animationFrameId = useRef<number>();
  const animationCounter = useRef(0);
  const lastFrameTime = useRef<number>(performance.now());
  const lastShotTime = useRef<number>(0);

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

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (gameOver) return;
    const touch = e.touches[0];
    const touchX = touch.clientX;
    const screenWidth = window.innerWidth;

    if (touchX < screenWidth / 2) {
      if (touchX < screenWidth / 4) {
        keysPressed.current["ArrowLeft"] = true;
      } else if (touchX > screenWidth / 4 && touchX < screenWidth / 2) {
        keysPressed.current["ArrowRight"] = true;
      }
    } else {
      keysPressed.current[" "] = true;
    }
  }, [gameOver]);

  const handleTouchEnd = useCallback(() => {
    keysPressed.current["ArrowLeft"] = false;
    keysPressed.current["ArrowRight"] = false;
    keysPressed.current[" "] = false;
  }, []);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (gameOver) return;
      keysPressed.current[event.key] = true;
    },
    [gameOver]
  );

  const handleKeyUp = useCallback((event: KeyboardEvent) => {
    delete keysPressed.current[event.key];
  }, []);

  useStarfield("field");

  useEffect(() => {
    if (gameOver) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev <= 0 ? (setGameOver(true), 0) : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [gameOver]);

  useEffect(() => {
    const handleResize = () => {
      setShipPosition((prev) => ({ x: window.innerWidth / 2 }));
      setIsLandscape(window.innerWidth > window.innerHeight);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (gameOver) return;

    const gameLoop = (currentTime: number) => {
      if (currentTime - lastFrameTime.current < 1000 / 30) { // 30 FPS
        animationFrameId.current = requestAnimationFrame(gameLoop);
        return;
      }
      const deltaTime = (currentTime - lastFrameTime.current) / 1000;
      lastFrameTime.current = currentTime;

      setShipPosition((prev) => {
        let newX = prev.x;
        const moveSpeed = 8 / 0.016;
        if (keysPressed.current["ArrowLeft"]) {
          newX = Math.max(30, prev.x - moveSpeed * deltaTime);
        }
        if (keysPressed.current["ArrowRight"]) {
          newX = Math.min(window.innerWidth - 30, prev.x + moveSpeed * deltaTime);
        }
        return { x: newX };
      });

      if (keysPressed.current[" "]) {
        const timeSinceLastShot = currentTime - lastShotTime.current;
        if (timeSinceLastShot >= 200) {
          shoot();
          lastShotTime.current = currentTime;
        }
      }

      setBullets((prev) =>
        prev
          .map((b) => ({ ...b, y: b.y - (5 / 0.016) * deltaTime }))
          .filter((b) => b.y > 0)
      );

      setEnemies((prev) => {
        let newEnemies = prev.map((e) => ({
          ...e,
          y:
            fadingEntities.some((fe) => fe.id === e.id.toString())
              ? e.y
              : e.y + 2 * deltaTime / 0.016,
        }));
        if (!fadingEntities.some((fe) => fe.type === "ship")) {
          newEnemies = newEnemies.filter((e) => {
            if (e.y >= window.innerHeight) {
              setScore((s) => s - 10);
              setIsScoreDecreasing(true);
              setTimeout(() => setIsScoreDecreasing(false), 500);
              setScoreAnimations((prev) => [
                ...prev,
                { value: -10, id: generateUniqueId(), x: e.x, y: window.innerHeight - 50 },
              ]);
              return false;
            }
            const shipSize = getShipSize();
            const shipY = window.innerHeight - (getShipImage() === "/assets/spaces-ship-huge.png" ? 140 : 100);
            const enemySize = 30;
            if (
              Math.abs(e.x - shipPosition.x) <= shipSize / 2 + enemySize / 2 - 5 &&
              Math.abs(e.y - shipY) <= shipSize / 2 + enemySize / 2 - 5 &&
              !fadingEntities.some((fe) => fe.type === "ship")
            ) {
              const collisionId = generateUniqueId();
              setCollisionEffects((prev) => [...prev, { x: e.x, y: e.y, id: collisionId }]);
              setFadingEntities((prev) => [
                ...prev,
                { type: "ship", x: shipPosition.x, y: shipY, id: collisionId + "-ship" },
                { type: "enemy", x: e.x, y: e.y, id: e.id.toString() },
              ]);
              setTimeout(() => {
                setCollisionEffects((prev) => prev.filter((ce) => ce.id !== collisionId));
                setGameOver(true);
              }, 1000);
              return true;
            }
            return true;
          });
        }
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

      setBullets((prevBullets) => {
        const bulletsCopy = [...prevBullets];
        setEnemies((prevEnemies) => {
          const enemiesCopy = prevEnemies.map((e) => ({ ...e }));
          bulletsCopy.forEach((bullet, bIndex) => {
            enemiesCopy.forEach((enemy, eIndex) => {
              if (
                Math.abs(bullet.x - enemy.x) < 30 &&
                Math.abs(bullet.y - enemy.y) < 30 &&
                !fadingEntities.some((fe) => fe.id === enemy.id.toString())
              ) {
                const collisionId = generateUniqueId();
                bulletsCopy.splice(bIndex, 1);
                setCollisionEffects((prev) => [...prev, { x: enemy.x, y: enemy.y, id: collisionId }]);
                setFadingEntities((prev) => [
                  ...prev,
                  { type: "enemy", x: enemy.x, y: enemy.y, id: enemy.id.toString() },
                ]);
                setScore((s) => s + 10);
                setScoreAnimations((prev) => [
                  ...prev,
                  { value: 20, id: generateUniqueId(), x: enemy.x, y: enemy.y },
                ]);
                setTimeout(() => {
                  setCollisionEffects((prev) => prev.filter((ce) => ce.id !== collisionId));
                  setEnemies((prev) => prev.filter((e) => e.id !== enemy.id));
                }, 1000);
              }
            });
          });
          return enemiesCopy;
        });
        return bulletsCopy;
      });

      setScoreAnimations((prev) =>
        prev.filter((a) => Date.now() - parseInt(a.id.split("-")[0]) < 1000)
      );

      animationFrameId.current = requestAnimationFrame(gameLoop);
    };

    animationFrameId.current = requestAnimationFrame(gameLoop);

    return () => {
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
    };
  }, [gameOver, generateUniqueId, shipPosition.x, collisionEffects, fadingEntities, shoot]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("touchstart", handleTouchStart as any); // TypeScript için any ekledim
    window.addEventListener("touchend", handleTouchEnd as any);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("touchstart", handleTouchStart as any);
      window.removeEventListener("touchend", handleTouchEnd as any);
    };
  }, [handleKeyDown, handleKeyUp, handleTouchStart, handleTouchEnd]);

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

  if (!isLandscape) {
    return (
      <div className="flex items-center justify-center h-screen bg-black text-white text-xl">
        Please rotate your device to landscape mode for the best experience!
      </div>
    );
  }

  return (
    <div
      className="relative w-screen h-screen bg-black overflow-hidden touch-none"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <canvas id="field" className="absolute inset-0 z-0 pointer-events-none" />
      <div className="absolute top-4 right-4 text-white text-xl font-bold">
        Time: {timeLeft}s
      </div>
      <div className="absolute top-0 right-0 text-white text-sm font-normal">
        v1.0
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
      {collisionEffects.map((effect) => (
        <div
          key={effect.id}
          className="absolute explosion-effect"
          style={{ left: effect.x, top: effect.y }}
        />
      ))}
      {gameOver && !collisionEffects.length && (
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
      <Ship
        position={shipPosition}
        size={getShipSize()}
        image={getShipImage()}
        isFading={fadingEntities.some((fe) => fe.type === "ship")}
      />
      {enemies.map((enemy) => (
        <Enemy
          key={enemy.id}
          enemy={enemy}
          isFading={fadingEntities.some((fe) => fe.id === enemy.id.toString())}
        />
      ))}
      {bullets.map((bullet) => (
        <Bullet key={bullet.id} bullet={bullet} />
      ))}
    </div>
  );
}

export default App;