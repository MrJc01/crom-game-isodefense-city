import Phaser from 'phaser';

export class GameManager extends Phaser.Events.EventEmitter {
  public gold: number = 500;
  public lives: number = 20;

  declare emit: (event: string | symbol, ...args: any[]) => boolean;
  declare on: (event: string | symbol, fn: Function, context?: any) => this;
  declare off: (event: string | symbol, fn?: Function, context?: any, once?: boolean) => this;

  constructor() {
    super();
  }

  public canAfford(cost: number): boolean {
    return this.gold >= cost;
  }

  public spendGold(amount: number) {
    if (this.gold >= amount) {
      this.gold -= amount;
      this.emit('stats-changed', { gold: this.gold, lives: this.lives });
    }
  }

  public earnGold(amount: number) {
    this.gold += amount;
    this.emit('stats-changed', { gold: this.gold, lives: this.lives });
  }

  public loseLife() {
    this.lives = Math.max(0, this.lives - 1);
    this.emit('stats-changed', { gold: this.gold, lives: this.lives });
    
    if (this.lives <= 0) {
      this.emit('game-over');
    }
  }

  public getStats() {
    return { gold: this.gold, lives: this.lives };
  }
}