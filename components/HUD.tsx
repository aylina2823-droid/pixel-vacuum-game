
import React from 'react';

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
  manualPower: number;
  onUpgradePower: () => void;
  onUpgradeSize: () => void;
  onActivateTurbo: () => void;
  onManualPowerChange: (val: number) => void;
  onForceReset: () => void;
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
  manualPower,
  onUpgradePower, 
  onUpgradeSize,
  onActivateTurbo,
  onManualPowerChange,
  onForceReset,
  isSizeMaxed
}) => {
  const isShopLocked = level < 3;
  const isTurboActive = turboTimeLeft > 0;

  return (
    <div className="absolute inset-0 pointer-events-none p-4 flex flex-col justify-between font-sans">
      {/* Top Header */}
      <div className="flex justify-between items-start w-full">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <div className="bg-slate-900/80 backdrop-blur-xl border border-white/10 p-3 rounded-2xl shadow-2xl">
              <p className="text-slate-400 text-[10px] uppercase tracking-widest font-bold mb-0.5">Level</p>
              <span className="text-3xl font-black text-white leading-none">{level}</span>
            </div>
            <button 
              onClick={onForceReset}
              className="pointer-events-auto bg-slate-800/40 hover:bg-red-900/40 border border-slate-700/30 px-2 py-1 rounded-lg text-[8px] text-slate-500 uppercase font-bold transition-colors"
            >
              Force Reset
            </button>
          </div>
          <div className="bg-slate-900/60 backdrop-blur-md border border-white/5 p-3 rounded-2xl shadow-xl">
            <p className="text-slate-400 text-[10px] uppercase tracking-widest font-bold mb-0.5">Progress</p>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-black text-white">{score}</span>
              <span className="text-slate-500 text-xs">/ {total}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-3">
          <div className="bg-amber-500/90 backdrop-blur-md p-3 rounded-2xl shadow-lg border border-amber-400/50 flex flex-col items-end">
            <p className="text-amber-100 text-[10px] uppercase tracking-widest font-bold mb-0.5">Coins</p>
            <div className="flex items-center gap-1">
              <span className="text-3xl font-black text-white drop-shadow-sm">🪙 {coins}</span>
            </div>
          </div>

          {/* Turbo Button */}
          <button 
            onClick={onActivateTurbo}
            disabled={coins < turboCost || isTurboActive}
            className={`pointer-events-auto flex flex-col items-center justify-center p-3 rounded-2xl border transition-all active:scale-90 shadow-2xl w-28 ${
              isTurboActive 
                ? 'bg-orange-500 border-orange-300 animate-pulse' 
                : coins >= turboCost 
                  ? 'bg-gradient-to-br from-amber-400 to-orange-600 border-amber-300 hover:brightness-110' 
                  : 'bg-slate-800/50 border-slate-700 opacity-40 grayscale'
            }`}
          >
            <span className="text-[10px] font-black text-white uppercase tracking-tighter">
              {isTurboActive ? `Boost: ${Math.ceil(turboTimeLeft)}s` : 'SUPER POWER'}
            </span>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="text-lg">⚡️</span>
              {!isTurboActive && <span className="text-white font-bold text-xs">💰 {turboCost}</span>}
            </div>
          </button>
        </div>
      </div>

      {/* Middle Feedback */}
      <div className="flex flex-col items-center">
        {message && (
          <div className="bg-white/10 backdrop-blur-sm px-4 py-1.5 rounded-full border border-white/10 mb-4 animate-in fade-in zoom-in duration-300">
            <p className="text-cyan-400 font-bold text-xs uppercase tracking-tight italic">{message}</p>
          </div>
        )}
      </div>

      {/* Bottom Controls */}
      <div className="flex flex-col gap-4">
        {/* Manual Power Slider */}
        <div className="pointer-events-auto bg-slate-900/80 backdrop-blur-md p-3 rounded-2xl border border-slate-700/50 self-end flex flex-col items-center gap-1 w-32">
          <p className="text-slate-400 text-[9px] font-bold uppercase">Manual Power</p>
          <input 
            type="range" 
            min="0.2" 
            max="2.5" 
            step="0.1" 
            value={manualPower}
            onChange={(e) => onManualPowerChange(parseFloat(e.target.value))}
            className="w-full accent-cyan-500 cursor-pointer"
          />
          <span className="text-white text-[10px] font-mono">x{manualPower.toFixed(1)}</span>
        </div>

        {/* Shop Buttons / Locked state */}
        <div className="flex gap-3 pointer-events-auto">
          {isShopLocked ? (
            <div className="flex-1 bg-slate-900/90 backdrop-blur-md border border-white/10 p-4 rounded-3xl flex items-center justify-center">
              <span className="text-slate-400 text-xs font-bold uppercase tracking-widest animate-pulse">
                🛒 Shop unlocks at Level 3
              </span>
            </div>
          ) : (
            <>
              <button 
                onClick={onUpgradePower}
                disabled={coins < powerUpgradeCost}
                className={`flex-1 group relative overflow-hidden p-4 rounded-2xl flex flex-col items-center transition-all active:scale-95 shadow-xl ${
                  coins >= powerUpgradeCost ? 'bg-indigo-600 hover:bg-indigo-500 border-t border-indigo-400' : 'bg-slate-800 opacity-50 grayscale'
                }`}
              >
                <span className="text-indigo-200 text-[9px] font-bold uppercase tracking-wider">Upgrade Power</span>
                <span className="text-white font-black text-lg leading-none mt-1">💰 {powerUpgradeCost}</span>
              </button>
              
              <button 
                onClick={onUpgradeSize}
                disabled={coins < sizeUpgradeCost || isSizeMaxed}
                className={`flex-1 group relative overflow-hidden p-4 rounded-2xl flex flex-col items-center transition-all active:scale-95 shadow-xl ${
                  (coins >= sizeUpgradeCost && !isSizeMaxed) ? 'bg-emerald-600 hover:bg-emerald-500 border-t border-emerald-400' : 'bg-slate-800 opacity-50 grayscale'
                }`}
              >
                <span className="text-emerald-200 text-[9px] font-bold uppercase tracking-wider">
                  {isSizeMaxed ? 'Max Size Reached' : 'Upgrade Size'}
                </span>
                <span className="text-white font-black text-lg leading-none mt-1">
                  {isSizeMaxed ? 'MAX' : `💰 ${sizeUpgradeCost}`}
                </span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default HUD;
