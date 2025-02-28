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
  image: string; // Düşman görseli için
}

interface Bullet extends Position {
  id: string; // id'yi number yerine string olarak güncelledim
  isNeon?: boolean;
  isRedNeon?: boolean;
}

interface ScoreAnimation {
  value: number;
  id: string;
  x: number;
  y: number;
}

interface CollisionEffect {
  x: number;
  y: number;
  id: string;
}

interface FadingEntity {
  type: "ship" | "enemy";
  x: number;
  y: number;
  id: string;
}

// getShipSize fonksiyonunu component dışına taşıyoruz
const getShipSize = (score: number) => (score >= 1000 ? 180 : score >= 500 ? 120 : 60);

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
  const [shipPosition, setShipPosition] = useState<Position>({
    x: window.innerWidth / 2,
    y: window.innerHeight - getShipSize(0), // Başlangıçta alt kısımda
  });
  const [bullets, setBullets] = useState<Bullet[]>([]);
  const [enemies, setEnemies] = useState<Enemy[]>([]);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const [scoreAnimations, setScoreAnimations] = useState<ScoreAnimation[]>([]);
  const [isScoreDecreasing, setIsScoreDecreasing] = useState(false);
  const [collisionEffects, setCollisionEffects] = useState<CollisionEffect[]>([]);
  const [fadingEntities, setFadingEntities] = useState<FadingEntity[]>([]);

  const keysPressed = useRef<{ [key: string]: boolean }>({});
  const animationFrameId = useRef<number>();
  const animationCounter = useRef(0);
  const lastFrameTime = useRef<number>(performance.now());
  const lastShotTime = useRef<number>(0);

  const generateUniqueId = useCallback(() => {
    animationCounter.current += 1;
    return `${Date.now()}-${animationCounter.current}`;
  }, []);

  const shoot = useCallback(
    () => {
      if (score >= 100) {
        // Skor 100 veya daha yüksekse, sağ ve sol taraftan iki mermi ateşle
        setBullets((prev) => [
          ...prev,
          {
            id: `${Date.now()}-left`, // Number'ı string'e çevir
            x: shipPosition.x - 20, // Sol mermi, geminin solundan 20 piksel
            y: shipPosition.y - 30,
            isNeon: score >= 500, // Skor 500 veya daha yüksekse neon mavi (dikey)
            isRedNeon: score >= 200 && score < 500, // Skor 200-499 arasında kırmızı neon
          },
          {
            id: `${Date.now()}-right`, // Number'ı string'e çevir
            x: shipPosition.x + 20, // Sağ mermi, geminin sağından 20 piksel
            y: shipPosition.y - 30,
            isNeon: score >= 500, // Skor 500 veya daha yüksekse neon mavi (dikey)
            isRedNeon: score >= 200 && score < 500, // Skor 200-499 arasında kırmızı neon
          },
        ]);
      } else {
        // Skor 100’den düşükse, tek mermi ateşle (mevcut mantık)
        setBullets((prev) => [
          ...prev,
          {
            id: `${Date.now()}`, // Number'ı string'e çevir
            x: shipPosition.x,
            y: shipPosition.y - 30,
          },
        ]);
      }
    },
    [shipPosition.x, shipPosition.y, score] // Bağımlılıklar
  );

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
    if (gameOver) return;

    const gameLoop = (currentTime: number) => {
      const deltaTime = (currentTime - lastFrameTime.current) / 1000;
      lastFrameTime.current = currentTime;

      setShipPosition((prev) => {
        let newX = prev.x;
        let newY = prev.y;
        const moveSpeed = 16 / 0.016; // Hızı iki katına çıkardık (16 piksel/saniye)

        if (keysPressed.current["ArrowLeft"]) {
          newX = Math.max(30, prev.x - moveSpeed * deltaTime);
        }
        if (keysPressed.current["ArrowRight"]) {
          newX = Math.min(window.innerWidth - 30, prev.x + moveSpeed * deltaTime);
        }
        if (keysPressed.current["ArrowUp"]) {
          newY = Math.max(30, prev.y - moveSpeed * deltaTime); // Yukarı hareket
        }
        if (keysPressed.current["ArrowDown"]) {
          newY = Math.min(window.innerHeight - getShipSize(score), prev.y + moveSpeed * deltaTime); // Aşağı hareket
        }

        return { x: newX, y: newY };
      });

      if (keysPressed.current[" "]) {
        const timeSinceLastShot = currentTime - lastShotTime.current;
        if (timeSinceLastShot >= 150) { // 150 milisaniye (saniyede yaklaşık 6.67 mermi) kontrolü
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
              setScore((s) => {
                const newScore = s - 10;
                console.log("Score Decrease (After Exit):", newScore); // State güncellemesi sonrası skor
                return newScore;
              });
              setIsScoreDecreasing(true);
              setTimeout(() => setIsScoreDecreasing(false), 500);
              setScoreAnimations((prev) => [
                ...prev,
                { value: -10, id: generateUniqueId(), x: e.x, y: window.innerHeight - 50 },
              ]);
              return false;
            }
            const shipSize = getShipSize(score);
            const enemySize = 30;
            if (
              Math.abs(e.x - shipPosition.x) <= shipSize / 2 + enemySize / 2 &&
              Math.abs(e.y - shipPosition.y) <= shipSize / 2 + enemySize / 2 &&
              !fadingEntities.some((fe) => fe.type === "ship")
            ) {
              const collisionId = generateUniqueId();
              setCollisionEffects((prev) => [...prev, { x: e.x, y: e.y, id: collisionId }]);
              setFadingEntities((prev) => [
                ...prev,
                { type: "ship", x: shipPosition.x, y: shipPosition.y, id: collisionId + "-ship" },
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
          let enemyImage;
          if (score >= 540) {
            // Skor 540 veya daha yüksekse, düşmanlar enemy, enemy-2, ve enemy-3 arasında rastgele dağıtılır
            const random = Math.random();
            if (random < 0.33) {
              enemyImage = "/assets/enemy.png";
            } else if (random < 0.66) {
              enemyImage = "/assets/enemy-2.png";
            } else {
              enemyImage = "/assets/enemy-3.png";
            }
          } else if (score >= 250) {
            // Skor 250-539 arasında, düşmanlar enemy ve enemy-2 arasında %50-%50 dağıtılır
            enemyImage = Math.random() < 0.5 ? "/assets/enemy.png" : "/assets/enemy-2.png";
          } else {
            // Skor 250’den düşükse, tüm düşmanlar enemy ile yaratılır
            enemyImage = "/assets/enemy.png";
          }
          newEnemies.push({
            id: Date.now(),
            x: Math.random() * (window.innerWidth - 60) + 30,
            y: 0,
            hits: 0,
            image: enemyImage, // Düşman görselini belirle
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
                // Puanları düşman görseline göre ayarla (çarpma olmadan)
                let scoreIncrease = 10;
                if (enemy.image === "/assets/enemy-2.png") {
                  scoreIncrease = 15;
                } else if (enemy.image === "/assets/enemy-3.png") {
                  scoreIncrease = 20;
                }
                setScore((s) => {
                  const newScore = s + scoreIncrease;
                  console.log("Score Increase (After Kill):", newScore); // State güncellemesi sonrası skor
                  return newScore;
                });
                setScoreAnimations((prev) => [
                  ...prev,
                  { value: scoreIncrease, id: generateUniqueId(), x: enemy.x, y: enemy.y }, // Çarpma olmadan tam puanı göster
                ]);
                console.log("Score Increase for Enemy:", enemy.image, "Score Increase:", scoreIncrease, "Animation Value:", scoreIncrease); // Debug için log
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
  }, [gameOver, generateUniqueId, shipPosition.x, shipPosition.y, collisionEffects, fadingEntities, shoot, score]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  const getShipImage = () => {
    
    return score >= 500
      ? "/assets/spaces-ship-huge.png"
      : score >= 200
      ? "/assets/spaces-ship-middle.png"
      : "/assets/spaces-ship-small.png";
  };
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
      <div className="absolute top-0 right-0 text-white text-sm font-normal">
        v1.0
      </div>
      <div
        className={`absolute top-4 left-4 text-2xl font-bold transition-all duration-500 ${
          isScoreDecreasing ? "text-red-500" : "text-white"
        }`}
      >
        Score: {score}
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
        size={getShipSize(score)}
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