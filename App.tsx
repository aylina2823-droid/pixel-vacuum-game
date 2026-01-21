
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Pixel, ConfettiParticle, VacuumState, GameState, Upgrades, AnnouncementState } from './types';
import { 
  NEON_COLORS, 
  HEAVY_PIXEL_COLOR,
  BASE_VACUUM_RADIUS, 
  SUCK_RADIUS, 
  BASE_ATTRACTION_FORCE, 
  FRICTION, 
  INITIAL_PIXEL_COUNT,
  UPGRADE_BASE_COST,
  UPGRADE_COST_MULTIPLIER,
  MAX_SIZE_SCREEN_RATIO,
  TURBO_MULTIPLIER,
  TURBO_DURATION_MS,
  TURBO_INITIAL_COST,
  TURBO_COST_STEP
} from './constants';
import HUD from './components/HUD';

const STORAGE_KEY = 'pixel_vacuum_save_v2'; // Bumped version for fresh state

const MOTIVATIONAL_PHRASES = [
  "Вау!", "Чистота!", "Мастер порядка!", "Безупречно!", "Ни пылинки!",
  "Сила всасывания!", "Блестяще!", "Так держать!", "Порядок!", "Ультра-сбор!"
];

const App: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isReady, setIsReady] = useState(false);
  const [score, setScore] = useState(0);
  const [coins, setCoins] = useState(0);
  const [level, setLevel] = useState(1);
  const [upgrades, setUpgrades] = useState<Upgrades>({ power: 0, size: 0 });
  const [turboCost, setTurboCost] = useState(TURBO_INITIAL_COST);
  const [turboTimeLeft, setTurboTimeLeft] = useState(0);
  const [manualPower, setManualPower] = useState(1.0);
  const [motivation, setMotivation] = useState("");
  const [totalPixels, setTotalPixels] = useState(INITIAL_PIXEL_COUNT);
  const [flash, setFlash] = useState(false);
  const [announcement, setAnnouncement] = useState<AnnouncementState>({ show: false, level: 0 });
  
  const pixelsRef = useRef<Pixel[]>([]);
  const confettiRef = useRef<ConfettiParticle[]>([]);
  const vacuumRef = useRef<VacuumState>({ active: false, x: 0, y: 0 });
  const animationFrameRef = useRef<number>(undefined);
  const lastTimeRef = useRef<number>(performance.now());

  // Initialization & Persistence
  useEffect(() => {
    // 1. Telegram WebApp Ready
    const tg = (window as any).Telegram?.WebApp;
    if (tg) {
      tg.ready();
      tg.expand();
      if (tg.disableVerticalSwiping) {
        tg.disableVerticalSwiping();
      }
      if (tg.setHeaderColor) tg.setHeaderColor('#0f172a');
      if (tg.enableClosingConfirmation) tg.enableClosingConfirmation();
    }

    // 2. Load Save
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const data: GameState = JSON.parse(saved);
        setLevel(data.level || 1);
        setCoins(data.coins || 0);
        setUpgrades(data.upgrades || { power: 0, size: 0 });
        setTurboCost(data.turboCost || TURBO_INITIAL_COST);
      } catch (e) {
        console.error("Failed to load save", e);
      }
    }

    setIsReady(true);
  }, []);

  // Save loop
  useEffect(() => {
    if (isReady) {
      const data: GameState = { level, coins, upgrades, turboCost };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }
  }, [level, coins, upgrades, turboCost, isReady]);

  // Turbo Countdown
  useEffect(() => {
    if (turboTimeLeft > 0) {
      const timer = setInterval(() => {
        setTurboTimeLeft(prev => Math.max(0, prev - 0.1));
      }, 100);
      return () => clearInterval(timer);
    }
  }, [turboTimeLeft]);

  const createPixel = (id: number, width: number, height: number, currentLevel: number): Pixel => {
    const isHeavy = currentLevel >= 10 && Math.random() < 0.2;
    let colorData;
    if (isHeavy) {
      colorData = { color: HEAVY_PIXEL_COLOR, glow: 'rgba(168, 85, 247, 0.6)' };
    } else {
      colorData = NEON_COLORS[Math.floor(Math.random() * NEON_COLORS.length)];
    }

    const padding = 30;
    const safeWidth = Math.max(width - padding * 2, 20);
    const safeHeight = Math.max(height - padding * 2, 20);

    return {
      id,
      x: padding + Math.random() * safeWidth,
      y: padding + Math.random() * safeHeight,
      vx: (Math.random() - 0.5) * 2,
      vy: (Math.random() - 0.5) * 2,
      size: isHeavy ? (Math.random() * 2 + 5) : (Math.random() * 3 + 2.5),
      color: colorData.color,
      glow: colorData.glow,
      opacity: 0.6 + Math.random() * 0.4,
      isHeavy
    };
  };

  const createConfetti = (x: number, y: number) => {
    const particles: ConfettiParticle[] = [];
    for (let i = 0; i < 50; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 10 + 5;
      const life = Math.random() * 60 + 40;
      particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: NEON_COLORS[Math.floor(Math.random() * NEON_COLORS.length)].color,
        size: Math.random() * 4 + 2,
        life: life,
        maxLife: life,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.2
      });
    }
    confettiRef.current = [...confettiRef.current, ...particles];
  };

  const spawnLevel = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const count = Math.floor(INITIAL_PIXEL_COUNT * Math.pow(1.2, level - 1));
    const width = canvas.width;
    const height = canvas.height;

    createConfetti(width / 2, height / 2);
    setAnnouncement({ show: true, level });
    setTimeout(() => setAnnouncement(prev => ({ ...prev, show: false })), 1500);

    const newPixels: Pixel[] = [];
    for (let i = 0; i < count; i++) {
      newPixels.push(createPixel(i, width, height, level));
    }
    pixelsRef.current = newPixels;
    setScore(0);
    setTotalPixels(count);
    setMotivation(level === 10 ? "Внимание: Тяжелые пиксели!" : `Уровень ${level} начался!`);
    
    setFlash(true);
    setTimeout(() => setFlash(false), 300);
  }, [level]);

  useEffect(() => {
    if (isReady) {
      const handleResize = () => {
        const canvas = canvasRef.current;
        if (canvas) {
          canvas.width = window.innerWidth;
          canvas.height = window.innerHeight;
          
          pixelsRef.current.forEach(p => {
            if (p.x < 0) p.x = 10;
            if (p.x > canvas.width) p.x = canvas.width - 10;
            if (p.y < 0) p.y = 10;
            if (p.y > canvas.height) p.y = canvas.height - 10;
          });
        }
      };
      handleResize();
      spawnLevel();
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, [isReady, spawnLevel]);

  const powerCost = Math.floor(UPGRADE_BASE_COST * Math.pow(UPGRADE_COST_MULTIPLIER, upgrades.power));
  const sizeCost = Math.floor(UPGRADE_BASE_COST * Math.pow(UPGRADE_COST_MULTIPLIER, upgrades.size));

  const getVacuumRadius = () => BASE_VACUUM_RADIUS + (upgrades.size * 20);
  const isSizeMaxed = canvasRef.current ? (getVacuumRadius() >= canvasRef.current.width * MAX_SIZE_SCREEN_RATIO) : false;

  const handleUpgradePower = () => {
    if (coins >= powerCost) {
      setCoins(c => c - powerCost);
      setUpgrades(u => ({ ...u, power: u.power + 1 }));
    }
  };

  const handleUpgradeSize = () => {
    if (!isSizeMaxed && coins >= sizeCost) {
      setCoins(c => c - sizeCost);
      setUpgrades(u => ({ ...u, size: u.size + 1 }));
    }
  };

  const handleActivateTurbo = () => {
    if (coins >= turboCost && turboTimeLeft <= 0) {
      setCoins(c => c - turboCost);
      setTurboCost(prev => prev + TURBO_COST_STEP);
      setTurboTimeLeft(TURBO_DURATION_MS / 1000);
      setMotivation("⚡️ SUPER POWER АКТИВИРОВАН! ⚡️");
      
      const tg = (window as any).Telegram?.WebApp;
      if (tg?.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
    }
  };

  const handleForceReset = () => {
    spawnLevel();
  };

  useEffect(() => {
    if (!isReady) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let isTransitioning = false;

    const update = (now: number) => {
      const vacuum = vacuumRef.current;
      const pixels = pixelsRef.current;
      const isTurbo = turboTimeLeft > 0;
      const nextPixels: Pixel[] = [];
      let sucked = 0;

      for (let i = 0; i < pixels.length; i++) {
        const p = pixels[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= FRICTION;
        p.vy *= FRICTION;

        const isOutside = p.x < 0 || p.x > canvas.width || p.y < 0 || p.y > canvas.height;
        
        if (isOutside) {
          if (!p.outsideSince) {
            p.outsideSince = now;
          } else if (now - p.outsideSince > 1000) {
            p.x = canvas.width / 2 + (Math.random() - 0.5) * 50;
            p.y = canvas.height / 2 + (Math.random() - 0.5) * 50;
            p.vx = 0;
            p.vy = 0;
            p.outsideSince = undefined;
          }
          
          if (p.x < 0) { p.x = 0; p.vx = Math.abs(p.vx); }
          if (p.x > canvas.width) { p.x = canvas.width; p.vx = -Math.abs(p.vx); }
          if (p.y < 0) { p.y = 0; p.vy = Math.abs(p.vy); }
          if (p.y > canvas.height) { p.y = canvas.height; p.vy = -Math.abs(p.vy); }
        } else {
          p.outsideSince = undefined;
        }

        if (vacuum.active) {
          const dx = vacuum.x - p.x;
          const dy = vacuum.y - p.y;
          const distSq = dx * dx + dy * dy;
          const dist = Math.sqrt(distSq);

          const currentRadius = getVacuumRadius();
          let currentPower = BASE_ATTRACTION_FORCE + (upgrades.power * 0.4);
          
          if (isTurbo) {
            currentPower *= TURBO_MULTIPLIER;
          }

          if (dist < SUCK_RADIUS) {
            sucked++;
            continue;
          } else if (dist < currentRadius) {
            const weightMultiplier = p.isHeavy ? 0.33 : 1;
            const force = (1 - dist / currentRadius) * currentPower * manualPower * weightMultiplier;
            p.vx += (dx / dist) * force;
            p.vy += (dy / dist) * force;
            
            if (isTurbo) {
              p.x += (Math.random() - 0.5) * 1.5;
              p.y += (Math.random() - 0.5) * 1.5;
            }
          }
        }
        nextPixels.push(p);
      }

      const nextConfetti: ConfettiParticle[] = [];
      for (let i = 0; i < confettiRef.current.length; i++) {
        const c = confettiRef.current[i];
        c.x += c.vx;
        c.y += c.vy;
        c.vy += 0.25;
        c.vx *= 0.98;
        c.rotation += c.rotationSpeed;
        c.life--;
        if (c.life > 0) nextConfetti.push(c);
      }
      confettiRef.current = nextConfetti;

      if (sucked > 0) {
        setScore(prev => prev + sucked);
        setCoins(c => c + sucked);
        const tg = (window as any).Telegram?.WebApp;
        if (tg?.HapticFeedback) tg.HapticFeedback.impactOccurred(isTurbo ? 'medium' : 'light');
        
        if (Math.random() > 0.98) {
          setMotivation(MOTIVATIONAL_PHRASES[Math.floor(Math.random() * MOTIVATIONAL_PHRASES.length)]);
        }
      }

      pixelsRef.current = nextPixels;
      if (nextPixels.length === 0 && !isTransitioning) {
        isTransitioning = true;
        setLevel(prev => prev + 1);
      }
    };

    const draw = () => {
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const pixels = pixelsRef.current;
      const confetti = confettiRef.current;
      const vacuum = vacuumRef.current;
      const isTurbo = turboTimeLeft > 0;
      const currentRadius = getVacuumRadius();

      for (let i = 0; i < confetti.length; i++) {
        const c = confetti[i];
        ctx.globalAlpha = c.life / c.maxLife;
        ctx.fillStyle = c.color;
        ctx.save();
        ctx.translate(c.x, c.y);
        ctx.rotate(c.rotation);
        ctx.fillRect(-c.size / 2, -c.size / 2, c.size, c.size);
        ctx.restore();
      }

      const isEnding = pixels.length <= 5;
      for (let i = 0; i < pixels.length; i++) {
        const p = pixels[i];
        ctx.globalAlpha = p.opacity;
        ctx.fillStyle = p.color;
        
        let drawSize = p.size;
        if (isEnding) {
          const pulse = (Math.sin(Date.now() / 150) + 1) / 2;
          ctx.shadowBlur = 15 + pulse * 15;
          ctx.shadowColor = p.color;
          drawSize = p.size * 2.5;
        } else {
          ctx.shadowBlur = 0;
        }

        if (p.isHeavy) {
          ctx.strokeStyle = 'white';
          ctx.lineWidth = 0.5;
          ctx.strokeRect(p.x - drawSize/2, p.y - drawSize/2, drawSize, drawSize);
        }
        ctx.fillRect(p.x - drawSize/2, p.y - drawSize/2, drawSize, drawSize);
        ctx.shadowBlur = 0;
      }

      if (vacuum.active) {
        ctx.globalAlpha = 1;
        ctx.beginPath();
        ctx.arc(vacuum.x, vacuum.y, currentRadius, 0, Math.PI * 2);
        
        if (isTurbo) {
          const pulse = (Math.sin(Date.now() / 100) + 1) / 2;
          ctx.strokeStyle = `rgba(255, 120, 0, ${0.4 + pulse * 0.4})`;
          ctx.lineWidth = 4 + pulse * 4;
          ctx.shadowBlur = 15;
          ctx.shadowColor = '#ff7800';
        } else {
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
          ctx.lineWidth = 2;
          ctx.shadowBlur = 0;
        }
        ctx.stroke();
        
        ctx.beginPath();
        ctx.arc(vacuum.x, vacuum.y, SUCK_RADIUS, 0, Math.PI * 2);
        ctx.fillStyle = isTurbo ? 'rgba(255, 120, 0, 0.2)' : 'rgba(255, 255, 255, 0.1)';
        ctx.fill();
        ctx.shadowBlur = 0;
      }
      ctx.globalAlpha = 1;
    };

    const loop = (time: number) => {
      lastTimeRef.current = time;
      update(time);
      draw();
      animationFrameRef.current = requestAnimationFrame(loop);
    };

    animationFrameRef.current = requestAnimationFrame(loop);
    return () => { if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current); };
  }, [isReady, manualPower, upgrades, level, turboTimeLeft]);

  const handlePointer = (e: React.PointerEvent) => {
    // 6. Handle pointer events but prevent default browser behavior
    if (e.type === 'pointerup' || e.type === 'pointerleave' || e.type === 'pointercancel') {
      vacuumRef.current.active = false;
    } else {
      vacuumRef.current = { active: true, x: e.clientX, y: e.clientY };
    }
  };

  return (
    <div className={`relative w-full h-screen overflow-hidden select-none touch-none transition-colors duration-300 ${flash ? 'bg-cyan-900' : 'bg-slate-900'}`}>
      <canvas
        ref={canvasRef}
        onPointerMove={handlePointer}
        onPointerDown={handlePointer}
        onPointerUp={handlePointer}
        onPointerLeave={handlePointer}
        onPointerCancel={handlePointer}
        className="w-full h-full cursor-none"
      />
      
      {announcement.show && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-40">
          <h2 className="text-7xl font-black text-white italic tracking-tighter uppercase drop-shadow-[0_0_30px_rgba(255,255,255,0.7)] animate-in fade-in zoom-in slide-in-from-bottom-12 duration-700">
            Level {announcement.level}
          </h2>
        </div>
      )}

      <HUD 
        score={score} 
        total={totalPixels} 
        coins={coins}
        level={level}
        message={motivation}
        powerUpgradeCost={powerCost}
        sizeUpgradeCost={sizeCost}
        turboCost={turboCost}
        turboTimeLeft={turboTimeLeft}
        manualPower={manualPower}
        onUpgradePower={handleUpgradePower}
        onUpgradeSize={handleUpgradeSize}
        onActivateTurbo={handleActivateTurbo}
        onManualPowerChange={setManualPower}
        onForceReset={handleForceReset}
        isSizeMaxed={isSizeMaxed}
      />
      
      {flash && <div className="absolute inset-0 bg-white/20 pointer-events-none z-50 animate-pulse" />}
    </div>
  );
};

export default App;
