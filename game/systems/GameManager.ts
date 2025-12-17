
import Phaser from 'phaser';
import { BuildingManager } from './BuildingManager';
import { Tower } from '../objects/Tower';

export class GameManager extends Phaser.Events.EventEmitter {
  public gold: number = 500;
  public mana: number = 0;
  public lives: number = 20;
  
  private scene: Phaser.Scene | null = null;
  private buildingManager: BuildingManager | null = null;
  private incomeTimer: Phaser.Time.TimerEvent | null = null;

  declare emit: (event: string | symbol, ...args: any[]) => boolean;
  declare on: (event: string | symbol, fn: Function, context?: any) => this;
  declare off: (event: string | symbol, fn?: Function, context?: any, once?: boolean) => this;

  constructor() {
    super();
  }

  /**
   * Called by BuildingManager to wire up the loop, avoiding MainScene modifications.
   */
  public init(scene: Phaser.Scene, buildingManager: BuildingManager) {
    this.scene = scene;
    this.buildingManager = buildingManager;
    
    // Passive Income Loop (1s Tick)
    this.incomeTimer = this.scene.time.addEvent({
        delay: 1000,
        callback: this.passiveIncomeLoop,
        callbackScope: this,
        loop: true
    });
  }

  private passiveIncomeLoop() {
    if (!this.buildingManager) return;

    const buildings = this.buildingManager.getAllBuildings();
    let goldGain = 0;
    let manaGain = 0;

    for (const b of buildings) {
        if (b instanceof Tower) {
            if (b.towerKey === 'GOLD_MINE') goldGain += 5;
            if (b.towerKey === 'MANA_CRYSTAL') manaGain += 2;
        }
    }

    if (goldGain > 0) this.earnGold(goldGain);
    if (manaGain > 0) this.earnMana(manaGain);
  }

  public canAfford(cost: number): boolean {
    return this.gold >= cost;
  }

  public spendGold(amount: number) {
    if (this.gold >= amount) {
      this.gold -= amount;
      this.emitStats();
    }
  }

  public earnGold(amount: number) {
    this.gold += amount;
    this.emitStats();
  }

  public earnMana(amount: number) {
      this.mana += amount;
      this.emitStats();
  }

  public spendMana(amount: number) {
      if (this.mana >= amount) {
          this.mana -= amount;
          this.emitStats();
      }
  }

  public loseLife() {
    this.lives = Math.max(0, this.lives - 1);
    this.emitStats();
    
    if (this.lives <= 0) {
      this.emit('game-over');
    }
  }

  private emitStats() {
    this.emit('stats-changed', { gold: this.gold, mana: this.mana, lives: this.lives });
  }

  public getStats() {
    return { gold: this.gold, mana: this.mana, lives: this.lives };
  }
}
