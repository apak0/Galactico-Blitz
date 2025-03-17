import { useEffect, useState, useCallback, useRef } from "react";
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
  image: string;
  isBoss?: boolean;
  hp?: number;
  rotation?: number;
}

interface Bullet extends Position {
  id: string;
  isNeon?: boolean;
  isRedNeon?: boolean;
  isBossBullet?: boolean;
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

const getShipSize = (score: number) =>
  Math.min(window.innerWidth, window.innerHeight) >= 1000
    ? score >= 1000
      ? 180
      : score >= 500
      ? 120
      : 60
    : score >= 1000
    ? 90
    : score >= 500
    ? 60
    : 30; // Mobil cihazlar için boyutları küçülttüm

const useStarfield = (canvasId: string) => {
  useEffect(() => {
    const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    const context = canvas.getContext("2d")!;
    let w = window.innerWidth;
    let h = window.innerHeight;
    const n = 812;
    const starRatio = 115;
    const starSpeed = 0.5;
    const stars = new Array(n)
      .fill(0)
      .map(() => [
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

        context.lineWidth = 2 * (1 - (1 / ((w + h) / 2)) * stars[i][2]);
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
    y: window.innerHeight - getShipSize(0),
  });
  const [bullets, setBullets] = useState<Bullet[]>([]);
  const [enemies, setEnemies] = useState<Enemy[]>([]);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [timeLeft, setTimeLeft] = useState(120);
  const [scoreAnimations, setScoreAnimations] = useState<ScoreAnimation[]>([]);
  const [isScoreDecreasing, setIsScoreDecreasing] = useState(false);
  const [collisionEffects, setCollisionEffects] = useState<CollisionEffect[]>(
    []
  );
  const [fadingEntities, setFadingEntities] = useState<FadingEntity[]>([]);
  const [finalBoss, setFinalBoss] = useState<Enemy | null>(null);
  const [bossHP, setBossHP] = useState(100);
  const [isBossExploding, setIsBossExploding] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [bossDamageEffect, setBossDamageEffect] = useState(false);
  const [controlType, setControlType] = useState<"keyboard" | "mouse" | null>(
    null
  );
  const [isModalOpen, setIsModalOpen] = useState(true);

  const keysPressed = useRef<{ [key: string]: boolean }>({});
  const animationFrameId = useRef<number>();
  const animationCounter = useRef(0);
  const lastFrameTime = useRef<number>(performance.now());
  const lastShotTime = useRef<number>(0);
  const lastBossShotTime = useRef<number>(0);
  const lastDirectionChange = useRef<number>(0);

  const generateUniqueId = useCallback(() => {
    animationCounter.current += 1;
    return `${Date.now()}-${animationCounter.current}`;
  }, []);

  const shoot = useCallback(() => {
    if (score >= 100) {
      setBullets((prev) => [
        ...prev,
        {
          id: `${Date.now()}-left`,
          x: shipPosition.x - 20,
          y: shipPosition.y - 30,
          isNeon: score >= 500,
          isRedNeon: score >= 200 && score < 500,
        },
        {
          id: `${Date.now()}-right`,
          x: shipPosition.x + 20,
          y: shipPosition.y - 30,
          isNeon: score >= 500,
          isRedNeon: score >= 200 && score < 500,
        },
      ]);
    } else {
      setBullets((prev) => [
        ...prev,
        {
          id: `${Date.now()}`,
          x: shipPosition.x,
          y: shipPosition.y - 30,
        },
      ]);
    }
  }, [shipPosition.x, shipPosition.y, score]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (gameOver || gameWon) return;
      keysPressed.current[event.key] = true;
    },
    [gameOver, gameWon]
  );

  const handleKeyUp = useCallback((event: KeyboardEvent) => {
    delete keysPressed.current[event.key];
  }, []);

  const handleMouseMove = useCallback(
    (event: MouseEvent) => {
      if (controlType !== "mouse" || gameOver || gameWon) return;
      const newX = Math.max(
        30,
        Math.min(window.innerWidth - 30, event.clientX)
      );
      const newY = Math.max(
        30,
        Math.min(window.innerHeight - getShipSize(score), event.clientY)
      );
      setShipPosition({ x: newX, y: newY });
    },
    [controlType, gameOver, gameWon, score]
  );

  const handleTouchMove = useCallback(
    (event: TouchEvent) => {
      if (controlType !== "mouse" || gameOver || gameWon) return;
      const touch = event.touches[0];
      const newX = Math.max(
        30,
        Math.min(window.innerWidth - 30, touch.clientX)
      );
      const newY = Math.max(
        30,
        Math.min(window.innerHeight - getShipSize(score), touch.clientY)
      );
      setShipPosition({ x: newX, y: newY });
    },
    [controlType, gameOver, gameWon, score]
  );

  const handleTouchStart = useCallback(() => {
    if (controlType === "mouse" && !gameOver && !gameWon) {
      shoot();
    }
  }, [controlType, gameOver, gameWon, shoot]);

  useEffect(() => {
    window.addEventListener("touchmove", handleTouchMove);
    window.addEventListener("touchstart", handleTouchStart);
    return () => {
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchstart", handleTouchStart);
    };
  }, [handleTouchMove, handleTouchStart]);

  useStarfield("field");

  useEffect(() => {
    if (gameOver || gameWon || !controlType) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev <= 0 ? (setGameOver(true), 0) : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [gameOver, gameWon, controlType]);

  useEffect(() => {
    if (!controlType || gameOver || gameWon) return;

    const gameLoop = (currentTime: number) => {
      const deltaTime = (currentTime - lastFrameTime.current) / 1000;
      lastFrameTime.current = currentTime;

      if (controlType === "keyboard") {
        setShipPosition((prev) => {
          let newX = prev.x;
          let newY = prev.y;
          const moveSpeed = 16 / 0.016;

          if (keysPressed.current["ArrowLeft"]) {
            newX = Math.max(30, prev.x - moveSpeed * deltaTime);
          }
          if (keysPressed.current["ArrowRight"]) {
            newX = Math.min(
              window.innerWidth - 30,
              prev.x + moveSpeed * deltaTime
            );
          }
          if (keysPressed.current["ArrowUp"]) {
            newY = Math.max(30, prev.y - moveSpeed * deltaTime);
          }
          if (keysPressed.current["ArrowDown"]) {
            newY = Math.min(
              window.innerHeight - getShipSize(score),
              prev.y + moveSpeed * deltaTime
            );
          }

          return { x: newX, y: newY };
        });
      }

      if (keysPressed.current[" "]) {
        const timeSinceLastShot = currentTime - lastShotTime.current;
        const shotInterval = controlType === "mouse" ? 100 : 150;
        if (timeSinceLastShot >= shotInterval) {
          shoot();
          lastShotTime.current = currentTime;
        }
      }

      setBullets((prev) =>
        prev
          .map((b) => ({
            ...b,
            y: b.isBossBullet
              ? b.y + (2 / 0.016) * deltaTime
              : b.y - (5 / 0.016) * deltaTime,
          }))
          .filter((b) => b.y > 0 && b.y < window.innerHeight)
      );

      setEnemies((prev) => {
        let newEnemies = prev.map((e) => ({
          ...e,
          y: e.isBoss
            ? 150
            : fadingEntities.some((fe) => fe.id === e.id.toString())
            ? e.y
            : e.y + (2 * deltaTime) / 0.016,
        }));
        if (!fadingEntities.some((fe) => fe.type === "ship")) {
          newEnemies = newEnemies.filter((e) => {
            if (e.y >= window.innerHeight && !e.isBoss) {
              setScore((s) => {
                const newScore = s - 10;
                setIsScoreDecreasing(true);
                setTimeout(() => setIsScoreDecreasing(false), 500);
                setScoreAnimations((prev) => [
                  ...prev,
                  {
                    value: -10,
                    id: generateUniqueId(),
                    x: e.x,
                    y: window.innerHeight - 50,
                  },
                ]);
                return newScore;
              });
              return false;
            }
            const shipSize = getShipSize(score);
            const enemySize = 30;
            if (
              Math.abs(e.x - shipPosition.x) <= shipSize / 2 + enemySize / 2 &&
              Math.abs(e.y - shipPosition.y) <= shipSize / 2 + enemySize / 2 &&
              !fadingEntities.some((fe) => fe.type === "ship") &&
              !e.isBoss
            ) {
              const collisionId = generateUniqueId();
              setCollisionEffects((prev) => [
                ...prev,
                { x: e.x, y: e.y, id: collisionId },
              ]);
              setFadingEntities((prev) => [
                ...prev,
                {
                  type: "ship",
                  x: shipPosition.x,
                  y: shipPosition.y,
                  id: collisionId + "-ship",
                },
                { type: "enemy", x: e.x, y: e.y, id: e.id.toString() },
              ]);
              setTimeout(() => {
                setCollisionEffects((prev) =>
                  prev.filter((ce) => ce.id !== collisionId)
                );
                setGameOver(true);
              }, 1000);
              return true;
            }
            return true;
          });
        }
        if (!finalBoss && Math.random() < 0.02) {
          let enemyImage;
          if (score >= 540) {
            const random = Math.random();
            if (random < 0.33) {
              enemyImage = "/assets/enemy.png";
            } else if (random < 0.66) {
              enemyImage = "/assets/enemy-2.png";
            } else {
              enemyImage = "/assets/enemy-3.png";
            }
          } else if (score >= 250) {
            enemyImage =
              Math.random() < 0.5 ? "/assets/enemy.png" : "/assets/enemy-2.png";
          } else {
            enemyImage = "/assets/enemy.png";
          }
          newEnemies.push({
            id: Date.now(),
            x: Math.random() * (window.innerWidth - 60) + 30,
            y: 0,
            hits: 0,
            image: enemyImage,
          });
        }
        return newEnemies;
      });

      if (score >= 1100 && !finalBoss && !enemies.some((e) => e.isBoss)) {
        setFinalBoss({
          id: Date.now(),
          x: window.innerWidth / 2,
          y: 150,
          hits: 0,
          image: "/assets/final-boss.png",
          isBoss: true,
          hp: 100,
          rotation: 0,
        });
      }

      if (finalBoss && !isBossExploding) {
        setFinalBoss((prev) => {
          if (!prev) return null;
          const moveSpeed = 12 / 0.016;
          let direction = prev.direction || (Math.random() < 0.5 ? 1 : -1);
          const currentTime = Date.now();

          const newX = Math.max(
            50,
            Math.min(
              window.innerWidth - 50,
              prev.x + moveSpeed * direction * deltaTime
            )
          );
          if (newX === 50 || newX === window.innerWidth - 50) {
            direction *= -1;
          }

          if (currentTime - lastDirectionChange.current >= 2000) {
            direction = Math.random() < 0.5 ? 1 : -1;
            lastDirectionChange.current = currentTime;
          }

          const rotation = direction === 1 ? 30 : -30;
          return { ...prev, x: newX, y: 150, direction, rotation };
        });
      }

      if (finalBoss && !isBossExploding) {
        const timeSinceLastBossShot = currentTime - lastBossShotTime.current;
        if (timeSinceLastBossShot >= 1000) {
          const bossBulletId = `${Date.now()}-boss`;
          setBullets((prev) => [
            ...prev,
            {
              id: bossBulletId,
              x: finalBoss.x,
              y: finalBoss.y + 30,
              isBossBullet: true,
            },
          ]);
          lastBossShotTime.current = currentTime;
        }
      }

      setBullets(
        (prev) =>
          prev
            .map((bullet) => {
              if (bullet.isBossBullet) {
                const shipSize = getShipSize(score);
                if (
                  Math.abs(bullet.x - shipPosition.x) <= shipSize / 2 + 10 &&
                  Math.abs(bullet.y - shipPosition.y) <= shipSize / 2 + 10 &&
                  !fadingEntities.some((fe) => fe.type === "ship")
                ) {
                  setGameOver(true);
                  return null;
                }
              }
              return bullet;
            })
            .filter((bullet) => bullet !== null) as Bullet[]
      );

      if (finalBoss && !isBossExploding) {
        setBullets((prevBullets) => {
          const bulletsCopy = [...prevBullets];
          bulletsCopy.forEach((bullet, bIndex) => {
            if (!bullet.isBossBullet && finalBoss) {
              if (
                Math.abs(bullet.x - finalBoss.x) < 50 &&
                Math.abs(bullet.y - finalBoss.y) < 50
              ) {
                bulletsCopy.splice(bIndex, 1);
                setBossHP((prevHP) => {
                  const newHP = prevHP - 1;
                  if (newHP <= 0) {
                    setIsBossExploding(true);
                    setTimeout(() => {
                      setFinalBoss(null);
                      setIsBossExploding(false);
                      setGameWon(true);
                    }, 3000);
                    setTimeout(() => {
                      setFadingEntities((prev) =>
                        prev.filter((fe) => fe.id !== finalBoss.id.toString())
                      );
                    }, 2000);
                  }
                  setBossDamageEffect(true);
                  setTimeout(() => setBossDamageEffect(false), 300);
                  return newHP;
                });
              }
            }
          });
          return bulletsCopy;
        });
      }

      setBullets((prevBullets) => {
        const bulletsCopy = [...prevBullets];
        let scoreUpdates: { increase: number; x: number; y: number }[] = [];
        const enemiesToRemove: number[] = [];

        setEnemies((prevEnemies) => {
          const enemiesCopy = [...prevEnemies];
          for (let bIndex = bulletsCopy.length - 1; bIndex >= 0; bIndex--) {
            const bullet = bulletsCopy[bIndex];
            for (let eIndex = enemiesCopy.length - 1; eIndex >= 0; eIndex--) {
              const enemy = enemiesCopy[eIndex];
              if (
                !enemy.isBoss &&
                Math.abs(bullet.x - enemy.x) < 40 &&
                Math.abs(bullet.y - enemy.y) < 40 &&
                !fadingEntities.some((fe) => fe.id === enemy.id.toString()) &&
                !bullet.isBossBullet
              ) {
               
                const collisionId = generateUniqueId();
                bulletsCopy.splice(bIndex, 1);
                setCollisionEffects((prev) => [
                  ...prev,
                  { x: enemy.x, y: enemy.y, id: collisionId },
                ]);
                setFadingEntities((prev) => [
                  ...prev,
                  {
                    type: "enemy",
                    x: enemy.x,
                    y: enemy.y,
                    id: enemy.id.toString(),
                  },
                ]);

                let scoreIncrease = 10;
                if (enemy.image === "/assets/enemy-2.png") {
                  scoreIncrease = 15;
                } else if (enemy.image === "/assets/enemy-3.png") {
                  scoreIncrease = 20;
                }

                // Güncellenen puan animasyonu
                setScore((prevScore) => {
                  const newScore = prevScore + scoreIncrease;
                  setScoreAnimations((prev) => [
                    ...prev,
                    {
                      value: scoreIncrease,
                      id: generateUniqueId(),
                      x: enemy.x,
                      y: enemy.y,
                    },
                  ]);
                  return newScore;
                });

                enemiesCopy.splice(eIndex, 1); // Düşmanı listeden kaldır
                setTimeout(() => {
                  setCollisionEffects((prev) =>
                    prev.filter((ce) => ce.id !== collisionId)
                  );
                }, 1000);
                break;
              }
            }
          }
          return enemiesCopy.filter(
            (enemy) => !enemiesToRemove.includes(enemy.id)
          );
        });

        if (scoreUpdates.length > 0) {
          setScore((prevScore) => {
            const totalIncrease = scoreUpdates.reduce(
              (sum, update) => sum + update.increase,
              0
            );
            const newScore = prevScore + totalIncrease;
            
            return newScore;
          });
          setScoreAnimations((prev) => [
            ...prev,
            ...scoreUpdates.map((update) => ({
              value: update.increase,
              id: generateUniqueId(),
              x: update.x,
              y: update.y,
            })),
          ]);
        }

        return bulletsCopy;
      });

      setScoreAnimations((prev) =>
        prev.filter((a) => Date.now() - parseInt(a.id.split("-")[0]) < 1000)
      );

      animationFrameId.current = requestAnimationFrame(gameLoop);
    };

    animationFrameId.current = requestAnimationFrame(gameLoop);

    return () => {
      if (animationFrameId.current)
        cancelAnimationFrame(animationFrameId.current);
    };
  }, [
    gameOver,
    gameWon,
    generateUniqueId,
    shipPosition.x,
    shipPosition.y,
    collisionEffects,
    fadingEntities,
    shoot,
    score,
    finalBoss,
    isBossExploding,
    controlType,
  ]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, [handleKeyDown, handleKeyUp, handleMouseMove]);

  const getShipImage = () =>
    score >= 500
      ? "/assets/spaces-ship-huge.png"
      : score >= 200
      ? "/assets/spaces-ship-middle.png"
      : "/assets/spaces-ship-small.png";

  const getNextShipImage = () =>
    score >= 500
      ? null
      : score >= 200
      ? "/assets/spaces-ship-huge.png"
      : "/assets/spaces-ship-middle.png";

  const handleControlSelect = (type: "keyboard" | "mouse") => {
    setControlType(type);
    setIsModalOpen(false);
  };

  const isMobile = Math.min(window.innerWidth, window.innerHeight) < 768;

  const handleStartGame = () => {
    setControlType(isMobile ? "mouse" : null); // Mobilde otomatik olarak "mouse" kontrolü seçilir
    setIsModalOpen(false);
  };

  

  return (
    <div className="relative w-screen h-screen bg-black overflow-hidden">
      {isModalOpen && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75 z-50">
          <div className="bg-gray-800 p-6 rounded-lg text-white text-center">
            {isMobile ? (
              <>
                <h2 className="text-3xl font-bold mb-4">Start Game</h2>
                <button
                  className="px-6 py-3 bg-green-500 hover:bg-green-600 rounded text-xl"
                  onClick={handleStartGame}
                >
                  Start
                </button>
              </>
            ) : (
              <>
                <h2 className="text-3xl font-bold mb-4">Select Control Type</h2>
                <div className="flex space-x-4 justify-center">
                  <button
                    className="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded"
                    onClick={() => handleControlSelect("keyboard")}
                  >
                    Keyboard Control
                  </button>
                  <button
                    className="px-4 py-2 bg-green-500 hover:bg-green-600 rounded"
                    onClick={() => handleControlSelect("mouse")}
                  >
                    Mouse Control
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
      <canvas id="field" className="absolute inset-0 z-0 pointer-events-none" />
      {controlType && (
        <div className="game-content">
          <div className="absolute top-4 right-4 text-white text-xl font-bold">
            Time: {timeLeft}s
          </div>
          <div className="absolute bottom-0 right-0 text-white text-sm font-normal">
            v4.0
          </div>
          {finalBoss && !isBossExploding && (
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 text-white text-xl font-bold">
              Boss HP: {bossHP}/100
            </div>
          )}
          <div
            className={`absolute top-4 left-4 text-2xl font-bold transition-all duration-500 ${
              isScoreDecreasing ? "text-red-500" : "text-white"
            }`}
          >
            Score: {score}
            <div className="flex items-center space-x-2 mt-2">
              <img
                src={getShipImage()}
                alt="Current Ship"
                className="w-6 h-6"
              />
              {getNextShipImage() && (
                <>
                  <span className="text-yellow-500 text-xl">→</span>
                  <img
                    src={getNextShipImage()}
                    alt="Next Ship"
                    className="w-6 h-6"
                  />
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
          {isBossExploding && finalBoss && (
            <div
              key={finalBoss.id}
              className="absolute explosion-effect"
              style={{ left: finalBoss.x, top: finalBoss.y }}
            />
          )}
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
          {gameWon && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
              <div className="text-center text-white">
                <h2 className="text-4xl font-bold mb-4">Congratulations!</h2>
                <p className="text-2xl">You Won the Game!</p>
                <button
                  className="mt-4 px-6 py-2 bg-green-500 text-white rounded hover:bg-green-600"
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
              isFading={fadingEntities.some(
                (fe) => fe.id === enemy.id.toString()
              )}
            />
          ))}
          {finalBoss && !isBossExploding && (
            <Enemy
              key={finalBoss.id}
              enemy={finalBoss}
              isFading={false}
              isDamaged={bossDamageEffect}
            />
          )}
          {bullets.map((bullet) => (
            <Bullet key={bullet.id} bullet={bullet} />
          ))}
        </div>
      )}
    </div>
  );
}

export default App;
