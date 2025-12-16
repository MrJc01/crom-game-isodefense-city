
import Phaser from 'phaser';
import { MainScene } from '../scenes/MainScene';
import { LEVEL_1_WAVES, WaveConfig } from '../data/LevelData';

export type GamePhase = 'BUILDING' | 'COMBAT';

export class WaveManager extends Phaser.Events.EventEmitter {
  private scene: MainScene;
  
  // Explicitly declare EventEmitter methods for TS
  declare emit: (event: string | symbol, ...args: any[]) => boolean;
  declare on: (event: string | symbol, fn: Function, context?: any) => this;
  declare off: (event: string | symbol, fn?: Function, context?: any, once?: boolean) => this;

  // State
  private currentPhase: GamePhase = 'BUILDING';
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
    // Start with a build phase of 10 seconds
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
    // Emit initial time state (full bar)
    this.emit('wave-timer', timeLeft, this.currentBuildDuration);

    // Countdown Timer
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
    
    // Check for Level Complete
    if (this.currentWaveIndex >= LEVEL_1_WAVES.length) {
      console.log("Level Complete!");
      this.emit('level-complete');
      // Emit victory event for UI to handle
      this.emit('game-victory', { wave: this.currentWaveNumber });
      return;
    }

    const waveConfig = LEVEL_1_WAVES[this.currentWaveIndex];
    this.setupWave(waveConfig);
  }

  private setupWave(config: WaveConfig) {
    this.currentPhase = 'COMBAT';
    this.enemiesLeftToSpawn = config.enemyCount;
    this.activeEnemyCount = 0; // Increments as they spawn
    
    this.emit('phase-change', 'COMBAT');
    this.emit('wave-started', config.waveNumber);

    // Start Spawning Loop
    this.spawnTimerEvent = this.scene.time.addEvent({
      delay: config.spawnInterval,
      callback: () => {
        this.spawnEnemy(config.enemyType);
      },
      repeat: config.enemyCount - 1
    });
  }

  private spawnEnemy(type: string) {
    const success = this.scene.spawnEnemy(type);
    if (success) {
      this.activeEnemyCount++;
    }
    this.enemiesLeftToSpawn--;
  }

  /**
   * Called by MainScene when an enemy is destroyed or killed
   */
  public onEnemyRemoved() {
    if (this.currentPhase !== 'COMBAT') return;

    this.activeEnemyCount--;
    
    // Check for Wave Completion
    // We wait until spawns are finished AND all enemies are dead
    if (this.enemiesLeftToSpawn <= 0 && this.activeEnemyCount <= 0) {
      this.completeWave();
    }
  }

  private completeWave() {
    console.log(`Wave ${this.currentWaveIndex + 1} Complete`);
    if (this.spawnTimerEvent) this.spawnTimerEvent.remove();
    
    // Reward player?
    this.scene.gameManager.earnGold(100 + (this.currentWaveIndex * 50));

    // Start next build phase
    this.startBuildPhase(15); 
  }
}
