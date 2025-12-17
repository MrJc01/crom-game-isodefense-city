
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

  // Buffs
  private damageMultiplier: number = 1.0;

  constructor(scene: Phaser.Scene, x: number, y: number, typeKey: string) {
    super(scene, x, y, 'tower_lvl1');

    // Hide the placeholder sprite; we are going full procedural graphics
    this.sprite.setVisible(false);

    // Load Config
    this.config = TOWER_TYPES[typeKey] || TOWER_TYPES['ARCHER'];

    // Initialize Stats
    this.totalInvested = this.config.cost;
    this.currentDamage = this.config.damage;
    this.currentRange = this.config.range;
    this.currentCooldown = this.config.cooldown;

    // Add Turret Visuals Layer
    this.turretGraphics = scene.add.graphics();
    this.add(this.turretGraphics);
    
    // Initial Draw
    this.drawTurret();

    this.scene.events.on('update', this.update, this);
  }

  public get towerKey(): string {
    return this.config.key;
  }

  /**
   * Main rendering loop for the procedural tower structure.
   * Constructs pseudo-3D isometric shapes.
   */
  private drawTurret() {
    this.turretGraphics.clear();
    // Apply buff tint if active (Red glow if multiplier > 1)
    const baseTint = this.config.tint;
    const tint = this.damageMultiplier > 1.0 ? 0xff4444 : baseTint;

    // 1. Draw Base Platform (Common to all towers)
    // Dark metallic slab
    this.drawIsoBox(0, 0, 48, 8, 0x1e293b); 

    // 2. Draw Specific Tower Geometry
    switch(this.config.key) {
        case 'ARCHER':
            // Design: Tall, thin Monolith with glowing top
            this.drawIsoBox(0, -8, 24, 40, tint); 
            // Glowing Core/Eye
            this.drawIsoBox(0, -48, 12, 8, 0xffffff); 
            break;

        case 'CANNON':
            // Design: Heavy, stout block with a large barrel indication
            this.drawIsoBox(0, -8, 36, 20, tint);
            // "Barrel" (A darker box offset slightly)
            this.drawIsoBox(8, -18, 16, 12, 0x0f172a); 
            break;

        case 'SNIPER':
            // Design: Tripod-like thin base, very tall offset barrel
            this.drawIsoBox(0, -8, 12, 30, 0x475569); // Stand
            // Long Barrel Platform
            this.drawIsoBox(0, -38, 10, 8, tint);
            // Muzzle extension
            this.drawIsoBox(8, -40, 30, 4, 0xffffff); 
            break;

        case 'ICE':
            // Design: Floating Crystalline Shapes
            // Base crystal
            this.drawIsoBox(0, -15, 20, 20, tint);
            // Top floating crystal (Offset Y to look like it's hovering)
            this.drawIsoBox(0, -45, 14, 14, 0xcffafe);
            break;

        default:
            // Fallback Box
            this.drawIsoBox(0, -8, 20, 20, tint);
            break;
    }
  }

  /**
   * Draws a pseudo-3D isometric box.
   */
  private drawIsoBox(x: number, y: number, width: number, height: number, color: number) {
    const g = this.turretGraphics;
    
    // Calculate Dimensions
    const radiusW = width / 2;
    const radiusH = width / 4; 

    const colorTop = color;
    const colorLeft = this.dimColor(color, 0.8);
    const colorRight = this.dimColor(color, 0.6);

    const topY = y - height;

    const pTop = { x: x, y: topY - radiusH };
    const pRight = { x: x + radiusW, y: topY };
    const pBottom = { x: x, y: topY + radiusH };
    const pLeft = { x: x - radiusW, y: topY };

    // 1. Draw Left Face (Extrusion)
    g.fillStyle(colorLeft, 1);
    g.beginPath();
    g.moveTo(pLeft.x, pLeft.y);
    g.lineTo(pBottom.x, pBottom.y);
    g.lineTo(pBottom.x, pBottom.y + height);
    g.lineTo(pLeft.x, pLeft.y + height);
    g.closePath();
    g.fillPath();

    // 2. Draw Right Face (Extrusion)
    g.fillStyle(colorRight, 1);
    g.beginPath();
    g.moveTo(pRight.x, pRight.y);
    g.lineTo(pBottom.x, pBottom.y);
    g.lineTo(pBottom.x, pBottom.y + height);
    g.lineTo(pRight.x, pRight.y + height);
    g.closePath();
    g.fillPath();

    // 3. Draw Top Face (Diamond Cap)
    g.fillStyle(colorTop, 1);
    g.beginPath();
    g.moveTo(pTop.x, pTop.y);
    g.lineTo(pRight.x, pRight.y);
    g.lineTo(pBottom.x, pBottom.y);
    g.lineTo(pLeft.x, pLeft.y);
    g.closePath();
    g.fillPath();

    // Optional: Edge Highlights
    g.lineStyle(1, 0xffffff, 0.2);
    g.strokePath();
  }

  private dimColor(color: number, factor: number): number {
    const r = (color >> 16) & 0xFF;
    const g = (color >> 8) & 0xFF;
    const b = color & 0xFF;
    return (Math.floor(r * factor) << 16) | (Math.floor(g * factor) << 8) | Math.floor(b * factor);
  }

  update(time: number, delta: number) {
    if (time > this.lastFired + this.currentCooldown) {
      this.tryFire(time);
    }
  }

  private tryFire(time: number) {
    if (!this.scene) return;
    
    const mainScene = this.scene as MainScene;
    if (typeof mainScene.getEnemies !== 'function') return;

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
    if (!this.scene) return;
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
    mainScene.particleManager.playEffect('MUZZLE', this.x, this.y - 40);

    // Calculate Damage with Buffs
    const finalDamage = Math.floor(this.currentDamage * this.damageMultiplier);

    new Projectile(
        this.scene, 
        this.x, 
        this.y - 40, 
        target, 
        finalDamage,
        this.config.projectileSpeed,
        this.config.projectileColor,
        this.config.isAoE,
        this.config.blastRadius,
        this.config.effect 
    );
  }

  public setDamageMultiplier(multiplier: number) {
      this.damageMultiplier = multiplier;
      // Redraw to show "Overcharged" state (red glow)
      this.drawTurret();
      
      if (multiplier > 1.0) {
          // Play a small effect when buff is applied
          if (this.scene) {
            const mainScene = this.scene as MainScene;
            mainScene.particleManager.playEffect('BUILD', this.x, this.y);
          }
      }
  }

  // --- UPGRADE SYSTEM ---

  public getUpgradeCost(): number {
      return Math.floor(this.config.cost * 0.6 * this.level);
  }

  public getSellValue(): number {
      return Math.floor(this.totalInvested * 0.7);
  }

  public upgrade() {
      const cost = this.getUpgradeCost();
      this.level++;
      this.totalInvested += cost;

      this.currentDamage = Math.floor(this.currentDamage * 1.3);
      this.currentRange = Math.floor(this.currentRange * 1.1);
      this.currentCooldown = Math.max(100, Math.floor(this.currentCooldown * 0.9));

      this.setScale(1 + (this.level * 0.05)); 
      
      const mainScene = this.scene as MainScene;
      mainScene.particleManager.playEffect('BUILD', this.x, this.y);
      mainScene.audioManager.playSFX('sfx_build_place', { volume: 0.8, force: true });
  }

  public getStats() {
      return {
          name: this.config.name,
          level: this.level,
          damage: Math.floor(this.currentDamage * this.damageMultiplier), // Show Buffed Damage
          range: this.currentRange,
          cooldown: this.currentCooldown
      };
  }

  destroy(fromScene?: boolean) {
    if (this.scene) {
        this.scene.events.off('update', this.update, this);
    }
    super.destroy(fromScene);
  }
}
