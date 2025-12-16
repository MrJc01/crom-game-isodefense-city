import React, { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { phaserConfig } from '../game/phaserConfig';

const GameCanvas: React.FC = () => {
  const gameRef = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    // Initialize Phaser game only once
    if (!gameRef.current) {
      gameRef.current = new Phaser.Game(phaserConfig);
    }

    // Cleanup on unmount
    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, []);

  return (
    <div className="relative w-full h-full flex items-center justify-center bg-slate-900 shadow-2xl border-4 border-slate-700 rounded-lg overflow-hidden">
      {/* Phaser will inject the canvas into this div */}
      <div id="phaser-container" className="w-full h-full" />
      
      {/* Overlay UI Example */}
      <div className="absolute top-4 left-4 pointer-events-none">
        <div className="bg-slate-800/80 backdrop-blur-sm text-blue-400 border border-blue-500/30 p-4 rounded-md">
          <h1 className="text-xl font-bold uppercase tracking-wider">IsoDefense City</h1>
          <p className="text-xs text-slate-300">System: Operational</p>
          <p className="text-xs text-slate-400 mt-2">Controls: Arrow Keys to Pan, Q/E to Zoom</p>
        </div>
      </div>
    </div>
  );
};

export default GameCanvas;