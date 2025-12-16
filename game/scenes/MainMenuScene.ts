
import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLOR_BACKGROUND, COLOR_ACCENT, COLOR_PRIMARY, TILE_WIDTH, TILE_HEIGHT, MAP_SIZE } from '../../constants';

export class MainMenuScene extends Phaser.Scene {
  declare add: Phaser.GameObjects.GameObjectFactory;
  declare scene: Phaser.Scenes.ScenePlugin;
  declare cameras: Phaser.Cameras.Scene2D.CameraManager;
  declare input: Phaser.Input.InputPlugin;
  declare tweens: Phaser.Tweens.TweenManager;

  constructor() {
    super('MainMenuScene');
  }

  create() {
    this.cameras.main.setBackgroundColor(COLOR_BACKGROUND);

    // 1. Draw a decorative background grid (Darker, non-interactive)
    this.drawBackgroundGrid();

    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;

    // 2. Title Text
    this.add.text(cx, cy - 120, 'ISODEFENSE CITY', {
      font: '900 72px monospace',
      color: '#10b981', // Emerald
      stroke: '#0f172a',
      strokeThickness: 8
    }).setOrigin(0.5);

    // 3. Subtitle
    this.add.text(cx, cy - 40, 'System Operational. Awaiting Command.', {
      font: '20px monospace',
      color: '#94a3b8' // Slate 400
    }).setOrigin(0.5);

    // 4. Start Button
    this.createStartButton(cx, cy + 60);

    // 5. Version/Credits
    this.add.text(GAME_WIDTH - 20, GAME_HEIGHT - 20, 'v1.0.0', {
      font: '14px monospace',
      color: '#334155'
    }).setOrigin(1, 1);
  }

  private createStartButton(x: number, y: number) {
    const w = 260;
    const h = 70;
    const container = this.add.container(x, y);

    const bg = this.add.graphics();
    bg.fillStyle(COLOR_PRIMARY, 1);
    bg.fillRoundedRect(-w/2, -h/2, w, h, 8);

    const text = this.add.text(0, 0, 'START MISSION', {
      font: 'bold 28px monospace',
      color: '#ffffff'
    }).setOrigin(0.5);

    container.add([bg, text]);

    // Interaction
    container.setSize(w, h);
    container.setInteractive(new Phaser.Geom.Rectangle(-w/2, -h/2, w, h), Phaser.Geom.Rectangle.Contains);

    container.on('pointerover', () => {
      bg.clear();
      bg.fillStyle(0x60a5fa, 1); // Lighter Blue
      bg.fillRoundedRect(-w/2, -h/2, w, h, 8);
      this.input.setDefaultCursor('pointer');
      this.tweens.add({ targets: container, scale: 1.05, duration: 100 });
    });

    container.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(COLOR_PRIMARY, 1);
      bg.fillRoundedRect(-w/2, -h/2, w, h, 8);
      this.input.setDefaultCursor('default');
      this.tweens.add({ targets: container, scale: 1.0, duration: 100 });
    });

    container.on('pointerdown', () => {
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
        this.scene.start('MainScene');
      });
    });
  }

  private drawBackgroundGrid() {
    const graphics = this.add.graphics();
    graphics.lineStyle(1, 0x334155, 0.3); // Very faint Slate 700

    // Center the grid visually
    const centerX = GAME_WIDTH / 2;
    const centerY = GAME_HEIGHT / 4; 

    // Draw a subset of the map for flavor
    for (let col = 0; col < MAP_SIZE; col++) {
      for (let row = 0; row < MAP_SIZE; row++) {
        // Simple Iso math inline for the background
        const x = (col - row) * (TILE_WIDTH / 2) + centerX;
        const y = (col + row) * (TILE_HEIGHT / 2) + centerY;

        // Draw Top of tile (Diamond)
        graphics.beginPath();
        graphics.moveTo(x, y - TILE_HEIGHT/2);
        graphics.lineTo(x + TILE_WIDTH/2, y);
        graphics.lineTo(x, y + TILE_HEIGHT/2);
        graphics.lineTo(x - TILE_WIDTH/2, y);
        graphics.closePath();
        graphics.strokePath();
      }
    }
  }
}
