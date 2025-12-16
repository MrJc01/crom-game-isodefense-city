
import Phaser from 'phaser';
import { GridManager } from '../systems/GridManager';
import { BuildingManager } from '../systems/BuildingManager';
import { CameraManager } from '../systems/CameraManager';
import { PathfindingManager } from '../systems/PathfindingManager';
import { GameManager } from '../systems/GameManager';
import { WaveManager } from '../systems/WaveManager';
import { AudioManager } from '../systems/AudioManager';
import { Enemy } from '../objects/Enemy';
import { IsoUtils } from '../utils/IsoUtils';
import { MAP_SIZE, COLOR_BACKGROUND } from '../../constants';

export class MainScene extends Phaser.Scene {
  declare add: Phaser.GameObjects.GameObjectFactory;
  declare cameras: Phaser.Cameras.Scene2D.CameraManager;
  declare input: Phaser.Input.InputPlugin;
  declare tweens: Phaser.Tweens.TweenManager;
  declare time: Phaser.Time.Clock;
  declare scene: Phaser.Scenes.ScenePlugin;
  declare load: Phaser.Loader.LoaderPlugin;
  declare events: Phaser.Events.EventEmitter;
  declare sound: Phaser.Sound.BaseSoundManager; // Expose sound manager type
  declare cache: Phaser.Cache.CacheManager;

  private gridManager!: GridManager;
  private buildingManager!: BuildingManager;
  private cameraManager!: CameraManager;
  private pathfindingManager!: PathfindingManager;
  public gameManager!: GameManager;
  public waveManager!: WaveManager;
  public audioManager!: AudioManager;

  // Track enemies
  private enemies: Enemy[] = [];

  constructor() {
    super('MainScene');
  }

  create() {
    this.cameras.main.setBackgroundColor(COLOR_BACKGROUND);

    // 1. Initialize Systems
    this.gameManager = new GameManager(); // Economy Logic
    this.audioManager = new AudioManager(this);
    this.gridManager = new GridManager(this);
    this.buildingManager = new BuildingManager(this, this.gridManager);
    this.cameraManager = new CameraManager(this);
    this.pathfindingManager = new PathfindingManager(this, this.buildingManager);
    this.waveManager = new WaveManager(this);

    // Start Music
    this.audioManager.playMusic('bgm_game', 0.4);

    // 2. Launch UI
    this.scene.launch('UIScene');

    // Center Camera
    const centerPoint = IsoUtils.gridToScreen(MAP_SIZE / 2, MAP_SIZE / 2);
    this.cameras.main.centerOn(centerPoint.x, centerPoint.y);

    // 3. Input Handling (Building Placement)
    this.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
        if (pointer.leftButtonReleased()) {
            const wasDragging = this.cameraManager.isDragging(pointer);
            if (!this.cameraManager.isPanning && !wasDragging) {
                this.handleInput(pointer);
            }
        }
    });

    // 4. Start the Level
    this.waveManager.startLevel();
  }

  update(time: number, delta: number) {
    this.cameraManager.update(delta);
    
    // GridManager returns the current hovered grid position
    const cursorGridPos = this.gridManager.update();
    
    // Pass this to BuildingManager for ghost preview logic
    this.buildingManager.update(cursorGridPos);
  }

  /**
   * Called by UIScene to change selected building. 
   * Accepts "ARCHER", "CANNON", "SNIPER", "WALL", etc.
   */
  public setBuildMode(typeKey: string) {
    this.buildingManager.setBuildingType(typeKey);
  }

  public getEnemies(): Enemy[] {
    return this.enemies;
  }

  /**
   * Removes enemy from registry and notifies WaveManager
   */
  public removeEnemy(enemy: Enemy) {
    const initialLength = this.enemies.length;
    this.enemies = this.enemies.filter(e => e !== enemy);
    
    // If enemy was actually in the list, notify manager
    if (this.enemies.length < initialLength) {
        this.waveManager.onEnemyRemoved();
    }
  }

  private handleInput(pointer: Phaser.Input.Pointer) {
    const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
    const gridPos = this.gridManager.isoToCartesian(worldPoint.x, worldPoint.y);
    this.buildingManager.placeBuilding(gridPos.x, gridPos.y);
  }

  /**
   * Spawns an enemy at the starting position (0,0)
   */
  public spawnEnemy(type: string): boolean {
    const startCol = 0;
    const startRow = 0;

    const enemy = new Enemy(this, startCol, startRow, this.pathfindingManager);
    
    // Configure Enemy Stats based on Type
    switch (type) {
        case 'fast':
            enemy.setStats(60, 150); // HP: 60, Speed: 150ms/tile
            break;
        case 'tank':
            enemy.setStats(300, 500); // HP: 300, Speed: 500ms/tile
            enemy.setScale(1.3);
            break;
        case 'boss':
            enemy.setStats(1000, 600);
            enemy.setScale(1.5);
            break;
        default: // 'basic'
            enemy.setStats(100, 300); // HP: 100, Speed: 300ms/tile
            break;
    }

    this.add.existing(enemy);
    this.enemies.push(enemy);

    // Target the center/core (10, 10 is approx center of 20x20)
    enemy.goTo(10, 10);
    
    return true;
  }
}
