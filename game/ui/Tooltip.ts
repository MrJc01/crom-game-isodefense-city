
import Phaser from 'phaser';
import { ITowerConfig } from '../data/TowerTypes';
import { GAME_WIDTH, GAME_HEIGHT } from '../../constants';

export class Tooltip extends Phaser.GameObjects.Container {
  declare add: (child: Phaser.GameObjects.GameObject | Phaser.GameObjects.GameObject[]) => this;
  declare scene: Phaser.Scene;
  declare setVisible: (value: boolean) => this;
  declare setDepth: (value: number) => this;
  declare setPosition: (x?: number, y?: number, z?: number, w?: number) => this;
  declare setAlpha: (value: number) => this;
  
  private bg: Phaser.GameObjects.Graphics;
  private titleText: Phaser.GameObjects.Text;
  private costText: Phaser.GameObjects.Text;
  private descText: Phaser.GameObjects.Text;
  
  // Stats Grid
  private statDmg: Phaser.GameObjects.Text;
  private statRng: Phaser.GameObjects.Text;
  private statSpd: Phaser.GameObjects.Text;
  private statDps: Phaser.GameObjects.Text;

  private readonly WIDTH = 260;
  private readonly PADDING = 14;

  constructor(scene: Phaser.Scene) {
    super(scene, 0, 0);

    // 1. Background
    this.bg = scene.add.graphics();
    this.add(this.bg);

    // 2. Header
    this.titleText = scene.add.text(this.PADDING, this.PADDING, '', {
      font: 'bold 16px monospace',
      color: '#ffffff'
    });
    this.add(this.titleText);

    this.costText = scene.add.text(this.WIDTH - this.PADDING, this.PADDING, '', {
      font: 'bold 16px monospace',
      color: '#fbbf24' // Amber 400
    }).setOrigin(1, 0);
    this.add(this.costText);

    // 3. Stats Grid (Row 1: DMG / RNG, Row 2: SPD / DPS)
    const statsY = 42;
    const col2X = this.WIDTH / 2;
    const style = { font: '13px monospace', color: '#cbd5e1' }; // Slate 300

    this.statDmg = scene.add.text(this.PADDING, statsY, '', style);
    this.statRng = scene.add.text(col2X, statsY, '', style);
    this.statSpd = scene.add.text(this.PADDING, statsY + 18, '', style);
    this.statDps = scene.add.text(col2X, statsY + 18, '', style);

    this.add([this.statDmg, this.statRng, this.statSpd, this.statDps]);

    // 4. Divider Line
    // (Drawn in show method)

    // 5. Description
    this.descText = scene.add.text(this.PADDING, statsY + 46, '', {
      font: 'italic 12px monospace',
      color: '#94a3b8', // Slate 400
      wordWrap: { width: this.WIDTH - (this.PADDING * 2) }
    });
    this.add(this.descText);

    this.setVisible(false);
    this.setDepth(10000);
  }

  public show(config: ITowerConfig | null, x: number, y: number) {
    if (!config) return;

    // Populate Data
    this.titleText.setText(config.name.toUpperCase());
    this.costText.setText(`${config.cost}g`);
    
    const reloadSec = (config.cooldown / 1000).toFixed(1);
    
    // Using simple labeling formatting
    this.statDmg.setText(`DMG: ${config.damage}`);
    this.statRng.setText(`RNG: ${config.range}`);
    this.statSpd.setText(`SPD: ${reloadSec}s`);
    this.statDps.setText(config.dpsEstimate);

    this.descText.setText(config.description);

    // Dynamic Sizing
    const descHeight = this.descText.height;
    const totalHeight = 88 + descHeight + this.PADDING; // Header + Stats + Padding + Desc

    // Draw Background
    this.bg.clear();
    
    // Main Box
    this.bg.fillStyle(0x0f172a, 0.95); // Slate 900
    this.bg.lineStyle(1, 0x10b981, 0.6); // Emerald Border
    this.bg.fillRoundedRect(0, 0, this.WIDTH, totalHeight, 6);
    this.bg.strokeRoundedRect(0, 0, this.WIDTH, totalHeight, 6);

    // Separator Line
    this.bg.lineStyle(1, 0x334155, 0.5); // Slate 700
    this.bg.beginPath();
    this.bg.moveTo(this.PADDING, 80);
    this.bg.lineTo(this.WIDTH - this.PADDING, 80);
    this.bg.strokePath();

    // Positioning with Screen Clamping
    let finalX = x - (this.WIDTH / 2);
    let finalY = y - totalHeight - 20;

    // Clamp X
    if (finalX < 10) finalX = 10;
    if (finalX + this.WIDTH > GAME_WIDTH - 10) finalX = GAME_WIDTH - this.WIDTH - 10;
    
    // Clamp Y (Flip if too close to top)
    if (finalY < 10) finalY = y + 30;

    this.setPosition(finalX, finalY);
    this.setVisible(true);
    this.setAlpha(0);

    // Pop-in Animation
    this.scene.tweens.add({
        targets: this,
        alpha: 1,
        y: finalY - 5, // Slight slide up
        duration: 200,
        ease: 'Power2'
    });
  }

  public showSimple(name: string, cost: number, desc: string, x: number, y: number) {
    this.titleText.setText(name.toUpperCase());
    this.costText.setText(`${cost}g`);
    
    this.statDmg.setText("HP: HIGH");
    this.statRng.setText("RNG: 0");
    this.statSpd.setText("TYPE: BLOCK");
    this.statDps.setText("");

    this.descText.setText(desc);

    const descHeight = this.descText.height;
    const totalHeight = 88 + descHeight + this.PADDING;

    this.bg.clear();
    this.bg.fillStyle(0x0f172a, 0.95);
    this.bg.lineStyle(1, 0x94a3b8, 0.6); // Grey Border for generic
    this.bg.fillRoundedRect(0, 0, this.WIDTH, totalHeight, 6);
    this.bg.strokeRoundedRect(0, 0, this.WIDTH, totalHeight, 6);
    
    this.bg.lineStyle(1, 0x334155, 0.5);
    this.bg.beginPath();
    this.bg.moveTo(this.PADDING, 80);
    this.bg.lineTo(this.WIDTH - this.PADDING, 80);
    this.bg.strokePath();

    let finalX = x - (this.WIDTH / 2);
    let finalY = y - totalHeight - 20;

    if (finalX < 10) finalX = 10;
    if (finalX + this.WIDTH > GAME_WIDTH - 10) finalX = GAME_WIDTH - this.WIDTH - 10;
    if (finalY < 10) finalY = y + 30;

    this.setPosition(finalX, finalY);
    this.setVisible(true);
    this.setAlpha(1);
  }

  public hide() {
    this.setVisible(false);
  }
}
