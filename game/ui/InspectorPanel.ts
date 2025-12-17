
import Phaser from 'phaser';
import { Tower } from '../objects/Tower';
import { GAME_WIDTH, GAME_HEIGHT } from '../../constants';
import { GameManager } from '../systems/GameManager';

export class InspectorPanel extends Phaser.GameObjects.Container {
  declare add: (child: Phaser.GameObjects.GameObject | Phaser.GameObjects.GameObject[]) => this;
  declare scene: Phaser.Scene;
  declare setVisible: (value: boolean) => this;
  declare setAlpha: (value: number) => this;
  declare y: number;
  declare visible: boolean;

  private bg: Phaser.GameObjects.Graphics;
  private selectedTower: Tower | null = null;
  private gameManager: GameManager;

  // UI Elements
  private titleText: Phaser.GameObjects.Text;
  private levelText: Phaser.GameObjects.Text;
  private statDamage: Phaser.GameObjects.Text;
  private statRange: Phaser.GameObjects.Text;
  private statSpeed: Phaser.GameObjects.Text;
  
  private btnUpgrade: Phaser.GameObjects.Container;
  private btnSell: Phaser.GameObjects.Container;
  
  private btnUpgradeText: Phaser.GameObjects.Text;
  private btnUpgradeCost: Phaser.GameObjects.Text;
  private btnSellText: Phaser.GameObjects.Text;

  private readonly WIDTH = 300;
  private readonly HEIGHT = 200;

  constructor(scene: Phaser.Scene, gameManager: GameManager) {
    const x = GAME_WIDTH - 320;
    const y = GAME_HEIGHT - 220; // Bottom Right, above build bar
    super(scene, x, y);
    
    this.gameManager = gameManager;

    // Background
    this.bg = scene.add.graphics();
    this.bg.fillStyle(0x1e293b, 0.95);
    this.bg.lineStyle(2, 0x334155);
    this.bg.fillRoundedRect(0, 0, this.WIDTH, this.HEIGHT, 12);
    this.bg.strokeRoundedRect(0, 0, this.WIDTH, this.HEIGHT, 12);
    this.add(this.bg);

    // Header
    this.titleText = scene.add.text(20, 20, 'TOWER', { font: 'bold 20px monospace', color: '#ffffff' });
    this.levelText = scene.add.text(280, 20, 'LVL 1', { font: 'bold 20px monospace', color: '#fbbf24' }).setOrigin(1, 0);
    this.add([this.titleText, this.levelText]);

    // Stats
    const sX = 20;
    const sY = 60;
    const style = { font: '16px monospace', color: '#cbd5e1' };
    
    this.statDamage = scene.add.text(sX, sY, 'DMG: 0', style);
    this.statRange = scene.add.text(sX + 130, sY, 'RNG: 0', style);
    this.statSpeed = scene.add.text(sX, sY + 30, 'SPD: 0s', style);
    
    this.add([this.statDamage, this.statRange, this.statSpeed]);

    // Buttons
    this.btnUpgrade = this.createButton(20, 130, 160, 50, 0x3b82f6, 'UPGRADE');
    this.btnSell = this.createButton(200, 130, 80, 50, 0xef4444, 'SELL');
    
    // Interactive
    this.setupButtonInteractions();

    this.setVisible(false);
    
    // Listen for gold changes to update upgrade button state
    this.gameManager.on('stats-changed', this.updateButtonState, this);
  }

  private createButton(x: number, y: number, w: number, h: number, color: number, label: string): Phaser.GameObjects.Container {
      const container = this.scene.add.container(x, y);
      
      const bg = this.scene.add.graphics();
      bg.fillStyle(color, 1);
      bg.fillRoundedRect(0, 0, w, h, 8);
      
      const txt = this.scene.add.text(w/2, h/2 - (label === 'UPGRADE' ? 8 : 0), label, {
          font: 'bold 16px monospace', color: '#ffffff'
      }).setOrigin(0.5);

      container.add([bg, txt]);
      container.setData('bg', bg); // Store ref
      container.setData('baseColor', color);

      if (label === 'UPGRADE') {
          this.btnUpgradeText = txt;
          this.btnUpgradeCost = this.scene.add.text(w/2, h/2 + 10, '100g', {
            font: '12px monospace', color: '#e2e8f0'
          }).setOrigin(0.5);
          container.add(this.btnUpgradeCost);
      } else {
          this.btnSellText = txt;
      }

      const hitArea = new Phaser.Geom.Rectangle(0, 0, w, h);
      container.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);

      this.add(container);
      return container;
  }

  private setupButtonInteractions() {
      // Upgrade Click
      this.btnUpgrade.on('pointerdown', () => {
          if (this.selectedTower) {
              const cost = this.selectedTower.getUpgradeCost();
              if (this.gameManager.canAfford(cost)) {
                  this.gameManager.spendGold(cost);
                  this.selectedTower.upgrade();
                  this.refresh();
              }
          }
      });

      // Sell Click
      this.btnSell.on('pointerdown', () => {
          if (this.selectedTower) {
              this.scene.events.emit('request-sell-tower');
          }
      });

      // Hover Effects
      [this.btnUpgrade, this.btnSell].forEach(btn => {
          btn.on('pointerover', () => {
             this.scene.input.setDefaultCursor('pointer');
             btn.setScale(1.02);
          });
          btn.on('pointerout', () => {
             this.scene.input.setDefaultCursor('default');
             btn.setScale(1.0);
          });
      });
  }

  public setTower(tower: Tower) {
      this.selectedTower = tower;
      this.refresh();
      this.setVisible(true);
      
      // Animation
      this.setAlpha(0);
      this.y = GAME_HEIGHT - 210;
      this.scene.tweens.add({
          targets: this,
          alpha: 1,
          y: GAME_HEIGHT - 220,
          duration: 200,
          ease: 'Power2'
      });
  }

  public hide() {
      this.selectedTower = null;
      this.setVisible(false);
  }

  public refresh() {
      if (!this.selectedTower) return;

      const stats = this.selectedTower.getStats();
      this.titleText.setText(stats.name.toUpperCase());
      this.levelText.setText(`LVL ${stats.level}`);
      
      this.statDamage.setText(`DMG: ${stats.damage}`);
      this.statRange.setText(`RNG: ${stats.range}`);
      this.statSpeed.setText(`SPD: ${(stats.cooldown/1000).toFixed(1)}s`);

      // Update Buttons
      const upgradeCost = this.selectedTower.getUpgradeCost();
      this.btnUpgradeCost.setText(`${upgradeCost}g`);
      
      const sellValue = this.selectedTower.getSellValue();
      this.btnSellText.setText(`SELL\n+${sellValue}g`); // Multiline sell text

      this.updateButtonState();
  }

  private updateButtonState() {
      if (!this.selectedTower || !this.visible) return;

      const upgradeCost = this.selectedTower.getUpgradeCost();
      const canAfford = this.gameManager.canAfford(upgradeCost);

      const bg = this.btnUpgrade.getData('bg') as Phaser.GameObjects.Graphics;
      const baseColor = this.btnUpgrade.getData('baseColor');

      bg.clear();
      bg.fillStyle(canAfford ? baseColor : 0x64748b, 1); // Grey out if cant afford
      bg.fillRoundedRect(0, 0, 160, 50, 8);

      this.btnUpgrade.alpha = canAfford ? 1 : 0.7;
      if (!canAfford) this.btnUpgrade.disableInteractive();
      else this.btnUpgrade.setInteractive();
  }
}
