
import Phaser from 'phaser';
import { MainScene } from './MainScene';
import { GAME_WIDTH } from '../../constants';
import { TOWER_TYPES } from '../data/TowerTypes';
import { BuildButton } from '../ui/BuildButton';

export class UIScene extends Phaser.Scene {
  declare add: Phaser.GameObjects.GameObjectFactory;
  declare scene: Phaser.Scenes.ScenePlugin;
  declare game: Phaser.Game;
  declare cameras: Phaser.Cameras.Scene2D.CameraManager;

  private goldText!: Phaser.GameObjects.Text;
  private livesText!: Phaser.GameObjects.Text;
  private waveText!: Phaser.GameObjects.Text;
  private timerText!: Phaser.GameObjects.Text;
  
  private mainScene!: MainScene;

  // Buttons storage
  private buttons: BuildButton[] = [];

  constructor() {
    super({ key: 'UIScene', active: false });
  }

  create() {
    this.mainScene = this.scene.get('MainScene') as MainScene;

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

    this.createTopBar();
    this.createBottomBar();
    
    // Initial update
    const stats = this.mainScene.gameManager.getStats();
    this.updateStats(stats);
  }

  private createTopBar() {
    const bg = this.add.graphics();
    bg.fillStyle(0x0f172a, 0.8);
    bg.fillRect(0, 0, GAME_WIDTH, 50);

    const style = { font: '20px monospace', color: '#ffffff' };
    
    this.goldText = this.add.text(20, 15, 'Gold: 0', { ...style, color: '#fbbf24' });
    this.livesText = this.add.text(200, 15, 'Lives: 0', { ...style, color: '#f87171' });
    
    this.waveText = this.add.text(GAME_WIDTH - 200, 15, 'Wave: 1', style);
    this.timerText = this.add.text(GAME_WIDTH - 80, 15, '00s', { ...style, color: '#38bdf8' });
  }

  private createBottomBar() {
    const barHeight = 120; 
    const yPos = this.cameras.main.height - barHeight;

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
    // We map TOWER_TYPES to a generic config format
    const buildOptions = Object.values(TOWER_TYPES).map(t => ({
        key: t.key,
        name: t.name,
        cost: t.cost,
        tint: t.tint,
        texture: 'tower_lvl1' // Default tower sprite
    }));
    
    // Add Wall manually as it's not in TOWER_TYPES
    buildOptions.push({
        key: 'WALL',
        name: 'Wall',
        cost: 20,
        tint: 0x94a3b8, // Grey tint
        texture: 'wall_stone'
    });

    // 2. Layout Calculation
    const buttonSpacing = 130;
    const totalWidth = buildOptions.length * buttonSpacing;
    const startX = (GAME_WIDTH - totalWidth) / 2 + (buttonSpacing / 2);
    const centerY = yPos + (barHeight / 2);

    // 3. Generate Buttons
    buildOptions.forEach((opt, index) => {
        const btn = new BuildButton(
            this,
            startX + (index * buttonSpacing),
            centerY,
            opt.key,
            opt.name,
            opt.cost,
            opt.tint,
            opt.texture
        );

        btn.onClick(() => {
            this.handleSelection(opt.key);
        });

        this.add.existing(btn);
        this.buttons.push(btn);
    });

    // Default Selection
    this.handleSelection('ARCHER');
  }

  private handleSelection(key: string) {
      // 1. Notify MainScene
      this.mainScene.setBuildMode(key);

      // 2. Update UI Visuals
      this.buttons.forEach(btn => {
          btn.setActive(btn.key === key);
      });

      // 3. Sound
      this.mainScene.audioManager.playSFX('sfx_ui_click', { volume: 0.5 });
  }

  private updateStats(stats: { gold: number, lives: number }) {
    this.goldText.setText(`Gold: ${stats.gold}`);
    this.livesText.setText(`Lives: ${stats.lives}`);

    // Update affordance on buttons
    this.buttons.forEach(btn => {
        btn.setAffordable(stats.gold >= btn.cost);
    });
  }

  private updateTimer(seconds: number) {
    if (seconds <= 0) {
        this.timerText.setText('');
    } else {
        this.timerText.setText(`${seconds}s`);
    }
  }

  private onWaveStart(waveNum: number) {
    this.waveText.setText(`Wave: ${waveNum}`);
    
    const flash = this.add.text(GAME_WIDTH/2, 200, `WAVE ${waveNum}`, {
        font: 'bold 48px monospace',
        color: '#ef4444',
        stroke: '#000',
        strokeThickness: 4
    }).setOrigin(0.5);
    
    this.add.tween({
        targets: flash,
        alpha: 0,
        y: 150,
        duration: 2000,
        onComplete: () => flash.destroy()
    });
  }

  private onPhaseChange(phase: string) {
    if (phase === 'BUILDING') {
        this.timerText.setColor('#38bdf8');
        this.waveText.setText('PREP');
    } else {
        this.timerText.setColor('#ef4444');
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
