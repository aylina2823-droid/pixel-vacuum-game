
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Pixel, VacuumState } from './types';
import { 
  NEON_COLORS, 
  VACUUM_RADIUS, 
  SUCK_RADIUS, 
  ATTRACTION_FORCE, 
  FRICTION, 
  INITIAL_PIXEL_COUNT 
} from './constants';
import HUD from './components/HUD';
import { getCleanupMessage } from './services/geminiService';

const App: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [totalPixels, setTotalPixels] = useState(INITIAL_PIXEL_COUNT);
  const [motivation, setMotivation] = useState("");
  const [isReady, setIsReady] = useState(false);
  
  const pixelsRef = useRef<Pixel[]>([]);
  const vacuumRef = useRef<VacuumState>({ active: false, x: 0, y: 0 });
  const animationFrameRef = useRef<number>(undefined);

  // Инициализация Telegram
  useEffect(() => {
    const tg = (window as any).Telegram?.WebApp;
    if (tg) {
      tg.ready();
      tg.expand();
      if (tg.setHeaderColor) tg.setHeaderColor('#0f172a');
    }
    setIsReady(true);
  }, []);

  const createPixel = (id: number, width: number, height: number): Pixel => {
    const colorIdx = Math.floor(Math.random() * NEON_COLORS.length);
    return {
      id,
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 3,
      vy: (Math.random() - 0.5) * 3,
      size: Math.random() * 3 + 3,
      color: NEON_COLORS[colorIdx].color,
      glow: NEON_COLORS[colorIdx].glow,
      opacity: 0.7 + Math.random() * 0.3
    };
  };

  const initGame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const width = window.innerWidth;
    const height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    const newPixels: Pixel[] = [];
    for (let i = 0; i < INITIAL_PIXEL_COUNT; i++) {
      newPixels.push(createPixel(i, width, height));
    }
    pixelsRef.current = newPixels;
    setScore(0);
    setTotalPixels(INITIAL_PIXEL_COUNT);
    setMotivation("Двигайте пальцем для уборки");
  }, []);

  useEffect(() => {
    if (isReady) {
      initGame();
      window.addEventListener('resize', initGame);
      return () => window.removeEventListener('resize', initGame);
    }
  }, [isReady, initGame]);

  useEffect(() => {
    if (score > 0 && score % 25 === 0) {
      getCleanupMessage(score).then(msg => {
        if (msg) setMotivation(msg);
      }).catch(() => setMotivation("Отличная работа!"));
    }
    if (score === totalPixels && totalPixels > 0) {
      setMotivation("Идеальная чистота!");
    }
  }, [score, totalPixels]);

  useEffect(() => {
    if (!isReady) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const update = () => {
      const vacuum = vacuumRef.current;
      const pixels = pixelsRef.current;
      const nextPixels: Pixel[] = [];
      let suckedCount = 0;

      for (let i = 0; i < pixels.length; i++) {
        const p = pixels[i];
        
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= FRICTION;
        p.vy *= FRICTION;

        // Отскоки от границ
        if (p.x < 0) { p.x = 0; p.vx *= -1; }
        if (p.x > canvas.width) { p.x = canvas.width; p.vx *= -1; }
        if (p.y < 0) { p.y = 0; p.vy *= -1; }
        if (p.y > canvas.height) { p.y = canvas.height; p.vy *= -1; }

        if (vacuum.active) {
          const dx = vacuum.x - p.x;
          const dy = vacuum.y - p.y;
          const distSq = dx * dx + dy * dy;
          const dist = Math.sqrt(distSq);

          if (dist < SUCK_RADIUS) {
            suckedCount++;
            continue;
          } else if (dist < VACUUM_RADIUS) {
            // Усиленная всасывающая сила
            const force = (1 - dist / VACUUM_RADIUS) * ATTRACTION_FORCE;
            p.vx += (dx / dist) * force;
            p.vy += (dy / dist) * force;
          }
        }

        nextPixels.push(p);
      }

      if (suckedCount > 0) {
        setScore(prev => prev + suckedCount);
        const tg = (window as any).Telegram?.WebApp;
        if (tg?.HapticFeedback) {
          tg.HapticFeedback.impactOccurred('light');
        }
      }
      pixelsRef.current = nextPixels;
    };

    const draw = () => {
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const pixels = pixelsRef.current;
      const vacuum = vacuumRef.current;

      // Отрисовка зоны вакуума
      if (vacuum.active) {
        ctx.beginPath();
        ctx.arc(vacuum.x, vacuum.y, VACUUM_RADIUS, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
        ctx.stroke();
      }

      // Отрисовка пикселей (без тяжелых теней для производительности)
      for (let i = 0; i < pixels.length; i++) {
        const p = pixels[i];
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.opacity;
        ctx.fillRect(p.x - p.size/2, p.y - p.size/2, p.size, p.size);
      }
      ctx.globalAlpha = 1;
    };

    const loop = () => {
      update();
      draw();
      animationFrameRef.current = requestAnimationFrame(loop);
    };

    animationFrameRef.current = requestAnimationFrame(loop);
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isReady]);

  const handlePointer = (e: React.PointerEvent) => {
    if (e.type === 'pointerup' || e.type === 'pointerleave' || e.type === 'pointercancel') {
      vacuumRef.current.active = false;
    } else {
      vacuumRef.current = {
        active: true,
        x: e.clientX,
        y: e.clientY
      };
    }
  };

  return (
    <div className="relative w-full h-screen overflow-hidden select-none bg-slate-900 touch-none">
      <canvas
        ref={canvasRef}
        onPointerMove={handlePointer}
        onPointerDown={handlePointer}
        onPointerUp={handlePointer}
        onPointerLeave={handlePointer}
        onPointerCancel={handlePointer}
        className="w-full h-full cursor-none"
      />
      
      <HUD 
        score={score} 
        total={totalPixels} 
        message={motivation}
        onReset={initGame}
      />
      
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-transparent to-slate-900/20" />
    </div>
  );
};

export default App;
