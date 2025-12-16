
import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../../constants';

interface GameOverData {
  success: boolean;
  finalWave: number;
}

export class GameOverScene extends Phaser.Scene {
  declare add: Phaser.GameObjects.GameObjectFactory;
  declare scene: Phaser.Scenes.ScenePlugin;
  declare cameras: Phaser.Cameras.Scene2D.CameraManager;
  declare input: Phaser.Input.InputPlugin;

  private success: boolean = false;
  private finalWave: number = 0;

  constructor() {
    super('GameOverScene');
  }

  init(data: GameOverData) {
    this.success = data.success;
    this.finalWave = data.finalWave;
  }

  create() {
    // 1. Semi-transparent overlay
    const overlay = this.add.graphics();
    overlay.fillStyle(0x0f172a, 0.85); // Dark Slate, high opacity
    overlay.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;

    // 2. Victory/Defeat Title
    const titleText = this.success ? 'MISSION ACCOMPLISHED' : 'COLONY LOST';
    const titleColor = this.success ? '#10b981' : '#ef4444'; // Emerald vs Red

    this.add.text(cx, cy - 100, titleText, {
      font: '900 64px monospace',
      color: titleColor,
      stroke: '#000000',
      strokeThickness: 6
    }).setOrigin(0.5);

    // 3. Stats
    const statsText = this.success 
      ? `All ${this.finalWave} waves cleared.` 
      : `Survived until Wave ${this.finalWave}`;
      
    this.add.text(cx, cy - 20, statsText, {
      font: '24px monospace',
      color: '#cbd5e1'
    }).setOrigin(0.5);

    // 4. Retry Button
    this.createRetryButton(cx, cy + 80);
  }

  private createRetryButton(x: number, y: number) {
    const w = 240;
    const h = 60;
    const container = this.add.container(x, y);

    const bg = this.add.graphics();
    bg.fillStyle(0x334155, 1); // Slate 700
    bg.fillRoundedRect(-w/2, -h/2, w, h, 8);

    const text = this.add.text(0, 0, 'RETRY MISSION', {
      font: 'bold 24px monospace',
      color: '#ffffff'
    }).setOrigin(0.5);

    container.add([bg, text]);
    container.setSize(w, h);
    container.setInteractive(new Phaser.Geom.Rectangle(-w/2, -h/2, w, h), Phaser.Geom.Rectangle.Contains);

    container.on('pointerover', () => {
      bg.clear();
      bg.fillStyle(0x475569, 1); // Slate 600
      this.input.setDefaultCursor('pointer');
    });

    container.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(0x334155, 1);
      this.input.setDefaultCursor('default');
    });

    container.on('pointerdown', () => {
      // Clean Restart Sequence
      this.scene.stop('MainScene');
      this.scene.stop('UIScene');
      this.scene.stop('GameOverScene');
      
      // Start Preloader to re-init everything cleanly
      this.scene.start('Preloader');
    });
  }
}
