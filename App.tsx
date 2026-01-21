
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
  
  // Game state held in refs for performance (avoiding re-renders on every frame)
  const pixelsRef = useRef<Pixel[]>([]);
  const vacuumRef = useRef<VacuumState>({ active: false, x: 0, y: 0 });
  const animationFrameRef = useRef<number>(undefined);

  // Initialize Telegram WebApp
  useEffect(() => {
    const tg = (window as any).Telegram?.WebApp;
    if (tg) {
      tg.ready();
      tg.expand();
    }
  }, []);

  const createPixel = (id: number, width: number, height: number): Pixel => {
    const colorIdx = Math.floor(Math.random() * NEON_COLORS.length);
    return {
      id,
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 2,
      vy: (Math.random() - 0.5) * 2,
      size: Math.random() * 4 + 4,
      color: NEON_COLORS[colorIdx].color,
      glow: NEON_COLORS[colorIdx].glow,
      opacity: 0.8 + Math.random() * 0.2
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
    setMotivation("Двигайте пальцем, чтобы убраться");
  }, []);

  useEffect(() => {
    initGame();
    window.addEventListener('resize', initGame);
    return () => window.removeEventListener('resize', initGame);
  }, [initGame]);

  // Fetch motivation when a milestone is reached
  useEffect(() => {
    if (score > 0 && score % 25 === 0) {
      getCleanupMessage(score).then(setMotivation);
    }
    if (score === totalPixels && totalPixels > 0) {
      setMotivation("Идеальная чистота!");
    }
  }, [score, totalPixels]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const update = () => {
      const vacuum = vacuumRef.current;
      const pixels = pixelsRef.current;
      const nextPixels: Pixel[] = [];
      let suckedCount = 0;

      for (let i = 0; i < pixels.length; i++) {
        const p = pixels[i];
        
        // Default movement
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= FRICTION;
        p.vy *= FRICTION;

        // Bounce off walls
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        if (vacuum.active) {
          const dx = vacuum.x - p.x;
          const dy = vacuum.y - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < SUCK_RADIUS) {
            // Pixel sucked in!
            suckedCount++;
            continue; // Skip adding to nextPixels
          } else if (dist < VACUUM_RADIUS) {
            // Apply attraction (ATTRACTION_FORCE is now 1.0)
            const force = (1 - dist / VACUUM_RADIUS) * ATTRACTION_FORCE;
            p.vx += (dx / dist) * force;
            p.vy += (dy / dist) * force;
          }
        }

        nextPixels.push(p);
      }

      if (suckedCount > 0) {
        setScore(prev => prev + suckedCount);
        
        // Trigger Haptic Feedback via Telegram Web App
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

      // Draw Vacuum Ring
      if (vacuum.active) {
        ctx.beginPath();
        ctx.arc(vacuum.x, vacuum.y, VACUUM_RADIUS, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(vacuum.x, vacuum.y, SUCK_RADIUS * 2, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.fill();
      }

      // Draw Pixels
      for (const p of pixels) {
        ctx.shadowBlur = 10;
        ctx.shadowColor = p.glow;
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.opacity;
        
        // Square "pixels"
        ctx.fillRect(p.x - p.size/2, p.y - p.size/2, p.size, p.size);
      }
      
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
    };

    const loop = () => {
      update();
      draw();
      animationFrameRef.current = requestAnimationFrame(loop);
    };

    animationFrameRef.current = requestAnimationFrame(loop);
    return () => {
      if (animationFrameRef.current !== undefined) cancelAnimationFrame(animationFrameRef.current);
    };
  }, []);

  const handlePointerMove = (e: React.PointerEvent) => {
    vacuumRef.current = {
      active: true,
      x: e.clientX,
      y: e.clientY
    };
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    vacuumRef.current = {
      active: true,
      x: e.clientX,
      y: e.clientY
    };
  };

  const handlePointerUp = () => {
    vacuumRef.current.active = false;
  };

  return (
    <div className="relative w-full h-screen overflow-hidden select-none bg-slate-900">
      <canvas
        ref={canvasRef}
        onPointerMove={handlePointerMove}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        className="w-full h-full cursor-none touch-none"
      />
      
      <HUD 
        score={score} 
        total={totalPixels} 
        message={motivation}
        onReset={initGame}
      />
      
      {/* Decorative gradient overlay */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-transparent to-slate-900/40" />
    </div>
  );
};

export default App;
