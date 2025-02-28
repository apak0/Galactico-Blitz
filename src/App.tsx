import React, { useEffect, useState, useCallback, useRef } from "react";
import Ship from "./Ship";
import Bullet from "./Bullet";
import Enemy from "./Enemy";
import ScoreAnimation from "./ScoreAnimation";

interface Position {
  x: number;
  y: number;
}

// Enemy interface
interface Enemy extends Position {
  id: number;
  hits: number;
  image: string;
  isBoss?: boolean; // Final boss'u belirlemek için
  hp?: number; // Boss'un canını takip etmek için
  rotation?: number; // Boss’un dönme açısını takip etmek için
}

interface Bullet extends Position {
  id: string;
  isNeon?: boolean;
  isRedNeon?: boolean;
  isBossBullet?: boolean; // Boss mermilerini ayırt etmek için
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

// Uzay gemisi boyutunu skor seviyesine göre hesapla
const getShipSize = (score: number) =>
  score >= 1000 ? 180 : score >= 500 ? 120 : 60;

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
  const [finalBoss, setFinalBoss] = useState<Enemy | null>(null); // Final boss state’i
  const [bossHP, setBossHP] = useState(100); // Final boss’un HP’si (100’e artırıldı)
  const [isBossExploding, setIsBossExploding] = useState(false); // Boss patlama durumu
  const [gameWon, setGameWon] = useState(false); // Oyunu kazandık mı?
  const [bossDamageEffect, setBossDamageEffect] = useState(false); // Boss hasar alma efekti

  const keysPressed = useRef<{ [key: string]: boolean }>({});
  const animationFrameId = useRef<number>();
  const animationCounter = useRef(0);
  const lastFrameTime = useRef<number>(performance.now());
  const lastShotTime = useRef<number>(0);
  const lastBossShotTime = useRef<number>(0); // Boss’un son mermi atış zamanı
  const lastDirectionChange = useRef<number>(0); // Boss’un son yön değişim zamanı

  const generateUniqueId = useCallback(() => {
    animationCounter.current += 1;
    return `${Date.now()}-${animationCounter.current}`;
  }, []);

  // Mermi atış mantığı
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

  useStarfield("field");

  useEffect(() => {
    if (gameOver || gameWon) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev <= 0 ? (setGameOver(true), 0) : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [gameOver, gameWon]);

  useEffect(() => {
    if (gameOver || gameWon) return;

    const gameLoop = (currentTime: number) => {
      const deltaTime = (currentTime - lastFrameTime.current) / 1000;
      lastFrameTime.current = currentTime;

      // Uzay gemisinin hareketi (artırılmış hız)
      setShipPosition((prev) => {
        let newX = prev.x;
        let newY = prev.y;
        const moveSpeed = 16 / 0.016; // Uzay gemisi hızını iki katına çıkardık

        if (keysPressed.current["ArrowLeft"]) {
          newX = Math.max(30, prev.x - moveSpeed * deltaTime);
        }
        if (keysPressed.current["ArrowRight"]) {
          newX = Math.min(window.innerWidth - 30, prev.x + moveSpeed * deltaTime);
        }
        if (keysPressed.current["ArrowUp"]) {
          newY = Math.max(30, prev.y - moveSpeed * deltaTime);
        }
        if (keysPressed.current["ArrowDown"]) {
          newY = Math.min(window.innerHeight - getShipSize(score), prev.y + moveSpeed * deltaTime);
        }

        return { x: newX, y: newY };
      });

      // Boşluk tuşuyla mermi atışı
      if (keysPressed.current[" "]) {
        const timeSinceLastShot = currentTime - lastShotTime.current;
        if (timeSinceLastShot >= 150) {
          shoot();
          lastShotTime.current = currentTime;
        }
      }

      // Mermilerin hareketi (ship mermileri yukarı, boss mermileri aşağı)
      setBullets((prev) =>
        prev
          .map((b) => ({
            ...b,
            y: b.isBossBullet ? b.y + (2 / 0.016) * deltaTime : b.y - (5 / 0.016) * deltaTime, // Boss mermileri aşağı, ship mermileri yukarı
          }))
          .filter((b) => b.y > 0 && b.y < window.innerHeight)
      );

      // Düşmanların hareketi ve puanlama
      setEnemies((prev) => {
        let newEnemies = prev.map((e) => ({
          ...e,
          y: e.isBoss
            ? 150 // Final boss, ekranın üstünde sabit kalır (dikey olarak, 200px boyut için aşağıya indirildi)
            : fadingEntities.some((fe) => fe.id === e.id.toString())
            ? e.y
            : e.y + (2 * deltaTime) / 0.016,
        }));
        if (!fadingEntities.some((fe) => fe.type === "ship")) {
          newEnemies = newEnemies.filter((e) => {
            if (e.y >= window.innerHeight && !e.isBoss) {
              setScore((s) => {
                const newScore = s - 10;
                console.log("Score Decrease (After Exit):", newScore);
                return newScore;
              });
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
              return false;
            }
            const shipSize = getShipSize(score);
            const enemySize = 30;
            if (
              Math.abs(e.x - shipPosition.x) <= shipSize / 2 + enemySize / 2 &&
              Math.abs(e.y - shipPosition.y) <= shipSize / 2 + enemySize / 2 &&
              !fadingEntities.some((fe) => fe.type === "ship") &&
              !e.isBoss // Boss’un ship’e çarpmasını engelle
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
                setCollisionEffects((prev) => prev.filter((ce) => ce.id !== collisionId));
                setGameOver(true);
              }, 1000);
              return true;
            }
            return true;
          });
        }
        // Skor seviyesine bağlı rastgele düşman yaratma (final boss’tan bağımsız)
        if (!finalBoss && Math.random() < 0.02) { // Final boss yokken düşman yarat
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
            enemyImage = Math.random() < 0.5 ? "/assets/enemy.png" : "/assets/enemy-2.png";
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

      // Skor 1100’e ulaştığında final boss’u garanti şekilde spawn et
      if (score >= 1100 && !finalBoss && !enemies.some((e) => e.isBoss)) {
        console.log("Spawning Final Boss at score:", score); // Debug için log
        setFinalBoss({
          id: Date.now(),
          x: window.innerWidth / 2,
          y: 150, // Boss’u aşağıya indirdik (200px boyut için tamamen görünür)
          hits: 0,
          image: "/assets/final-boss.png",
          isBoss: true,
          hp: 100, // Başlangıç HP’si (100’e artırıldı)
          rotation: 0, // Başlangıçta 0 derece (düz pozisyon)
        });
      }

      // Final boss’un smooth ve sürekli hareketi (sağa sola, duvar çarpmasından bağımsız rotasyon)
      if (finalBoss && !isBossExploding) {
        setFinalBoss((prev) => {
          if (!prev) return null;
          const moveSpeed = 12 / 0.016; // Boss’un hareket hızı (senin belirttiğin gibi)
          let direction = prev.direction || (Math.random() < 0.5 ? 1 : -1); // Varsayılan yön (sağa veya sola)
          const currentTime = Date.now();

          // Ekran sınırlarına çarptığında yalnızca hareket yönünü tersine çevir (rotasyon bağımsız)
          const newX = Math.max(50, Math.min(window.innerWidth - 50, prev.x + moveSpeed * direction * deltaTime));
          if (newX === 50 || newX === window.innerWidth - 50) {
            direction *= -1; // Sınırda hareket yönünü tersine çevir, rotasyonu etkileme
          }

          // 2 saniyede bir rastgele yön ve rotasyon değiştir (duvar çarpmasından bağımsız)
          if (currentTime - lastDirectionChange.current >= 2000) {
            direction = Math.random() < 0.5 ? 1 : -1; // Yeni hareket yönü (sağa veya sola)
            lastDirectionChange.current = currentTime;
          }

          // Yöne göre rotasyonu ayarla (sağa +30, sola -30 derece, duvar çarpmasından bağımsız)
          const rotation = direction === 1 ? 30 : -30; // Sola -30, sağa +30 derece

          return { ...prev, x: newX, y: 150, direction, rotation }; // Y koordinatı sabit 150, yön ve rotasyon güncellendi
        });
      }

      // Final boss’un mermi atışı (ship’e doğru)
      if (finalBoss && !isBossExploding) {
        const timeSinceLastBossShot = currentTime - lastBossShotTime.current;
        if (timeSinceLastBossShot >= 1000) { // Her 1 saniyede bir mermi
          const bossBulletId = `${Date.now()}-boss`;
          setBullets((prev) => [
            ...prev,
            {
              id: bossBulletId,
              x: finalBoss.x,
              y: finalBoss.y + 30, // Boss’un altından ateş (y: 150 için güncellendi)
              isBossBullet: true, // Boss mermisi olarak işaretle
            },
          ]);
          lastBossShotTime.current = currentTime;
        }
      }

      // Boss mermilerinin ship’e çarpması kontrolü
      setBullets((prev) =>
        prev.map((bullet) => {
          if (bullet.isBossBullet) {
            const shipSize = getShipSize(score);
            if (
              Math.abs(bullet.x - shipPosition.x) <= shipSize / 2 + 10 && // Mermi genişliği için 10
              Math.abs(bullet.y - shipPosition.y) <= shipSize / 2 + 10 &&
              !fadingEntities.some((fe) => fe.type === "ship")
            ) {
              setGameOver(true); // Boss mermisi ship’e çarptığında oyun biter
              return null; // Mermiyi kaldır
            }
          }
          return bullet;
        }).filter((bullet) => bullet !== null) as Bullet[]
      );

      // Mermilerle boss çarpışması ve HP azaltma (hasar efekti ekleme)
      if (finalBoss && !isBossExploding) {
        setBullets((prevBullets) => {
          const bulletsCopy = [...prevBullets];
          bulletsCopy.forEach((bullet, bIndex) => {
            if (!bullet.isBossBullet && finalBoss) { // Ship mermisi boss’a çarptığında
              if (
                Math.abs(bullet.x - finalBoss.x) < 50 && // Boss’un genişliği için 50
                Math.abs(bullet.y - finalBoss.y) < 50
              ) {
                bulletsCopy.splice(bIndex, 1);
                setBossHP((prevHP) => {
                  const newHP = prevHP - 1; // Her mermi isabetinde 1 HP azalır (100 HP için 100 mermi)
                  if (newHP <= 0) {
                    setIsBossExploding(true);
                    setTimeout(() => {
                      setFinalBoss(null);
                      setIsBossExploding(false);
                      setGameWon(true);
                    }, 3000); // Patlama 3 saniye sürer
                    setTimeout(() => {
                      setFadingEntities((prev) => prev.filter((fe) => fe.id !== finalBoss.id.toString()));
                    }, 2000); // Boss 2 saniye içinde kaybolur
                  }
                  // Hasar alma efekti ekle
                  setBossDamageEffect(true);
                  setTimeout(() => setBossDamageEffect(false), 300); // 0.3 saniye sonra normale dön
                  return newHP;
                });
              }
            }
          });
          return bulletsCopy;
        });
      }

      // Mermilerle normal düşman çarpışması ve patlama
      setBullets((prevBullets) => {
        const bulletsCopy = [...prevBullets];
        setEnemies((prevEnemies) => {
          const enemiesCopy = prevEnemies.map((e) => ({ ...e }));
          bulletsCopy.forEach((bullet, bIndex) => {
            enemiesCopy.forEach((enemy, eIndex) => {
              if (
                !enemy.isBoss && // Sadece normal düşmanlar için
                Math.abs(bullet.x - enemy.x) < 30 &&
                Math.abs(bullet.y - enemy.y) < 30 &&
                !fadingEntities.some((fe) => fe.id === enemy.id.toString()) &&
                !bullet.isBossBullet // Boss mermileri düşmanlara zarar vermez
              ) {
                const collisionId = generateUniqueId();
                bulletsCopy.splice(bIndex, 1);
                setCollisionEffects((prev) => [
                  ...prev,
                  { x: enemy.x, y: enemy.y, id: collisionId },
                ]);
                setFadingEntities((prev) => [
                  ...prev,
                  { type: "enemy", x: enemy.x, y: enemy.y, id: enemy.id.toString() },
                ]);
                // Puanları düşman görseline göre ayarla (çarpma olmadan)
                let scoreIncrease = 20;
                if (enemy.image === "/assets/enemy-2.png") {
                  scoreIncrease = 30;
                } else if (enemy.image === "/assets/enemy-3.png") {
                  scoreIncrease = 40;
                }
                setScore((s) => {
                  const newScore = s + scoreIncrease;
                  console.log("Score Increase (After Kill):", newScore);
                  return newScore;
                });
                setScoreAnimations((prev) => [
                  ...prev,
                  {
                    value: scoreIncrease,
                    id: generateUniqueId(),
                    x: enemy.x,
                    y: enemy.y,
                  },
                ]);
                console.log(
                  "Score Increase for Enemy:",
                  enemy.image,
                  "Score Increase:",
                  scoreIncrease,
                  "Animation Value:",
                  scoreIncrease
                );
                setTimeout(() => {
                  setCollisionEffects((prev) => prev.filter((ce) => ce.id !== collisionId));
                  setEnemies((prev) => prev.filter((e) => e.id !== enemy.id));
                }, 1000); // 1 saniye sonra düşman kaybolur
              }
            });
          });
          return enemiesCopy;
        });
        return bulletsCopy;
      });

      // Puan animasyonlarının süresini kontrol et
      setScoreAnimations((prev) =>
        prev.filter((a) => Date.now() - parseInt(a.id.split("-")[0]) < 1000)
      );

      animationFrameId.current = requestAnimationFrame(gameLoop);
    };

    animationFrameId.current = requestAnimationFrame(gameLoop);

    return () => {
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
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
  ]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  // Uzay gemisi görselini skor seviyesine göre belirle
  const getShipImage = () => {
    console.log("Current Score for Ship Size:", score);
    return score >= 500
      ? "/assets/spaces-ship-huge.png"
      : score >= 200
      ? "/assets/spaces-ship-middle.png"
      : "/assets/spaces-ship-small.png";
  };
  const getNextShipImage = () =>
    score >= 500
      ? null
      : score >= 200
      ? "/assets/spaces-ship-huge.png"
      : "/assets/spaces-ship-middle.png";
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
          isFading={fadingEntities.some((fe) => fe.id === enemy.id.toString())}
        />
      ))}
      {finalBoss && !isBossExploding && (
        <Enemy
          key={finalBoss.id}
          enemy={finalBoss}
          isFading={false}
          isDamaged={bossDamageEffect} // Hasar efekti için prop
        />
      )}
      {bullets.map((bullet) => (
        <Bullet
          key={bullet.id}
          bullet={bullet}
        />
      ))}
    </div>
  );
}

export default App;