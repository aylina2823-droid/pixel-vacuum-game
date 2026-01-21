import React, { useState } from 'react';

interface HUDProps {
  score: number;
  total: number;
  coins: number;
  level: number;
  message: string;
  powerUpgradeCost: number;
  sizeUpgradeCost: number;
  turboCost: number;
  turboTimeLeft: number;
  onUpgradePower: () => void;
  onUpgradeSize: () => void;
  onActivateTurbo: () => void;
  isSizeMaxed: boolean;
}

const HUD: React.FC<HUDProps> = ({ 
  score, 
  total, 
  coins, 
  level, 
  message, 
  powerUpgradeCost, 
  sizeUpgradeCost,
  turboCost,
  turboTimeLeft,
  onUpgradePower, 
  onUpgradeSize,
  onActivateTurbo,
  isSizeMaxed
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const isTurboActive = turboTimeLeft > 0;

  const stopProp = (e: React.PointerEvent | React.MouseEvent) => e.stopPropagation();

  return (
    <div className="absolute inset-0 pointer-events-none p-4 flex flex-col justify-between font-sans">
      {/* Visibility Toggle Button */}
      <button 
        onPointerDown={stopProp}
        onClick={(e) => { e.stopPropagation(); setIsVisible(!isVisible); }}
        className="absolute top-16 right-4 pointer-events-auto bg-white/5 hover:bg-white/10 p-2 rounded-full border border-white/10 text-white/40 transition-all z-50"
      >
        {isVisible ? (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
        ) : (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
        )}
      </button>

      {/* Top Bar - Minimalist */}
      <div className={`flex justify-between items-center w-full px-4 py-2 bg-slate-900/40 backdrop-blur-md rounded-2xl border border-white/5 transition-opacity duration-300 ${isVisible ? 'opacity-70' : 'opacity-0'}`}>
        <div className="flex items-center gap-4">
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Level</span>
            <span className="text-xl font-black text-white">{level}</span>
          </div>
          <div className="h-6 w-[1px] bg-white/10" />
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Cleared</span>
            <span className="text-xl font-black text-white">{score}<span className="text-slate-500 text-xs">/{total}</span></span>
          </div>
        </div>

        <div className="flex flex-col items-end">
          <span className="text-[10px] text-amber-400 font-bold uppercase tracking-widest">Coins</span>
          <span className="text-xl font-black text-white">🪙 {coins}</span>
        </div>
      </div>

      {/* Center Feedback */}
      <div className="flex flex-col items-center flex-grow justify-center">
        {message && isVisible && (
          <div className="bg-white/5 backdrop-blur-sm px-4 py-1.5 rounded-full border border-white/10 animate-pulse">
            <p className="text-cyan-400 font-bold text-xs uppercase tracking-widest italic">{message}</p>
          </div>
        )}
      </div>

      {/* Bottom Icons - Round Buttons */}
      <div className={`flex justify-center items-center gap-6 pb-6 transition-all duration-500 ${isVisible ? 'opacity-70 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        
        {/* Power Upgrade */}
        <button 
          onPointerDown={stopProp}
          onClick={onUpgradePower}
          disabled={coins < powerUpgradeCost}
          className={`group pointer-events-auto relative w-16 h-16 flex flex-col items-center justify-center rounded-full border transition-all active:scale-90 shadow-lg ${
            coins >= powerUpgradeCost ? 'bg-indigo-600/80 border-indigo-400/50 hover:bg-indigo-500' : 'bg-slate-800/40 border-slate-700/50 grayscale opacity-50'
          }`}
        >
          <span className="text-2xl mb-1">💪</span>
          <span className="text-[9px] font-bold text-white">💰{powerUpgradeCost}</span>
        </button>

        {/* Super Power / Turbo */}
        <button 
          onPointerDown={stopProp}
          onClick={onActivateTurbo}
          disabled={coins < turboCost || isTurboActive}
          className={`group pointer-events-auto relative w-20 h-20 flex flex-col items-center justify-center rounded-full border transition-all active:scale-95 shadow-2xl ${
            isTurboActive 
              ? 'bg-orange-500 border-orange-300 animate-pulse' 
              : coins >= turboCost 
                ? 'bg-gradient-to-br from-amber-400 to-orange-600 border-amber-300' 
                : 'bg-slate-800/40 border-slate-700/50 grayscale opacity-50'
          }`}
        >
          <span className="text-3xl">⚡</span>
          <span className="text-[10px] font-black text-white uppercase mt-1">
            {isTurboActive ? `${Math.ceil(turboTimeLeft)}s` : `💰${turboCost}`}
          </span>
        </button>

        {/* Size Upgrade */}
        <button 
          onPointerDown={stopProp}
          onClick={onUpgradeSize}
          disabled={coins < sizeUpgradeCost || isSizeMaxed}
          className={`group pointer-events-auto relative w-16 h-16 flex flex-col items-center justify-center rounded-full border transition-all active:scale-90 shadow-lg ${
            (coins >= sizeUpgradeCost && !isSizeMaxed) ? 'bg-emerald-600/80 border-emerald-400/50 hover:bg-emerald-500' : 'bg-slate-800/40 border-slate-700/50 grayscale opacity-50'
          }`}
        >
          <span className="text-2xl mb-1">🔍</span>
          <span className="text-[9px] font-bold text-white">
            {isSizeMaxed ? 'MAX' : `💰${sizeUpgradeCost}`}
          </span>
        </button>
      </div>
    </div>
  );
};

export default HUD;
