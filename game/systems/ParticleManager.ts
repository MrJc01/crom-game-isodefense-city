
import Phaser from 'phaser';

export type EffectType = 'HIT' | 'EXPLOSION' | 'BUILD' | 'ICE' | 'MUZZLE';

export class ParticleManager {
  private scene: Phaser.Scene;
  
  // Emitters
  private hitEmitter!: Phaser.GameObjects.Particles.ParticleEmitter;
  private explosionEmitter!: Phaser.GameObjects.Particles.ParticleEmitter;
  private buildEmitter!: Phaser.GameObjects.Particles.ParticleEmitter;
  private iceEmitter!: Phaser.GameObjects.Particles.ParticleEmitter;
  private muzzleEmitter!: Phaser.GameObjects.Particles.ParticleEmitter;

  private readonly DEPTH = 100000;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.createEmitters();
  }

  private createEmitters() {
    // 1. HIT IMPACT (Sparks)
    // Burst of yellow sparks (high speed, short life)
    this.hitEmitter = this.scene.add.particles(0, 0, 'particle_spark', {
        lifespan: 350,
        speed: { min: 150, max: 350 },
        scale: { start: 1, end: 0 },
        alpha: { start: 1, end: 0 },
        tint: 0xfacc15, // Yellow-400
        blendMode: 'ADD',
        rotate: { min: 0, max: 360 },
        emitting: false
    });

    // 2. EXPLOSION (AoE)
    // Burst of orange/grey particles
    this.explosionEmitter = this.scene.add.particles(0, 0, 'particle_smoke', {
        lifespan: 600,
        speed: { min: 50, max: 200 },
        scale: { start: 1.5, end: 0.5 },
        alpha: { start: 1, end: 0 },
        tint: [0xf97316, 0xef4444, 0x57534e], // Orange -> Red -> Stone Grey
        blendMode: 'NORMAL',
        emitting: false
    });

    // 3. BUILD DUST (Construction)
    // Ring of grey smoke puffs moving outwards
    this.buildEmitter = this.scene.add.particles(0, 0, 'particle_smoke', {
        lifespan: 1000,
        speed: { min: 40, max: 80 },
        angle: { min: 0, max: 360 }, 
        scale: { start: 0.4, end: 1.0 },
        alpha: { start: 0.5, end: 0 },
        tint: 0xe2e8f0, // Slate 200
        emitting: false,
        gravityY: -10
    });

    // 4. ICE SHATTER (Slow effect)
    // Burst of cyan/white particles
    this.iceEmitter = this.scene.add.particles(0, 0, 'particle_flare', {
        lifespan: 500,
        speed: { min: 50, max: 150 },
        scale: { start: 0.6, end: 0 },
        alpha: { start: 0.8, end: 0 },
        tint: 0xcffafe, // Cyan 100
        blendMode: 'ADD',
        emitting: false
    });

    // 5. MUZZLE FLASH (Firing)
    // Quick flare
    this.muzzleEmitter = this.scene.add.particles(0, 0, 'particle_flare', {
        lifespan: 80,
        speed: 0,
        scale: { start: 0.6, end: 0.2 },
        alpha: { start: 1, end: 0 },
        tint: 0xffffaa, // Pale Yellow
        blendMode: 'ADD',
        emitting: false
    });

    // Set Depth High so particles appear over buildings/units
    this.hitEmitter.setDepth(this.DEPTH);
    this.explosionEmitter.setDepth(this.DEPTH);
    this.buildEmitter.setDepth(this.DEPTH);
    this.iceEmitter.setDepth(this.DEPTH);
    this.muzzleEmitter.setDepth(this.DEPTH);
  }

  public playEffect(type: EffectType, x: number, y: number) {
    switch (type) {
        case 'HIT':
            this.hitEmitter.explode(8, x, y);
            break;
        case 'EXPLOSION':
            this.explosionEmitter.explode(15, x, y);
            break;
        case 'BUILD':
            this.buildEmitter.explode(12, x, y);
            break;
        case 'ICE':
            this.iceEmitter.explode(10, x, y);
            break;
        case 'MUZZLE':
            this.muzzleEmitter.explode(1, x, y);
            break;
    }
  }
}
