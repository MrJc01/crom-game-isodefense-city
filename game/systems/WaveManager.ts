
import Phaser from 'phaser';
import { MainScene } from '../scenes/MainScene';
import { LEVEL_1_WAVES, WaveConfig } from '../data/LevelData';
import { MAP_SIZE } from '../../constants';
import { Enemy } from '../objects/Enemy';

export type GamePhase = 'BUILDING' | 'COMBAT';

export class WaveManager extends Phaser.Events.EventEmitter {
  private scene: MainScene;
  
  declare emit: (event: string | symbol, ...args: any[]) => boolean;
  declare on: (event: string | symbol, fn: Function, context?: any) => this;
  declare off: (event: string | symbol, fn?: Function, context?: any, once?: boolean) => this;

  // State
  public currentPhase: GamePhase = 'BUILDING';
  private currentWaveIndex: number = -1;
  private enemiesLeftToSpawn: number = 0;
  private activeEnemyCount: number = 0;
  private currentBuildDuration: number = 0;

  // Timers
  private buildTimerEvent?: Phaser.Time.TimerEvent;
  private spawnTimerEvent?: Phaser.Time.TimerEvent;

  constructor(scene: MainScene) {
    super();
    this.scene = scene;
  }

  public startLevel() {
    this.startBuildPhase(10);
  }

  public get currentWaveNumber(): number {
    return this.currentWaveIndex + 1;
  }

  private startBuildPhase(durationSeconds: number) {
    this.currentPhase = 'BUILDING';
    this.currentBuildDuration = durationSeconds;
    this.emit('phase-change', 'BUILDING');
    
    let timeLeft = durationSeconds;
    this.emit('wave-timer', timeLeft, this.currentBuildDuration);

    this.buildTimerEvent = this.scene.time.addEvent({
      delay: 1000,
      callback: () => {
        timeLeft--;
        this.emit('wave-timer', timeLeft, this.currentBuildDuration);
        if (timeLeft <= 0) {
          this.startNextWave();
        }
      },
      repeat: durationSeconds - 1
    });
  }

  public startNextWave() {
    if (this.buildTimerEvent) this.buildTimerEvent.remove();

    this.currentWaveIndex++;
    
    if (this.currentWaveIndex >= LEVEL_1_WAVES.length) {
      this.emit('game-victory', { wave: this.currentWaveNumber });
      return;
    }

    const waveConfig = LEVEL_1_WAVES[this.currentWaveIndex];
    this.setupWave(waveConfig);
  }

  private setupWave(config: WaveConfig) {
    this.currentPhase = 'COMBAT';
    this.enemiesLeftToSpawn = config.enemyCount;
    this.activeEnemyCount = 0; 
    
    this.emit('phase-change', 'COMBAT');
    this.emit('wave-started', config.waveNumber);

    this.spawnTimerEvent = this.scene.time.addEvent({
      delay: config.spawnInterval,
      callback: () => {
        this.spawnEnemy(config.enemyType);
      },
      repeat: config.enemyCount - 1
    });
  }

  private spawnEnemy(type: string) {
    // 360 Degree Spawning: Pick a random edge tile
    let col = 0;
    let row = 0;
    const edge = Phaser.Math.Between(0, 3); // 0: Top, 1: Right, 2: Bottom, 3: Left

    switch (edge) {
        case 0: // Top Edge (row = 0)
            row = 0;
            col = Phaser.Math.Between(0, MAP_SIZE - 1);
            break;
        case 1: // Right Edge (col = MAX)
            col = MAP_SIZE - 1;
            row = Phaser.Math.Between(0, MAP_SIZE - 1);
            break;
        case 2: // Bottom Edge (row = MAX)
            row = MAP_SIZE - 1;
            col = Phaser.Math.Between(0, MAP_SIZE - 1);
            break;
        case 3: // Left Edge (col = 0)
            col = 0;
            row = Phaser.Math.Between(0, MAP_SIZE - 1);
            break;
    }

    // Call MainScene's spawn method which instantiates the Enemy object
    // Note: We hijack the logic slightly by assuming MainScene.spawnEnemy accepts coords, 
    // BUT MainScene.spawnEnemy is hardcoded to 0,0 in the provided file.
    // Since I cannot change MainScene.ts per "Output" instructions, I must rely on MainScene being updated or 
    // I must spawn it here? 
    // The prompt only lists 6 files. If I don't update MainScene, the enemy will always spawn at 0,0.
    // However, the `Enemy` class I updated *does* take col/row in constructor.
    // Wait, MainScene.spawnEnemy calls `new Enemy(this, 0, 0, ...)`. 
    // If I can't change MainScene, I can't implement 360 spawning correctly.
    // I will assume I CANNOT change MainScene.spawnEnemy.
    // WORKAROUND: Spawn the enemy here directly, bypassing MainScene.spawnEnemy, OR modify the enemy instance after spawn.
    
    // Attempting modification after spawn:
    // MainScene.spawnEnemy adds to `this.enemies`.
    // I can't easily access the last added enemy.
    
    // I will replicate MainScene.spawnEnemy logic here locally to gain control over coordinates.
    // This is safer than modifying MainScene if I am restricted.
    
    const enemy = new Enemy(this.scene, col, row, null); 
    
    // Configure Enemy Stats
    switch (type) {
        case 'fast': enemy.setStats(60, 150); break;
        case 'tank': enemy.setStats(300, 500); enemy.setScale(1.3); break;
        case 'boss': enemy.setStats(1000, 600); enemy.setScale(1.5); break;
        default: enemy.setStats(100, 300); break;
    }

    this.scene.add.existing(enemy);
    // Access private enemies list via public getter? No setter.
    // MainScene has `private enemies: Enemy[]`.
    // I have to cast to any to push to the array.
    (this.scene as any).enemies.push(enemy);
    
    // Start Logic (Enemy now handles its own movement logic on creation)
    
    this.activeEnemyCount++;
    this.enemiesLeftToSpawn--;
  }

  public onEnemyRemoved() {
    if (this.currentPhase !== 'COMBAT') return;

    this.activeEnemyCount--;
    
    if (this.enemiesLeftToSpawn <= 0 && this.activeEnemyCount <= 0) {
      this.completeWave();
    }
  }

  private completeWave() {
    if (this.spawnTimerEvent) this.spawnTimerEvent.remove();
    this.scene.gameManager.earnGold(100 + (this.currentWaveIndex * 50));
    this.startBuildPhase(15); 
  }
}