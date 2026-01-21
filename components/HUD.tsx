
import React from 'react';

interface HUDProps {
  score: number;
  total: number;
  message: string;
  onReset: () => void;
}

const HUD: React.FC<HUDProps> = ({ score, total, message, onReset }) => {
  return (
    <div className="absolute inset-0 pointer-events-none p-6 flex flex-col justify-between">
      <div className="flex justify-between items-start">
        <div className="bg-slate-800/40 backdrop-blur-md border border-slate-700/50 p-4 rounded-2xl shadow-2xl">
          <p className="text-slate-400 text-xs uppercase tracking-widest font-bold mb-1">Очищено</p>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black text-white">{score}</span>
            <span className="text-slate-500 text-sm">/ {total}</span>
          </div>
        </div>
        
        {score === total && (
          <button 
            onClick={onReset}
            className="pointer-events-auto bg-white text-slate-900 px-6 py-3 rounded-full font-bold text-sm uppercase tracking-wider hover:bg-cyan-400 transition-colors shadow-lg active:scale-95"
          >
            Заново
          </button>
        )}
      </div>

      <div className="flex flex-col items-center">
        {message && (
          <div className="bg-slate-900/60 backdrop-blur-sm px-6 py-2 rounded-full border border-slate-700/50 mb-8 animate-bounce">
            <p className="text-cyan-400 font-medium text-sm">{message}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default HUD;
