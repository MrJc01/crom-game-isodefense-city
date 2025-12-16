import React from 'react';
import GameCanvas from './components/GameCanvas';

const App: React.FC = () => {
  return (
    <div className="w-screen h-screen bg-slate-950 flex flex-col">
      {/* Header / Nav */}
      <header className="h-14 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-6">
        <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-slate-100 font-semibold tracking-wide">PHASER 3 ENGINE</span>
        </div>
        <div className="text-slate-400 text-sm">v0.1.0 Alpha</div>
      </header>

      {/* Main Game Area */}
      <main className="flex-1 p-4 overflow-hidden">
        <GameCanvas />
      </main>
    </div>
  );
};

export default App;