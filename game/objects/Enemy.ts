
import Phaser from 'phaser';
import { PathfindingManager } from '../systems/PathfindingManager';
import { IsoUtils } from '../utils/IsoUtils';
import { GridPoint } from '../../types';
import { MainScene } from '../scenes/MainScene';
import { IStatusEffect } from '../types/StatusEffects';

export class Enemy extends Phaser.GameObjects.Container {
  declare scene: MainScene; 
  declare x: number;
  declare y: number;
  declare active: boolean;
  declare add: (child: Phaser.GameObjects.GameObject | Phaser.GameObjects.GameObject[]) => this;
  declare setDepth: (value: number) => this;
  declare setScale: (x: number, y?: number) => this;

  private pathfindingManager: PathfindingManager;
  private path: GridPoint[] = [];
  private isMoving: boolean = false;
  private sprite: Phaser.GameObjects.Sprite;
  private healthBar: Phaser.GameObjects.Graphics;
  
  // Movement Tween Reference
  private moveTween: Phaser.Tweens.Tween | null = null;

  // Status Effects
  private activeEffects: IStatusEffect[] = [];
  private speedModifier: number = 1.0;
  
  public gridCol: number;
  public gridRow: number;

  public maxHp: number = 100;
  public hp: number = 100;
  public moveSpeed: number = 300; 
  public isDead: boolean = false;

  constructor(scene: Phaser.Scene, col: number, row: number, pathfindingManager: PathfindingManager) {
    const startPos = IsoUtils.gridToScreen(col, row);
    super(scene, startPos.x, startPos.y);
    
    this.pathfindingManager = pathfindingManager;
    this.gridCol = col;
    this.gridRow = row;

    // Sprite
    this.sprite = scene.add.sprite(0, 0, 'enemy_walker');
    this.sprite.setOrigin(0.5, 1); // Feet at bottom center
    // Fallback if asset missing: Draw circle if width is minimal
    if (this.sprite.width <= 1) {
       // Just so we can see something if image fails
       this.sprite.setVisible(false);
       const g = scene.add.graphics();
       g.fillStyle(0xef4444);
       g.fillCircle(0, -16, 12);
       this.add(g);
    }

    this.add(this.sprite);

    // Health Bar Container
    this.healthBar = this.scene.add.graphics();
    this.add(this.healthBar);
    this.drawHealthBar();
    
    this.setDepth(startPos.y);
  }

  public setStats(hp: number, speedMsPerTile: number) {
    this.maxHp = hp;
    this.hp = hp;
    this.moveSpeed = speedMsPerTile;
    this.drawHealthBar();
  }

  private drawHealthBar() {
    this.healthBar.clear();
    
    const hpPercent = Math.max(0, this.hp / this.maxHp);
    const width = 24;
    const yOffset = -this.sprite.height - 10; // Floating above head

    // Background
    this.healthBar.fillStyle(0x000000, 1);
    this.healthBar.fillRect(-width/2, yOffset, width, 4);
    
    // Foreground
    const hpColor = hpPercent > 0.5 ? 0x22c55e : (hpPercent > 0.2 ? 0xfacc15 : 0xef4444);
    this.healthBar.fillStyle(hpColor, 1);
    this.healthBar.fillRect(-width/2, yOffset, width * hpPercent, 4);
  }

  public takeDamage(amount: number) {
    if (this.isDead) return;

    this.hp -= amount;
    this.drawHealthBar();

    // Damage Flash (Only if not under status effect tint override)
    // We mix tints or just flash red briefly
    const prevTint = this.sprite.tintTopLeft;
    this.sprite.setTint(0xff0000);
    this.scene.time.delayedCall(100, () => {
        if (!this.isDead) this.updateVisuals(); 
    });

    if (this.hp <= 0) {
      this.die();
    }
  }

  public applyEffect(effect: IStatusEffect) {
    if (this.isDead) return;

    // Check if effect of this type already exists
    const existing = this.activeEffects.find(e => e.type === effect.type);

    if (existing) {
        // Refresh duration
        if (existing.timer) existing.timer.remove();
        existing.timer = this.scene.time.delayedCall(effect.duration, () => {
            this.removeEffect(effect.type);
        });
        // We do not stack values, we keep the existing one (or overwrite if we wanted stronger slows)
    } else {
        // Add new effect
        const newEffect = { ...effect };
        newEffect.timer = this.scene.time.delayedCall(effect.duration, () => {
            this.removeEffect(effect.type);
        });
        this.activeEffects.push(newEffect);
        this.recalculateStats();
    }
  }

  private removeEffect(type: string) {
    this.activeEffects = this.activeEffects.filter(e => e.type !== type);
    this.recalculateStats();
  }

  private recalculateStats() {
    // Reset defaults
    this.speedModifier = 1.0;
    
    // Apply modifiers
    for (const effect of this.activeEffects) {
        if (effect.type === 'SLOW') {
            // Apply slow (multiply modifiers if we had multiple sources, but here strictly one type)
            this.speedModifier *= effect.value; 
        }
    }

    // Update Tween TimeScale to reflect speed change immediately
    if (this.moveTween && this.moveTween.isPlaying()) {
        this.moveTween.timeScale = this.speedModifier;
    }

    this.updateVisuals();
  }

  private updateVisuals() {
    // Priority: Red Flash (handled in takeDamage) > Blue (Slow) > Normal
    const isSlowed = this.activeEffects.some(e => e.type === 'SLOW');
    
    this.sprite.clearTint();
    if (isSlowed) {
        this.sprite.setTint(0x3b82f6); // Blue tint for slow
    }
  }

  private die() {
    this.isDead = true;
    this.isMoving = false;
    
    // Cleanup effects/timers
    this.activeEffects.forEach(e => e.timer?.remove());
    this.activeEffects = [];
    if (this.moveTween) this.moveTween.stop();

    this.scene.removeEnemy(this);

    if (this.scene.gameManager) {
      this.scene.gameManager.earnGold(15);
    }

    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      scaleY: 0,
      duration: 200,
      onComplete: () => {
        this.destroy();
      }
    });
  }

  public goTo(targetCol: number, targetRow: number) {
    if (this.isMoving || this.isDead) return;

    const start = { col: this.gridCol, row: this.gridRow };
    const end = { col: targetCol, row: targetRow };

    this.path = this.pathfindingManager.findPath(start, end);

    if (this.path.length === 0) return;

    this.path.shift(); 
    this.isMoving = true;
    this.moveNextStep();
  }

  private moveNextStep() {
    if (this.isDead) return;

    if (this.path.length === 0) {
      this.isMoving = false;
      this.reachGoal();
      return;
    }

    const nextNode = this.path.shift()!;
    const targetScreen = IsoUtils.gridToScreen(nextNode.col, nextNode.row);

    this.gridCol = nextNode.col;
    this.gridRow = nextNode.row;

    // Flip sprite based on direction
    if (targetScreen.x < this.x) {
        this.sprite.setFlipX(true);
    } else {
        this.sprite.setFlipX(false);
    }

    this.moveTween = this.scene.tweens.add({
      targets: this,
      x: targetScreen.x,
      y: targetScreen.y,
      duration: this.moveSpeed, // This is the base duration
      ease: 'Linear',
      onUpdate: () => {
        if (!this.isDead) this.setDepth(this.y);
      },
      onComplete: () => {
        if (!this.isDead) this.moveNextStep();
      }
    });
    
    // Apply current speed modifier to the new tween immediately
    this.moveTween.timeScale = this.speedModifier;
  }

  private reachGoal() {
    if (this.scene.gameManager) {
      this.scene.gameManager.loseLife();
    }
    // Cleanup before destroying
    this.activeEffects.forEach(e => e.timer?.remove());
    this.isDead = true; 
    this.scene.removeEnemy(this);
    this.destroy();
  }

  destroy(fromScene?: boolean) {
    this.activeEffects.forEach(e => e.timer?.remove());
    if (this.moveTween) this.moveTween.stop();
    super.destroy(fromScene);
  }
}
