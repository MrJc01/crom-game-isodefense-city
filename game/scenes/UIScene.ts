
import Phaser from 'phaser';
import { MainScene } from './MainScene';
import { GAME_WIDTH, GAME_HEIGHT } from '../../constants';
import { TOWER_TYPES } from '../data/TowerTypes';
import { BuildButton } from '../ui/BuildButton';
import { Tooltip } from '../ui/Tooltip';

export class UIScene extends Phaser.Scene {
  declare add: Phaser.GameObjects.GameObjectFactory;
  declare scene: Phaser.Scenes.ScenePlugin;
  declare game: Phaser.Game;
  declare cameras: Phaser.Cameras.Scene2D.CameraManager;
  declare tweens: Phaser.Tweens.TweenManager;

  private mainScene!: MainScene;

  // HUD Elements
  private goldText!: Phaser.GameObjects.Text;
  private livesText!: Phaser.GameObjects.Text;
  private waveText!: Phaser.GameObjects.Text;
  private statusText!: Phaser.GameObjects.Text;
  private timerBar!: Phaser.GameObjects.Graphics;
  private timerBarBg!: Phaser.GameObjects.Graphics;
  
  // Components
  private tooltip!: Tooltip;
  private buttons: BuildButton[] = [];

  // Timer Animation State
  private timerState = { pct: 0 };
  private timerBounds = { x: 0, y: 0, w: 0, h: 0 };

  constructor() {
    super({ key: 'UIScene', active: false });
  }

  create() {
    this.mainScene = this.scene.get('MainScene') as MainScene;

    // -- Event Listeners --
    if (this.mainScene.gameManager) {
      this.mainScene.gameManager.on('stats-changed', this.updateStats, this);
      this.mainScene.gameManager.on('game-over', this.onDefeat, this);
    }

    if (this.mainScene.waveManager) {
        this.mainScene.waveManager.on('wave-timer', this.updateTimer, this);
        this.mainScene.waveManager.on('wave-started', this.onWaveStart, this);
        this.mainScene.waveManager.on('phase-change', this.onPhaseChange, this);
        this.mainScene.waveManager.on('game-victory', this.onVictory, this);
    }

    // -- UI Construction --
    this.createTopDashboard();
    this.createBottomBuildBar();
    
    // Create Tooltip Layer (always on top)
    this.tooltip = new Tooltip(this);
    this.add.existing(this.tooltip);

    // Initial update
    const stats = this.mainScene.gameManager.getStats();
    this.updateStats(stats);
  }

  // ==========================================
  // TOP DASHBOARD (HUD)
  // ==========================================
  private createTopDashboard() {
    const h = 60;
    
    // Background with shadow
    const bg = this.add.graphics();
    bg.fillStyle(0x0f172a, 0.9); // Slate 900
    bg.fillRect(0, 0, GAME_WIDTH, h);
    
    // Bottom Border
    bg.lineStyle(2, 0x1e293b);
    bg.beginPath();
    bg.moveTo(0, h);
    bg.lineTo(GAME_WIDTH, h);
    bg.strokePath();

    // -- Left: Resources --
    const resY = h / 2;
    
    // Gold
    const goldIcon = this.add.circle(40, resY, 8, 0xfbbf24);
    this.goldText = this.add.text(60, resY, '0', {
        font: 'bold 20px monospace', color: '#fbbf24'
    }).setOrigin(0, 0.5);

    // Divider
    this.add.rectangle(140, resY, 2, 24, 0x334155).setOrigin(0.5);

    // Lives
    const livesIcon = this.add.rectangle(170, resY, 14, 14, 0xf87171);
    this.livesText = this.add.text(190, resY, '20', {
        font: 'bold 20px monospace', color: '#f87171'
    }).setOrigin(0, 0.5);


    // -- Center: Wave Status --
    const centerX = GAME_WIDTH / 2;
    
    // Status Label
    this.statusText = this.add.text(centerX, resY - 10, 'PREPARATION', {
        font: 'bold 12px monospace', color: '#64748b'
    }).setOrigin(0.5);

    // Wave Counter
    this.waveText = this.add.text(centerX, resY + 10, 'WAVE 1', {
        font: 'bold 20px monospace', color: '#f1f5f9'
    }).setOrigin(0.5);


    // -- Right: Timer --
    const timerX = GAME_WIDTH - 200;
    
    // Label
    this.add.text(timerX, resY, 'NEXT WAVE', {
        font: 'bold 12px monospace', color: '#94a3b8'
    }).setOrigin(1, 0.5);

    // Timer Bar
    this.timerBounds = { x: timerX + 15, y: resY - 6, w: 160, h: 12 };
    
    // Bar Background
    this.timerBarBg = this.add.graphics();
    this.timerBarBg.fillStyle(0x334155, 1);
    this.timerBarBg.fillRoundedRect(this.timerBounds.x, this.timerBounds.y, this.timerBounds.w, this.timerBounds.h, 4);

    // Bar Fill
    this.timerBar = this.add.graphics();
    this.timerBar.fillStyle(0x38bdf8, 1); // Sky Blue
    // Initial fill
    this.drawTimerBar(0);
  }

  // ==========================================
  // BOTTOM BUILD BAR
  // ==========================================
  private createBottomBuildBar() {
    const barHeight = 130; 
    const yPos = GAME_HEIGHT - barHeight;

    // Background Panel
    const bg = this.add.graphics();
    bg.fillStyle(0x0f172a, 0.95);
    bg.fillRect(0, yPos, GAME_WIDTH, barHeight);
    
    // Top border line
    bg.lineStyle(2, 0x334155);
    bg.beginPath();
    bg.moveTo(0, yPos);
    bg.lineTo(GAME_WIDTH, yPos);
    bg.strokePath();

    // 1. Prepare Data List
    const buildOptions = Object.values(TOWER_TYPES).map(t => ({
        key: t.key,
        name: t.name,
        cost: t.cost,
        tint: t.tint,
        texture: 'tower_lvl1'
    }));
    
    // Add Wall manually
    buildOptions.push({
        key: 'WALL',
        name: 'Wall',
        cost: 20,
        tint: 0x94a3b8,
        texture: 'wall_stone'
    });

    // 2. Layout Calculation
    const buttonSpacing = 140;
    const totalWidth = buildOptions.length * buttonSpacing;
    const startX = (GAME_WIDTH - totalWidth) / 2 + (buttonSpacing / 2);
    const centerY = yPos + (barHeight / 2);

    // 3. Generate Buttons
    buildOptions.forEach((opt, index) => {
        const btnX = startX + (index * buttonSpacing);
        const btn = new BuildButton(
            this,
            btnX,
            centerY,
            opt.key,
            opt.name,
            opt.cost,
            opt.tint,
            opt.texture
        );

        // Click Handler
        btn.onClick(() => {
            this.handleSelection(opt.key);
        });

        // Tooltip Handlers
        btn.setHoverCallbacks(
            // On Hover
            () => {
                if (opt.key === 'WALL') {
                    this.tooltip.showSimple(
                        "Stone Wall", 
                        20, 
                        "Blocks enemy movement. Enemies must destroy it to pass.", 
                        btnX, 
                        yPos
                    );
                } else {
                    const data = TOWER_TYPES[opt.key];
                    this.tooltip.show(data, btnX, yPos);
                }
            },
            // On Out
            () => {
                this.tooltip.hide();
            }
        );

        this.add.existing(btn);
        this.buttons.push(btn);
    });

    // Default Selection
    this.handleSelection('ARCHER');
  }

  // ==========================================
  // LOGIC & UPDATES
  // ==========================================

  private handleSelection(key: string) {
      this.mainScene.setBuildMode(key);
      
      this.buttons.forEach(btn => {
          btn.setActive(btn.key === key);
      });

      this.mainScene.audioManager.playSFX('sfx_ui_click', { volume: 0.5 });
  }

  private updateStats(stats: { gold: number, lives: number }) {
    this.goldText.setText(`${stats.gold}`);
    this.livesText.setText(`${stats.lives}`);

    // Update affordance on buttons
    this.buttons.forEach(btn => {
        btn.setAffordable(stats.gold >= btn.cost);
    });
  }

  private updateTimer(timeLeft: number, totalTime: number) {
    const targetPct = Phaser.Math.Clamp(timeLeft / totalTime, 0, 1);
    
    // Tween the bar value for smoothness
    this.tweens.add({
        targets: this.timerState,
        pct: targetPct,
        duration: 1000, // Tween over the 1 second interval
        ease: 'Linear',
        onUpdate: () => {
            this.drawTimerBar(this.timerState.pct);
        }
    });
  }

  private drawTimerBar(pct: number) {
    this.timerBar.clear();
    if (pct > 0) {
        this.timerBar.fillStyle(0x38bdf8);
        this.timerBar.fillRoundedRect(
            this.timerBounds.x, 
            this.timerBounds.y, 
            this.timerBounds.w * pct, 
            this.timerBounds.h, 
            4
        );
    }
  }

  private onWaveStart(waveNum: number) {
    this.waveText.setText(`WAVE ${waveNum}`);
    
    // Instant clear timer
    this.tweens.killTweensOf(this.timerState);
    this.timerState.pct = 0;
    this.drawTimerBar(0);

    // Big Center Announcement
    const flash = this.add.text(GAME_WIDTH/2, 200, `WAVE ${waveNum} INCOMING`, {
        font: 'bold 48px monospace',
        color: '#ef4444',
        stroke: '#000',
        strokeThickness: 6
    }).setOrigin(0.5);
    
    this.add.tween({
        targets: flash,
        alpha: 0,
        y: 150,
        duration: 2500,
        onComplete: () => flash.destroy()
    });
  }

  private onPhaseChange(phase: string) {
    if (phase === 'BUILDING') {
        this.statusText.setText('PREPARATION');
        this.statusText.setColor('#38bdf8'); // Blue
        this.waveText.setColor('#94a3b8'); // Dim the wave text
        this.timerBarBg.setVisible(true);
    } else {
        this.statusText.setText('COMBAT ACTIVE');
        this.statusText.setColor('#ef4444'); // Red
        this.waveText.setColor('#f1f5f9'); // Bright White
        this.timerBarBg.setVisible(false);
        this.timerBar.clear();
    }
  }

  private onDefeat() {
    this.scene.launch('GameOverScene', { 
      success: false, 
      finalWave: this.mainScene.waveManager.currentWaveNumber 
    });
  }

  private onVictory(data: { wave: number }) {
    this.scene.launch('GameOverScene', { 
      success: true, 
      finalWave: data.wave 
    });
  }
}
