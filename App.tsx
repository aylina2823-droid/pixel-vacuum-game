import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Pixel, ConfettiParticle, VacuumState, GameState, Upgrades, AnnouncementState } from './types';
import { 
  NEON_COLORS, 
  HEAVY_PIXEL_COLOR,
  GOLD_PIXEL_COLOR,
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

const STORAGE_KEY = 'pixel_vacuum_save_v4';

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
  const [motivation, setMotivation] = useState("");
  const [totalPixels, setTotalPixels] = useState(INITIAL_PIXEL_COUNT);
  const [flash, setFlash] = useState(false);
  const [announcement, setAnnouncement] = useState<AnnouncementState>({ show: false, level: 0 });
  
  const pixelsRef = useRef<Pixel[]>([]);
  const confettiRef = useRef<ConfettiParticle[]>([]);
  const vacuumRef = useRef<VacuumState>({ active: false, x: 0, y: 0 });
  const animationFrameRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const data: GameState = JSON.parse(saved);
        setLevel(data.level || 1);
        setCoins(data.coins || 0);
        setUpgrades(data.upgrades || { power: 0, size: 0 });
        setTurboCost(data.turboCost || TURBO_INITIAL_COST);
      }
    } catch (e) {
      console.warn("Save load failed", e);
    }
    setIsReady(true);
  }, []);

  useEffect(() => {
    if (isReady) {
      const data: GameState = { level, coins, upgrades, turboCost };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }
  }, [level, coins, upgrades, turboCost, isReady]);

  useEffect(() => {
    if (turboTimeLeft > 0) {
      const timer = setInterval(() => {
        setTurboTimeLeft(prev => Math.max(0, prev - 0.1));
      }, 100);
      return () => clearInterval(timer);
    }
  }, [turboTimeLeft]);

  const createPixel = (id: number, width: number, height: number, currentLevel: number): Pixel => {
    const isHeavy = currentLevel >= 5 && Math.random() < 0.15;
    const isGold = currentLevel >= 10 && Math.random() < 0.1;
    
    let colorData = NEON_COLORS[Math.floor(Math.random() * NEON_COLORS.length)];
    if (isGold) colorData = { color: GOLD_PIXEL_COLOR, glow: 'rgba(251, 191, 36, 0.8)' };
    else if (isHeavy) colorData = { color: HEAVY_PIXEL_COLOR, glow: 'rgba(168, 85, 247, 0.6)' };

    const padding = 50;
    const safeWidth = Math.max(width - padding * 2, 40);
    const safeHeight = Math.max(height - padding * 2, 40);

    return {
      id,
      x: padding + Math.random() * safeWidth,
      y: padding + Math.random() * safeHeight,
      vx: (Math.random() - 0.5) * 1.2,
      vy: (Math.random() - 0.5) * 1.2,
      size: isGold ? 4 : (isHeavy ? 6 : (Math.random() * 2 + 2)),
      color: colorData.color,
      glow: colorData.glow,
      opacity: 0.8 + Math.random() * 0.2,
      isHeavy,
      isGold
    };
  };

  const createConfetti = (x: number, y: number) => {
    const particles: ConfettiParticle[] = [];
    for (let i = 0; i < 40; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 6 + 3;
      const life = Math.random() * 40 + 20;
      particles.push({
        x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
        color: NEON_COLORS[Math.floor(Math.random() * NEON_COLORS.length)].color,
        size: Math.random() * 2 + 2,
        life: life, maxLife: life,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.1
      });
    }
    confettiRef.current = [...confettiRef.current, ...particles];
  };

  const spawnLevel = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Balance Level 10+: Mass instead of count
    const pixelMultiplier = level > 10 ? Math.pow(1.15, 9) : Math.pow(1.15, level - 1);
    const count = Math.floor(INITIAL_PIXEL_COUNT * pixelMultiplier);
    
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
    setMotivation(level >= 10 ? "Gold pixels appeared!" : `Level ${level}`);
    setFlash(true);
    setTimeout(() => setFlash(false), 150);
  }, [level]);

  useEffect(() => {
    if (isReady) {
      const handleResize = () => {
        const canvas = canvasRef.current;
        if (canvas) {
          canvas.width = window.innerWidth;
          canvas.height = window.innerHeight;
        }
      };
      window.addEventListener('resize', handleResize);
      handleResize();
      spawnLevel();
      return () => window.removeEventListener('resize', handleResize);
    }
  }, [isReady, spawnLevel]);

  // Updated Price Formula: base * (1.6 ^ level)
  const powerCost = Math.floor(UPGRADE_BASE_COST * Math.pow(UPGRADE_COST_MULTIPLIER, upgrades.power));
  const sizeCost = Math.floor(UPGRADE_BASE_COST * Math.pow(UPGRADE_COST_MULTIPLIER, upgrades.size));
  
  const getVacuumRadius = () => {
    const base = BASE_VACUUM_RADIUS + (upgrades.size * 12);
    const max = window.innerWidth * MAX_SIZE_SCREEN_RATIO;
    return Math.min(base, max);
  };

  const isSizeMaxed = canvasRef.current ? (getVacuumRadius() >= window.innerWidth * MAX_SIZE_SCREEN_RATIO) : false;

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
      setMotivation("⚡️ HYPER SUCK ⚡️");
      const tg = (window as any).Telegram?.WebApp;
      if (tg?.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
    }
  };

  useEffect(() => {
    if (!isReady) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let transitioning = false;

    const gameLoop = (time: number) => {
      const width = canvas.width;
      const height = canvas.height;
      const vacuum = vacuumRef.current;
      const isTurbo = turboTimeLeft > 0;
      
      const nextPixels: Pixel[] = [];
      let suckedCoins = 0;
      let suckedScore = 0;

      for (let i = 0; i < pixelsRef.current.length; i++) {
        const p = pixelsRef.current[i];
        p.x += p.vx; p.y += p.vy;
        p.vx *= FRICTION; p.vy *= FRICTION;

        const outside = p.x < 0 || p.x > width || p.y < 0 || p.y > height;
        if (outside) {
          if (!p.outsideSince) p.outsideSince = time;
          else if (time - p.outsideSince > 1000) {
            p.x = width / 2; p.y = height / 2;
            p.vx = 0; p.vy = 0;
            p.outsideSince = undefined;
          }
          if (p.x < 0) { p.x = 0; p.vx = Math.abs(p.vx); }
          if (p.x > width) { p.x = width; p.vx = -Math.abs(p.vx); }
          if (p.y < 0) { p.y = 0; p.vy = Math.abs(p.vy); }
          if (p.y > height) { p.y = height; p.vy = -Math.abs(p.vy); }
        } else {
          p.outsideSince = undefined;
        }

        if (vacuum.active) {
          const dx = vacuum.x - p.x;
          const dy = vacuum.y - p.y;
          const d2 = dx*dx + dy*dy;
          const dist = Math.sqrt(d2);
          const rad = getVacuumRadius();
          
          if (dist < SUCK_RADIUS) {
            suckedScore++;
            suckedCoins += p.isGold ? 5 : 1;
            continue;
          } else if (dist < rad) {
            // Level 10+ Mass Increase
            const massFactor = level > 10 ? (1 + (level - 10) * 0.05) : 1;
            const power = (BASE_ATTRACTION_FORCE + upgrades.power * 0.3) * (isTurbo ? TURBO_MULTIPLIER : 1);
            const pullStrength = (p.isGold ? 0.7 : (p.isHeavy ? 0.4 : 1)) / massFactor;
            const force = (1 - dist / rad) * power * pullStrength;
            p.vx += (dx / dist) * force;
            p.vy += (dy / dist) * force;
          }
        }
        nextPixels.push(p);
      }
      pixelsRef.current = nextPixels;

      const nextConfetti: ConfettiParticle[] = [];
      for (const c of confettiRef.current) {
        c.x += c.vx; c.y += c.vy; c.vy += 0.2; c.vx *= 0.98;
        c.life--;
        if (c.life > 0) nextConfetti.push(c);
      }
      confettiRef.current = nextConfetti;

      if (suckedScore > 0) {
        setScore(s => s + suckedScore);
        setCoins(c => c + suckedCoins);
        const tg = (window as any).Telegram?.WebApp;
        if (tg?.HapticFeedback) tg.HapticFeedback.impactOccurred('light');
      }

      if (nextPixels.length === 0 && !transitioning) {
        transitioning = true;
        setLevel(l => l + 1);
      }

      ctx.fillStyle = '#020617';
      ctx.fillRect(0, 0, width, height);

      for (const c of confettiRef.current) {
        ctx.globalAlpha = c.life / c.maxLife;
        ctx.fillStyle = c.color;
        ctx.fillRect(c.x, c.y, c.size, c.size);
      }

      const isEnd = pixelsRef.current.length <= 5;
      for (const p of pixelsRef.current) {
        ctx.globalAlpha = p.opacity;
        ctx.fillStyle = p.color;
        let sz = p.size;
        if (isEnd) {
          ctx.shadowBlur = 12; ctx.shadowColor = p.color;
          sz *= 1.8;
        }
        if (p.isGold) {
            ctx.shadowBlur = 8; ctx.shadowColor = GOLD_PIXEL_COLOR;
        }
        ctx.fillRect(p.x - sz/2, p.y - sz/2, sz, sz);
        ctx.shadowBlur = 0;
      }

      if (vacuum.active) {
        ctx.globalAlpha = 0.8;
        ctx.beginPath();
        ctx.arc(vacuum.x, vacuum.y, getVacuumRadius(), 0, Math.PI * 2);
        ctx.strokeStyle = isTurbo ? '#f97316' : 'rgba(255,255,255,0.08)';
        ctx.lineWidth = isTurbo ? 4 : 2;
        if (isTurbo) { ctx.shadowBlur = 15; ctx.shadowColor = '#f97316'; }
        ctx.stroke();
        ctx.shadowBlur = 0;
      }
      ctx.globalAlpha = 1;

      animationFrameRef.current = requestAnimationFrame(gameLoop);
    };

    animationFrameRef.current = requestAnimationFrame(gameLoop);
    return () => { if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current); };
  }, [isReady, upgrades, level, turboTimeLeft]);

  const handlePointer = (e: React.PointerEvent) => {
    if (e.type === 'pointerup' || e.type === 'pointerleave' || e.type === 'pointercancel') {
      vacuumRef.current.active = false;
    } else {
      // Avoid tracking if it was caught by UI (handled by stopPropagation in HUD)
      vacuumRef.current = { active: true, x: e.clientX, y: e.clientY };
    }
  };

  return (
    <div className={`relative w-full h-full overflow-hidden transition-colors duration-500 ${flash ? 'bg-cyan-900/20' : 'bg-slate-950'}`}>
      <canvas 
        ref={canvasRef} 
        onPointerDown={handlePointer} 
        onPointerMove={handlePointer} 
        onPointerUp={handlePointer} 
        onPointerLeave={handlePointer} 
      />
      
      {announcement.show && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-40">
          <h2 className="text-7xl font-black text-white italic uppercase tracking-tighter opacity-80 scale-110">Level {announcement.level}</h2>
        </div>
      )}

      <HUD 
        score={score} total={totalPixels} coins={coins} level={level} message={motivation}
        powerUpgradeCost={powerCost} sizeUpgradeCost={sizeCost} turboCost={turboCost}
        turboTimeLeft={turboTimeLeft}
        onUpgradePower={handleUpgradePower} onUpgradeSize={handleUpgradeSize}
        onActivateTurbo={handleActivateTurbo}
        isSizeMaxed={isSizeMaxed}
      />
    </div>
  );
};

export default App;
