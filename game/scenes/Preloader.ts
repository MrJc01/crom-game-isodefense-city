
import Phaser from 'phaser';

export class Preloader extends Phaser.Scene {
  declare load: Phaser.Loader.LoaderPlugin;
  declare add: Phaser.GameObjects.GameObjectFactory;
  declare scene: Phaser.Scenes.ScenePlugin;
  declare cameras: Phaser.Cameras.Scene2D.CameraManager;
  declare make: Phaser.GameObjects.GameObjectCreator;

  constructor() {
    super('Preloader');
  }

  preload() {
    this.createLoadingBar();

    // -- Asset Pipeline --
    this.load.setPath('assets/');

    // In a real scenario, these files must exist in /public/assets/
    // We assume standard isometric sprites.
    
    // Buildings
    this.load.image('base_tile', 'buildings/base_tile.png');
    this.load.image('tower_lvl1', 'buildings/tower_lvl1.png');
    this.load.image('wall_stone', 'buildings/wall_stone.png');

    // Units
    this.load.image('enemy_walker', 'units/enemy_walker.png');

    // Audio - BGM
    this.load.audio('bgm_game', 'audio/bgm_game.mp3');

    // Audio - SFX
    this.load.audio('sfx_shoot_arrow', 'audio/sfx_shoot_arrow.mp3');
    this.load.audio('sfx_shoot_cannon', 'audio/sfx_shoot_cannon.mp3');
    this.load.audio('sfx_shoot_ice', 'audio/sfx_shoot_ice.mp3'); // Reused for Sniper or unique
    this.load.audio('sfx_shoot_sniper', 'audio/sfx_shoot_sniper.mp3'); // Optional if file exists
    
    this.load.audio('sfx_build_place', 'audio/sfx_build_place.mp3');
    this.load.audio('sfx_ui_click', 'audio/sfx_ui_click.mp3');
    this.load.audio('sfx_enemy_hit', 'audio/sfx_enemy_hit.mp3');
  }

  create() {
    // Generate Particle Textures (Procedural)
    this.generateParticleTextures();

    this.scene.start('MainMenuScene');
  }

  private generateParticleTextures() {
    // 1. Flare (Soft circle)
    const flareGraphics = this.make.graphics({ x: 0, y: 0, add: false });
    flareGraphics.fillStyle(0xffffff, 1);
    flareGraphics.fillCircle(16, 16, 16);
    flareGraphics.generateTexture('particle_flare', 32, 32);

    // 2. Smoke (Solid circle)
    const smokeGraphics = this.make.graphics({ x: 0, y: 0, add: false });
    smokeGraphics.fillStyle(0xffffff, 1);
    smokeGraphics.fillCircle(16, 16, 16);
    smokeGraphics.generateTexture('particle_smoke', 32, 32);

    // 3. Spark (Small Rectangle/Line)
    const sparkGraphics = this.make.graphics({ x: 0, y: 0, add: false });
    sparkGraphics.fillStyle(0xffffff, 1);
    sparkGraphics.fillRect(0, 0, 8, 4); // Horizontal dash
    sparkGraphics.generateTexture('particle_spark', 8, 4);
  }

  private createLoadingBar() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    
    const progressBar = this.add.graphics();
    const progressBox = this.add.graphics();
    
    progressBox.fillStyle(0x222222, 0.8);
    progressBox.fillRect(width / 2 - 160, height / 2 - 25, 320, 50);
    
    const loadingText = this.add.text(width / 2, height / 2 - 50, 'Loading Assets...', {
      font: '20px monospace',
      color: '#ffffff'
    }).setOrigin(0.5);

    this.load.on('progress', (value: number) => {
      progressBar.clear();
      progressBar.fillStyle(0x3b82f6, 1);
      progressBar.fillRect(width / 2 - 150, height / 2 - 15, 300 * value, 30);
    });

    this.load.on('complete', () => {
      progressBar.destroy();
      progressBox.destroy();
      loadingText.destroy();
    });
  }
}
