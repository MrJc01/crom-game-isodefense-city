
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

  constructor(scene: Phaser.Scene, x: number, y: number, typeKey: string) {
    super(scene, x, y, 'tower_lvl1');

    // Load Config
    this.config = TOWER_TYPES[typeKey] || TOWER_TYPES['ARCHER'];

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
    if (time > this.lastFired + this.config.cooldown) {
      this.tryFire(time);
    }
  }

  private tryFire(time: number) {
    const mainScene = this.scene as MainScene;
    const enemies = mainScene.getEnemies();

    let closestEnemy: Enemy | null = null;
    let closestDist = this.config.range;

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

    // Try play sniper sound, if not loaded fallback to arrow (logic handled in AudioManager mainly by file existence, but good to be safe)
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
        this.config.damage,
        this.config.projectileSpeed,
        this.config.projectileColor,
        this.config.isAoE,
        this.config.blastRadius,
        this.config.effect // Pass status effect if exists
    );
  }

  destroy(fromScene?: boolean) {
    this.scene.events.off('update', this.update, this);
    super.destroy(fromScene);
  }
}
