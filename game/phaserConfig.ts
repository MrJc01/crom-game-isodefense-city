
import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { Preloader } from './scenes/Preloader';
import { MainScene } from './scenes/MainScene';
import { UIScene } from './scenes/UIScene';
import { MainMenuScene } from './scenes/MainMenuScene';
import { GameOverScene } from './scenes/GameOverScene';
import { GAME_WIDTH, GAME_HEIGHT, COLOR_BACKGROUND } from '../constants';

/**
 * The "Technical Blueprint" for the Phaser Game Instance.
 * - Resolution: 1280x720
 * - Physics: Arcade (Lightweight, sufficient for 2.5D logic)
 * - Scale: FIT (Responsive)
 */
export const phaserConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO, // WebGL if available, Canvas fallback
  parent: 'phaser-container', // ID of the DOM element to mount to
  backgroundColor: COLOR_BACKGROUND,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  pixelArt: true, // Crucial for crisp pixel art if used
  physics: {
    default: 'arcade',
    arcade: {
      debug: false, // Disable debug bodies for production/gameplay
      gravity: { x: 0, y: 0 } // Top-down, no gravity needed
    }
  },
  scene: [BootScene, Preloader, MainMenuScene, MainScene, UIScene, GameOverScene]
};
