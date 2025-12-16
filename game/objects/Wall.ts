
import Phaser from 'phaser';
import { Building } from './Building';

export class Wall extends Building {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'wall_stone');
    // No extra graphics needed, just the sprite
  }
}
