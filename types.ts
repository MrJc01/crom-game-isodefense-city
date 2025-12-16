import Phaser from 'phaser';

export interface Point2D {
  x: number;
  y: number;
}

export interface GridPoint {
  row: number;
  col: number;
}

export enum GameState {
  BOOT = 'BOOT',
  MAIN_MENU = 'MAIN_MENU',
  GAMEPLAY = 'GAMEPLAY',
  GAME_OVER = 'GAME_OVER'
}

// Ensure Phaser types are recognized if not implicitly available
// In a real env, npm install phaser would handle this.
export type PhaserGame = Phaser.Game;