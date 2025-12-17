
import React from 'react';
import GameCanvas from './components/GameCanvas';
import GameInterface from './components/GameInterface';

const App: React.FC = () => {
  return (
    <div className="w-screen h-screen bg-slate-950 flex flex-col overflow-hidden relative">
      {/* Header / Nav */}
      <header className="h-14 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-6 z-50 relative shadow-md">
        <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-slate-100 font-semibold tracking-wide">PHASER 3 ENGINE</span>
        </div>
        <div className="text-slate-400 text-sm">v0.2.0 Beta</div>
      </header>

      {/* Main Game Container */}
      <main className="flex-1 relative overflow-hidden">
        {/* The Phaser Canvas (Bottom Layer) */}
        <GameCanvas />
        
        {/* The React HUD (Top Layer) */}
        <GameInterface />
      </main>
    </div>
  );
};

export default App;
