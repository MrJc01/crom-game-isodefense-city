
import React, { useEffect, useState } from 'react';
import { TOWER_TYPES } from '../game/data/TowerTypes';
import { SPELLS, SpellType } from '../game/systems/MagicManager';

interface GameStats {
  gold: number;
  mana: number;
  lives: number;
}

interface WaveInfo {
  timeLeft: number;
  totalTime: number;
  waveNumber: number;
  phase: 'BUILDING' | 'COMBAT';
}

interface TowerStats {
  name: string;
  level: number;
  damage: number;
  range: number;
  cooldown: number;
}

// Helper to manage cooldowns locally in React for smooth UI updates
const useCooldown = (durationMs: number) => {
    const [isOnCooldown, setIsOnCooldown] = useState(false);
    const [timeLeft, setTimeLeft] = useState(0);

    const trigger = () => {
        setIsOnCooldown(true);
        setTimeLeft(durationMs);
    };

    useEffect(() => {
        if (!isOnCooldown) return;
        
        const interval = setInterval(() => {
            setTimeLeft(prev => {
                const next = prev - 100;
                if (next <= 0) {
                    setIsOnCooldown(false);
                    return 0;
                }
                return next;
            });
        }, 100);

        return () => clearInterval(interval);
    }, [isOnCooldown]);

    return { isOnCooldown, timeLeft, trigger };
};

const SpellCard: React.FC<{ spellId: SpellType, stats: GameStats, onCast: (id: SpellType) => void, listener: any }> = ({ spellId, stats, onCast }) => {
    const config = SPELLS[spellId];
    const { isOnCooldown, timeLeft, trigger } = useCooldown(config.cooldownMs);

    // Listen to global cast event to sync trigger
    useEffect(() => {
        const handleCast = (e: any) => {
            if (e.detail.spellId === spellId && e.detail.success) {
                trigger();
            }
        };
        window.addEventListener('iso-spell-cast', handleCast);
        return () => window.removeEventListener('iso-spell-cast', handleCast);
    }, [spellId]);

    const canAfford = stats.mana >= config.manaCost;
    const disabled = !canAfford || isOnCooldown;

    const percentLeft = (timeLeft / config.cooldownMs) * 100;

    return (
        <button
            onClick={() => onCast(spellId)}
            disabled={disabled}
            className={`
                relative w-20 h-28 rounded-lg border flex flex-col items-center justify-between p-2 transition-all overflow-hidden
                ${disabled ? 'opacity-50 grayscale cursor-not-allowed border-slate-700 bg-slate-800' : 'border-purple-500 bg-purple-900/20 hover:scale-105 hover:bg-purple-900/40 shadow-[0_0_10px_#a855f7]'}
            `}
        >
            {/* Cooldown Overlay */}
            {isOnCooldown && (
                <div 
                    className="absolute bottom-0 left-0 w-full bg-slate-900/80 z-20 transition-all duration-100 linear"
                    style={{ height: `${percentLeft}%` }}
                />
            )}

            <div className="text-[10px] font-bold text-slate-200 z-10 text-center leading-tight">{config.name}</div>
            
            <div className={`text-xs font-bold z-10 ${canAfford ? 'text-purple-300' : 'text-red-400'}`}>
                {config.manaCost} MP
            </div>

            {/* Icon Placeholder (Procedural Text) */}
            <div className="text-[10px] text-slate-400 z-10 italic text-center text-[0.6rem]">
                {spellId === 'REPAIR' ? 'HEAL' : spellId === 'OVERCHARGE' ? 'BUFF' : 'NUKE'}
            </div>
        </button>
    );
};

const GameInterface: React.FC = () => {
  // --- State ---
  const [stats, setStats] = useState<GameStats>({ gold: 500, mana: 0, lives: 20 });
  const [wave, setWave] = useState<WaveInfo>({ timeLeft: 0, totalTime: 1, waveNumber: 1, phase: 'BUILDING' });
  const [selection, setSelection] = useState<TowerStats | null>(null);
  const [activeBuildKey, setActiveBuildKey] = useState<string>('ARCHER');
  const [alertMsg, setAlertMsg] = useState<string | null>(null);
  const [gameOver, setGameOver] = useState<{success: boolean, finalWave?: number} | null>(null);
  const [showGrimoire, setShowGrimoire] = useState(true);

  // --- Event Listeners ---
  useEffect(() => {
    const handleStats = (e: any) => setStats(e.detail);
    const handleTimer = (e: any) => setWave(prev => ({ ...prev, timeLeft: e.detail.timeLeft, totalTime: e.detail.totalTime }));
    const handlePhase = (e: any) => setWave(prev => ({ ...prev, phase: e.detail.phase }));
    const handleSelection = (e: any) => setSelection(e.detail);
    const handleGameOver = (e: any) => setGameOver(e.detail);
    
    const handleWaveStart = (e: any) => {
      setWave(prev => ({ ...prev, waveNumber: e.detail.waveNumber }));
      setAlertMsg(`WAVE ${e.detail.waveNumber} DETECTED`);
      setTimeout(() => setAlertMsg(null), 3000);
    };

    window.addEventListener('iso-stats', handleStats);
    window.addEventListener('iso-timer', handleTimer);
    window.addEventListener('iso-phase', handlePhase);
    window.addEventListener('iso-wave-start', handleWaveStart);
    window.addEventListener('iso-selection', handleSelection);
    window.addEventListener('iso-game-over', handleGameOver);

    return () => {
      window.removeEventListener('iso-stats', handleStats);
      window.removeEventListener('iso-timer', handleTimer);
      window.removeEventListener('iso-phase', handlePhase);
      window.removeEventListener('iso-wave-start', handleWaveStart);
      window.removeEventListener('iso-selection', handleSelection);
      window.removeEventListener('iso-game-over', handleGameOver);
    };
  }, []);

  // --- Commanders ---
  const sendCommand = (action: string, payload: any = {}) => {
    window.dispatchEvent(new CustomEvent('iso-command', { detail: { action, payload } }));
  };

  const castSpell = (spellId: SpellType) => {
      window.dispatchEvent(new CustomEvent('iso-cast-spell', { detail: { spellId } }));
  };

  const handleBuildSelect = (key: string) => {
    setActiveBuildKey(key);
    sendCommand('SET_BUILD_MODE', { key });
  };

  const handleUpgrade = () => sendCommand('UPGRADE_TOWER');
  const handleSell = () => sendCommand('SELL_TOWER');

  // --- Helper Calculations ---
  const timerPct = Math.max(0, Math.min(1, wave.timeLeft / wave.totalTime));
  
  const getUpgradeCost = (towerName: string, level: number) => {
    const baseType = Object.values(TOWER_TYPES).find(t => t.name === towerName);
    if (!baseType) return 9999;
    return Math.floor(baseType.cost * 0.6 * level);
  };

  if (gameOver) return null;

  return (
    <div className="absolute inset-0 w-full h-full pointer-events-none flex flex-col justify-between p-4 overflow-hidden font-mono">
      
      {/* --- TOP BAR --- */}
      <div className="flex items-start justify-between">
        
        {/* Resources */}
        <div className="flex gap-4 pointer-events-auto">
          {/* Gold */}
          <div className="bg-slate-900/80 backdrop-blur-md border border-slate-700 rounded-lg px-4 py-2 flex items-center gap-3 shadow-lg">
            <div className="w-3 h-3 rounded-full bg-amber-400 shadow-[0_0_10px_#fbbf24]"></div>
            <div>
              <div className="text-[10px] text-slate-400 uppercase tracking-widest">Credits</div>
              <div className="text-xl font-bold text-amber-400 leading-none">{stats.gold}</div>
            </div>
          </div>

          {/* Mana */}
          <div className="bg-slate-900/80 backdrop-blur-md border border-slate-700 rounded-lg px-4 py-2 flex items-center gap-3 shadow-lg">
            <div className="w-3 h-3 rounded-full bg-purple-500 shadow-[0_0_10px_#a855f7]"></div>
            <div>
              <div className="text-[10px] text-slate-400 uppercase tracking-widest">Mana</div>
              <div className="text-xl font-bold text-purple-400 leading-none">{stats.mana}</div>
            </div>
          </div>

          {/* Lives */}
          <div className="bg-slate-900/80 backdrop-blur-md border border-slate-700 rounded-lg px-4 py-2 flex items-center gap-3 shadow-lg">
            <div className="w-3 h-3 rounded-full bg-rose-500 shadow-[0_0_10px_#f43f5e]"></div>
            <div>
              <div className="text-[10px] text-slate-400 uppercase tracking-widest">Integrity</div>
              <div className="text-xl font-bold text-rose-500 leading-none">{stats.lives}</div>
            </div>
          </div>
        </div>

        {/* Phase / Timer */}
        <div className="flex flex-col items-center gap-2">
            <div className={`text-lg font-bold tracking-widest px-4 py-1 rounded bg-slate-900/50 backdrop-blur ${wave.phase === 'COMBAT' ? 'text-red-500 animate-pulse border border-red-500/50' : 'text-sky-400 border border-sky-500/30'}`}>
                {wave.phase === 'COMBAT' ? 'COMBAT ACTIVE' : 'PREPARATION'}
            </div>
            {wave.phase === 'BUILDING' && (
               <div className="w-48 h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                  <div 
                    className="h-full bg-sky-500 transition-all duration-1000 ease-linear"
                    style={{ width: `${timerPct * 100}%` }}
                  />
               </div>
            )}
            <div className="text-slate-400 text-xs">WAVE {wave.waveNumber}</div>
        </div>
      </div>

      {/* --- WAVE ALERT OVERLAY --- */}
      {alertMsg && (
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
             <div className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-red-500 to-red-900 drop-shadow-[0_0_15px_rgba(239,68,68,0.8)] animate-bounce">
                WARNING
             </div>
             <div className="text-2xl text-red-100 font-bold tracking-[0.5em] mt-2 animate-pulse">
                {alertMsg}
             </div>
        </div>
      )}

      {/* --- BOTTOM AREA --- */}
      <div className="flex items-end justify-center relative w-full pointer-events-none">
        
        {/* --- GRIMOIRE (Magic Shop) --- */}
        <div className="pointer-events-auto absolute left-0 bottom-0 mb-2 flex flex-col gap-2">
            <div 
                className="bg-slate-900/90 backdrop-blur-xl border border-purple-500/50 rounded-lg p-3 shadow-2xl flex gap-2"
            >
                <div className="absolute -top-3 left-3 bg-slate-900 px-2 text-[10px] text-purple-400 border border-purple-500/50 rounded">GRIMOIRE</div>
                
                <SpellCard spellId="REPAIR" stats={stats} onCast={castSpell} listener={null} />
                <SpellCard spellId="OVERCHARGE" stats={stats} onCast={castSpell} listener={null} />
                <SpellCard spellId="NUKE" stats={stats} onCast={castSpell} listener={null} />
            </div>
        </div>

        {/* --- BUILD DECK --- */}
        <div className="flex gap-2 bg-slate-900/90 backdrop-blur-xl p-2 rounded-xl border border-slate-700 shadow-2xl pointer-events-auto">
          {Object.values(TOWER_TYPES).map((tower) => {
             const isActive = activeBuildKey === tower.key;
             const canAfford = stats.gold >= tower.cost;
             
             return (
               <button
                 key={tower.key}
                 onClick={() => handleBuildSelect(tower.key)}
                 className={`
                    relative group flex flex-col items-center justify-center w-24 h-24 rounded-lg border-2 transition-all
                    ${isActive 
                        ? 'border-emerald-500 bg-emerald-900/20 shadow-[0_0_15px_rgba(16,185,129,0.3)] scale-105 z-10' 
                        : 'border-slate-700 bg-slate-800/50 hover:bg-slate-700 hover:border-slate-500'
                    }
                    ${!canAfford && !isActive ? 'opacity-50 grayscale cursor-not-allowed' : ''}
                 `}
               >
                 <div className="text-xs font-bold text-slate-100 mt-1">{tower.name}</div>
                 <div className="text-[10px] text-amber-400">{tower.cost}g</div>
                 
                 {/* Decorative Corner */}
                 <div className={`absolute top-1 right-1 w-2 h-2 rounded-full ${isActive ? 'bg-emerald-400 animate-ping' : 'bg-slate-600'}`}></div>
               </button>
             );
          })}
          
          {/* Wall Button (Manual Add) */}
          <button
             onClick={() => handleBuildSelect('WALL')}
             className={`
                relative group flex flex-col items-center justify-center w-24 h-24 rounded-lg border-2 transition-all
                ${activeBuildKey === 'WALL'
                    ? 'border-emerald-500 bg-emerald-900/20 shadow-[0_0_15px_rgba(16,185,129,0.3)] scale-105 z-10' 
                    : 'border-slate-700 bg-slate-800/50 hover:bg-slate-700 hover:border-slate-500'
                }
                ${stats.gold < 20 && activeBuildKey !== 'WALL' ? 'opacity-50 grayscale' : ''}
             `}
           >
             <div className="text-xs font-bold text-slate-100 mt-1">WALL</div>
             <div className="text-[10px] text-amber-400">20g</div>
           </button>
        </div>

        {/* --- INSPECTOR PANEL (Bottom Right) --- */}
        {selection && (
          <div className="absolute right-0 bottom-32 w-72 bg-slate-900/95 backdrop-blur-xl border-l-4 border-blue-500 rounded-l-lg p-5 shadow-2xl pointer-events-auto transform transition-transform animate-slide-in-right">
             <div className="flex justify-between items-end border-b border-slate-700 pb-2 mb-4">
                <h2 className="text-2xl font-bold text-white">{selection.name.toUpperCase()}</h2>
                <span className="text-amber-400 font-bold">LVL {selection.level}</span>
             </div>
             
             <div className="grid grid-cols-2 gap-y-2 text-sm text-slate-300 mb-6">
                <div>DMG: <span className="text-white">{selection.damage}</span></div>
                <div>RNG: <span className="text-white">{selection.range}</span></div>
                <div className="col-span-2">SPD: <span className="text-white">{(selection.cooldown/1000).toFixed(1)}s</span></div>
             </div>
             
             <div className="flex gap-2">
                <button 
                  onClick={handleUpgrade}
                  disabled={stats.gold < getUpgradeCost(selection.name, selection.level)}
                  className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-bold py-2 rounded transition-colors flex flex-col items-center"
                >
                   <span>UPGRADE</span>
                   <span className="text-[10px] opacity-80">{getUpgradeCost(selection.name, selection.level)}g</span>
                </button>
                
                <button 
                  onClick={handleSell}
                  className="w-20 bg-red-900/80 hover:bg-red-700 border border-red-500/30 text-red-200 font-bold py-2 rounded transition-colors flex flex-col items-center justify-center"
                >
                   <span>SELL</span>
                </button>
             </div>
          </div>
        )}

      </div>
      
      {/* Styles for animation */}
      <style>{`
        @keyframes slide-in-right {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .animate-slide-in-right {
          animation: slide-in-right 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </div>
  );
};

export default GameInterface;
