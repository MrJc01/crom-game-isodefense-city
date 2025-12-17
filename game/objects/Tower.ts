
import Phaser from 'phaser';
import { Building } from './Building';
import { MainScene } from '../scenes/MainScene';
import { Projectile } from './Projectile';
import { Enemy } from './Enemy';
import { TOWER_TYPES, ITowerConfig } from '../data/TowerTypes';

export class Tower extends Building {
  private config: ITowerConfig;
  private lastFired: number = 0;
  private turretGraphics: Phaser.GameObjects.Graphics;

  // RPG Stats
  public level: number = 1;
  public totalInvested: number = 0;
  public currentDamage: number = 0;
  public currentRange: number = 0;
  public currentCooldown: number = 0;

  constructor(scene: Phaser.Scene, x: number, y: number, typeKey: string) {
    super(scene, x, y, 'tower_lvl1');

    // Load Config
    this.config = TOWER_TYPES[typeKey] || TOWER_TYPES['ARCHER'];

    // Initialize Stats
    this.totalInvested = this.config.cost;
    this.currentDamage = this.config.damage;
    this.currentRange = this.config.range;
    this.currentCooldown = this.config.cooldown;

    // Visual Customization based on type
    this.sprite.setTint(this.config.tint);

    // Add Turret Visuals
    this.turretGraphics = scene.add.graphics();
    this.drawTurret();
    this.add(this.turretGraphics);

    this.scene.events.on('update', this.update, this);
  }

  private drawTurret() {
    this.turretGraphics.clear();
    const roofY = -50; 

    // Base of Turret
    this.turretGraphics.fillStyle(0x94a3b8);
    this.turretGraphics.fillCircle(0, roofY, 10); 
    
    // Barrel
    this.turretGraphics.fillStyle(0x475569);
    
    // Visually distinguish barrels
    if (this.config.key === 'CANNON') {
        // Thicker, shorter barrel
        this.turretGraphics.fillRect(-6, roofY - 8, 12, 16); 
    } else if (this.config.key === 'SNIPER') {
        // Long thin barrel
        this.turretGraphics.fillRect(-2, roofY - 10, 4, 30); 
    } else if (this.config.key === 'ICE') {
        // Crystal-like shape on top
        this.turretGraphics.fillStyle(0xa5f3fc); // Cyan-200
        this.turretGraphics.fillRect(-4, roofY - 12, 8, 12);
        this.turretGraphics.fillTriangle(-4, roofY - 12, 4, roofY - 12, 0, roofY - 20);
    } else {
        // Standard
        this.turretGraphics.fillRect(-4, roofY - 4, 8, 20);
    }
  }

  update(time: number, delta: number) {
    if (time > this.lastFired + this.currentCooldown) {
      this.tryFire(time);
    }
  }

  private tryFire(time: number) {
    const mainScene = this.scene as MainScene;
    const enemies = mainScene.getEnemies();

    let closestEnemy: Enemy | null = null;
    let closestDist = this.currentRange;

    for (const enemy of enemies) {
      if (enemy.active && !enemy.isDead) {
        const dist = Phaser.Math.Distance.Between(this.x, this.y, enemy.x, enemy.y);
        if (dist <= closestDist) {
          closestDist = dist;
          closestEnemy = enemy;
        }
      }
    }

    if (closestEnemy) {
      this.fire(closestEnemy);
      this.lastFired = time;
    }
  }

  private fire(target: Enemy) {
    // Play sound based on type
    const mainScene = this.scene as MainScene;
    let sfxKey = 'sfx_shoot_arrow'; // Default

    switch(this.config.key) {
        case 'CANNON': sfxKey = 'sfx_shoot_cannon'; break;
        case 'ICE': sfxKey = 'sfx_shoot_ice'; break;
        case 'SNIPER': sfxKey = 'sfx_shoot_sniper'; break; 
        default: sfxKey = 'sfx_shoot_arrow'; break;
    }

    if (this.config.key === 'SNIPER' && !this.scene.cache.audio.exists('sfx_shoot_sniper')) {
        sfxKey = 'sfx_shoot_arrow';
    }

    mainScene.audioManager.playSFX(sfxKey, { volume: 0.6 });

    // VFX: Muzzle Flash
    mainScene.particleManager.playEffect('MUZZLE', this.x, this.y - 50);

    new Projectile(
        this.scene, 
        this.x, 
        this.y - 50, 
        target, 
        this.currentDamage,
        this.config.projectileSpeed,
        this.config.projectileColor,
        this.config.isAoE,
        this.config.blastRadius,
        this.config.effect // Pass status effect if exists
    );
  }

  // --- UPGRADE SYSTEM ---

  public getUpgradeCost(): number {
      // Formula: Base Cost * 0.5 * Level
      return Math.floor(this.config.cost * 0.6 * this.level);
  }

  public getSellValue(): number {
      return Math.floor(this.totalInvested * 0.7);
  }

  public upgrade() {
      const cost = this.getUpgradeCost();
      this.level++;
      this.totalInvested += cost;

      // Improve Stats
      this.currentDamage = Math.floor(this.currentDamage * 1.3);
      this.currentRange = Math.floor(this.currentRange * 1.1);
      this.currentCooldown = Math.max(100, Math.floor(this.currentCooldown * 0.9));

      // Visual Feedback
      this.setScale(1 + (this.level * 0.05)); // Grow slightly
      
      // Particle Burst
      const mainScene = this.scene as MainScene;
      mainScene.particleManager.playEffect('BUILD', this.x, this.y);
      mainScene.audioManager.playSFX('sfx_build_place', { volume: 0.8, force: true });
  }

  public getStats() {
      return {
          name: this.config.name,
          level: this.level,
          damage: this.currentDamage,
          range: this.currentRange,
          cooldown: this.currentCooldown
      };
  }

  destroy(fromScene?: boolean) {
    this.scene.events.off('update', this.update, this);
    super.destroy(fromScene);
  }
}
