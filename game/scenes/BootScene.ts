
import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  declare scene: Phaser.Scenes.ScenePlugin;

  constructor() {
    super('BootScene');
  }

  create() {
    // Boot logic (e.g. registry setup) could go here
    this.scene.start('Preloader');
  }
}
