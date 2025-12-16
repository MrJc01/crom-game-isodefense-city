
import Phaser from 'phaser';
import { Enemy } from './Enemy';
import { MainScene } from '../scenes/MainScene';
import { IStatusEffect } from '../types/StatusEffects';

export class Projectile extends Phaser.GameObjects.Container {
  declare x: number;
  declare y: number;
  declare scene: MainScene; // Enforce MainScene type for enemy access
  declare add: (child: Phaser.GameObjects.GameObject | Phaser.GameObjects.GameObject[]) => this;
  declare setDepth: (value: number) => this;
  declare destroy: (fromScene?: boolean) => void;

  private target: Enemy;
  private speed: number;
  private damage: number;
  
  // AoE Props
  private isAoE: boolean;
  private blastRadius: number;
  
  // Status Effect Payload
  private effect?: IStatusEffect;

  constructor(
    scene: Phaser.Scene, 
    x: number, 
    y: number, 
    target: Enemy, 
    damage: number,
    speed: number,
    color: number,
    isAoE: boolean = false,
    blastRadius: number = 0,
    effect?: IStatusEffect
  ) {
    super(scene, x, y);
    this.target = target;
    this.damage = damage;
    this.speed = speed;
    this.isAoE = isAoE;
    this.blastRadius = blastRadius;
    this.effect = effect;

    // Visuals
    const graphics = scene.add.graphics();
    graphics.fillStyle(color, 1);
    
    if (this.isAoE) {
        // Cannonball looks slightly larger
        graphics.fillCircle(0, 0, 6);
    } else {
        // Standard projectile
        graphics.fillCircle(0, 0, 4);
    }
    
    this.add(graphics);

    scene.add.existing(this);
    this.setDepth(10000); 
    
    this.scene.events.on('update', this.update, this);
  }

  update(time: number, delta: number) {
    // If target is null/destroyed and NOT AoE, destroy projectile.
    if (!this.target || !this.target.active || this.target.isDead) {
        this.destroyProjectile();
        return;
    }

    const targetX = this.target.x;
    const targetY = this.target.y - 16;

    const distance = Phaser.Math.Distance.Between(this.x, this.y, targetX, targetY);
    
    if (distance < 10) {
        this.hitTarget();
        return;
    }

    // Movement
    const rotation = Phaser.Math.Angle.Between(this.x, this.y, targetX, targetY);
    const velocity = this.speed * (delta / 1000);
    
    this.x += Math.cos(rotation) * velocity;
    this.y += Math.sin(rotation) * velocity;
  }

  private hitTarget() {
    this.scene.audioManager.playSFX('sfx_enemy_hit', { volume: 0.4 });

    if (this.isAoE) {
        this.explode();
    } else {
        // Single Target
        if (this.target && this.target.active) {
            this.target.takeDamage(this.damage);
            if (this.effect) {
                this.target.applyEffect(this.effect);
            }
        }
        
        // VFX: Hit Impact or Ice
        if (this.effect && this.effect.type === 'SLOW') {
             this.scene.particleManager.playEffect('ICE', this.x, this.y);
        } else {
             this.scene.particleManager.playEffect('HIT', this.x, this.y);
        }
    }
    this.destroyProjectile();
  }

  private explode() {
    // 1. Particle Effect
    this.scene.particleManager.playEffect('EXPLOSION', this.x, this.y);

    // 2. Logic: Find enemies in range
    const enemies = this.scene.getEnemies();
    
    for (const enemy of enemies) {
        if (!enemy.active || enemy.isDead) continue;
        
        // Target chest/center of enemy
        const dist = Phaser.Math.Distance.Between(this.x, this.y, enemy.x, enemy.y - 16);
        
        if (dist <= this.blastRadius) {
            enemy.takeDamage(this.damage);
            if (this.effect) {
                enemy.applyEffect(this.effect);
            }
        }
    }
  }

  private destroyProjectile() {
    this.scene.events.off('update', this.update, this);
    this.destroy();
  }
}
