
import Phaser from 'phaser';
import { IsoUtils } from '../utils/IsoUtils';
import { MainScene } from '../scenes/MainScene';
import { IStatusEffect } from '../types/StatusEffects';
import { Building } from './Building';

type EnemyState = 'MOVING' | 'ATTACKING';

export class Enemy extends Phaser.GameObjects.Container {
  declare scene: MainScene; 
  declare x: number;
  declare y: number;
  declare active: boolean;
  declare add: (child: Phaser.GameObjects.GameObject | Phaser.GameObjects.GameObject[]) => this;
  declare setDepth: (value: number) => this;
  declare setScale: (x: number, y?: number) => this;

  private sprite: Phaser.GameObjects.Sprite;
  private healthBar: Phaser.GameObjects.Graphics;
  
  // Movement Tween
  private moveTween: Phaser.Tweens.Tween | null = null;

  // Status Effects
  private activeEffects: IStatusEffect[] = [];
  private speedModifier: number = 1.0;
  
  // Stats
  public maxHp: number = 100;
  public hp: number = 100;
  public moveSpeed: number = 500; // Time per tile (lower is faster)
  public attackDamage: number = 10;
  public attackRate: number = 1000; // ms between attacks
  public isDead: boolean = false;

  // AI State
  public gridCol: number;
  public gridRow: number;
  private state: EnemyState = 'MOVING';
  private targetBuilding: Building | null = null;
  private attackTimer: Phaser.Time.TimerEvent | null = null;

  // Reference to BuildingManager (Accessed via Scene hack to avoid breaking constructor signature)
  private get buildingManager() {
      // @ts-ignore - Accessing public property that exists on MainScene
      return this.scene.buildingManager; 
  }

  constructor(scene: Phaser.Scene, col: number, row: number, unusedManager: any) {
    const startPos = IsoUtils.gridToScreen(col, row);
    super(scene, startPos.x, startPos.y);
    
    this.gridCol = col;
    this.gridRow = row;

    // Sprite
    this.sprite = scene.add.sprite(0, 0, 'enemy_walker');
    this.sprite.setOrigin(0.5, 1);
    
    // Fallback graphics
    if (this.sprite.width <= 1) {
       this.sprite.setVisible(false);
       const g = scene.add.graphics();
       g.fillStyle(0xef4444);
       g.fillCircle(0, -16, 12);
       this.add(g);
    }
    this.add(this.sprite);

    // Health Bar
    this.healthBar = this.scene.add.graphics();
    this.add(this.healthBar);
    this.drawHealthBar();
    
    this.setDepth(startPos.y);
    
    // Start logic loop
    this.scene.time.delayedCall(100, () => this.decideNextMove());
  }

  public setStats(hp: number, speedMsPerTile: number) {
    this.maxHp = hp;
    this.hp = hp;
    this.moveSpeed = speedMsPerTile;
    this.drawHealthBar();
  }

  // --- SIEGE AI ---

  public goTo(targetCol: number, targetRow: number) {
      // Kept for compatibility, but Siege AI overrides pathfinding.
      // We ignore the arguments and move to (10,10)
      this.decideNextMove();
  }

  private decideNextMove() {
      if (this.isDead) return;

      const targetCol = 10;
      const targetRow = 10;

      // 1. Check if reached HQ (or neighbor of HQ)
      if (this.gridCol === targetCol && this.gridRow === targetRow) {
          this.startAttackingHQ();
          return;
      }

      // 2. Calculate Next Tile (Simple direction)
      const dx = targetCol - this.gridCol;
      const dy = targetRow - this.gridRow;
      
      let nextCol = this.gridCol;
      let nextRow = this.gridRow;

      // Prefer moving along the axis with greater distance
      if (Math.abs(dx) >= Math.abs(dy)) {
          nextCol += Math.sign(dx);
      } else {
          nextRow += Math.sign(dy);
      }

      // 3. Check Collision
      // Access BuildingManager via Scene
      const building = this.buildingManager.getBuildingAt(nextCol, nextRow);

      if (building) {
          // BLOCKED -> Attack Building
          this.targetBuilding = building;
          this.state = 'ATTACKING';
          this.startAttackingBuilding();
      } else {
          // EMPTY -> Move
          this.state = 'MOVING';
          this.moveStep(nextCol, nextRow);
      }
  }

  private moveStep(col: number, row: number) {
      this.gridCol = col;
      this.gridRow = row;

      const targetPos = IsoUtils.gridToScreen(col, row);

      // Flip Sprite
      this.sprite.setFlipX(targetPos.x < this.x);

      this.moveTween = this.scene.tweens.add({
          targets: this,
          x: targetPos.x,
          y: targetPos.y,
          duration: this.moveSpeed,
          onUpdate: () => {
              if (!this.isDead) this.setDepth(this.y);
          },
          onComplete: () => {
              if (!this.isDead) this.decideNextMove();
          }
      });
      
      this.moveTween.timeScale = this.speedModifier;
  }

  private startAttackingBuilding() {
      if (!this.targetBuilding || !this.targetBuilding.active) {
          this.decideNextMove();
          return;
      }

      this.attackTimer = this.scene.time.addEvent({
          delay: this.attackRate,
          loop: true,
          callback: () => {
              if (this.targetBuilding && this.targetBuilding.active) {
                  this.scene.particleManager.playEffect('HIT', this.targetBuilding.x, this.targetBuilding.y - 20);
                  this.targetBuilding.takeDamage(this.attackDamage);
              } else {
                  // Building destroyed, resume moving
                  if (this.attackTimer) this.attackTimer.remove();
                  this.decideNextMove();
              }
          }
      });
  }

  private startAttackingHQ() {
      // We are AT the center. Attack the Colony integrity directly.
      this.state = 'ATTACKING';
      
      this.attackTimer = this.scene.time.addEvent({
          delay: 1000,
          loop: true,
          callback: () => {
              this.scene.gameManager.loseLife();
              this.scene.particleManager.playEffect('EXPLOSION', this.x, this.y);
          }
      });
  }

  // --- HEALTH & STATUS ---

  private drawHealthBar() {
    this.healthBar.clear();
    const hpPercent = Math.max(0, this.hp / this.maxHp);
    const width = 24;
    const yOffset = -this.sprite.height - 10; 
    this.healthBar.fillStyle(0x000000, 1);
    this.healthBar.fillRect(-width/2, yOffset, width, 4);
    const hpColor = hpPercent > 0.5 ? 0x22c55e : (hpPercent > 0.2 ? 0xfacc15 : 0xef4444);
    this.healthBar.fillStyle(hpColor, 1);
    this.healthBar.fillRect(-width/2, yOffset, width * hpPercent, 4);
  }

  public takeDamage(amount: number) {
    if (this.isDead) return;
    this.hp -= amount;
    this.drawHealthBar();
    const prevTint = this.sprite.tintTopLeft;
    this.sprite.setTint(0xff0000);
    this.scene.time.delayedCall(100, () => {
        if (!this.isDead) this.updateVisuals(); 
    });
    if (this.hp <= 0) this.die();
  }

  public applyEffect(effect: IStatusEffect) {
    if (this.isDead) return;
    const existing = this.activeEffects.find(e => e.type === effect.type);
    if (existing) {
        if (existing.timer) existing.timer.remove();
        existing.timer = this.scene.time.delayedCall(effect.duration, () => this.removeEffect(effect.type));
    } else {
        const newEffect = { ...effect };
        newEffect.timer = this.scene.time.delayedCall(effect.duration, () => this.removeEffect(effect.type));
        this.activeEffects.push(newEffect);
        this.recalculateStats();
    }
  }

  private removeEffect(type: string) {
    this.activeEffects = this.activeEffects.filter(e => e.type !== type);
    this.recalculateStats();
  }

  private recalculateStats() {
    this.speedModifier = 1.0;
    for (const effect of this.activeEffects) {
        if (effect.type === 'SLOW') this.speedModifier *= effect.value; 
    }
    if (this.moveTween && this.moveTween.isPlaying()) {
        this.moveTween.timeScale = this.speedModifier;
    }
    this.updateVisuals();
  }

  private updateVisuals() {
    const isSlowed = this.activeEffects.some(e => e.type === 'SLOW');
    this.sprite.clearTint();
    if (isSlowed) this.sprite.setTint(0x3b82f6);
  }

  private die() {
    this.isDead = true;
    if (this.attackTimer) this.attackTimer.remove();
    this.activeEffects.forEach(e => e.timer?.remove());
    if (this.moveTween) this.moveTween.stop();

    this.scene.removeEnemy(this);
    this.scene.gameManager.earnGold(15);

    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      scaleY: 0,
      duration: 200,
      onComplete: () => this.destroy()
    });
  }

  destroy(fromScene?: boolean) {
    if (this.attackTimer) this.attackTimer.remove();
    this.activeEffects.forEach(e => e.timer?.remove());
    if (this.moveTween) this.moveTween.stop();
    super.destroy(fromScene);
  }
}
