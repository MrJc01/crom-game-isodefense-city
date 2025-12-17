
import Phaser from 'phaser';

export class Building extends Phaser.GameObjects.Container {
  declare x: number;
  declare y: number;
  declare active: boolean; // Explicitly declare active property
  declare scene: Phaser.Scene;
  declare add: (child: Phaser.GameObjects.GameObject | Phaser.GameObjects.GameObject[]) => this;
  declare setDepth: (value: number) => this;
  declare removeAll: (destroyChildren?: boolean) => this;
  declare setScale: (x: number, y?: number) => this;

  protected sprite: Phaser.GameObjects.Sprite;
  
  // Grid Position
  public gridCol: number = 0;
  public gridRow: number = 0;

  // Stats
  public maxHealth: number = 100;
  public health: number = 100;
  public isDestructible: boolean = true;

  constructor(scene: Phaser.Scene, x: number, y: number, textureKey: string = 'base_tile') {
    super(scene, x, y);
    
    this.sprite = scene.add.sprite(0, 0, textureKey);
    this.sprite.setOrigin(0.5, 1);

    if (this.sprite.width === 0) {
        // Fallback handled by subclass or ignored
    }

    this.add(this.sprite);
  }

  public setGridPos(col: number, row: number) {
      this.gridCol = col;
      this.gridRow = row;
  }

  public setVisuals(textureKey: string) {
    this.sprite.setTexture(textureKey);
    this.sprite.setOrigin(0.5, 1);
  }

  public setTint(color: number) {
    this.sprite.setTint(color);
  }

  public clearTint() {
    this.sprite.clearTint();
  }

  public takeDamage(amount: number) {
      if (!this.isDestructible) return;

      this.health -= amount;
      
      // Damage Flash
      this.sprite.setTint(0xff0000);
      this.scene.time.delayedCall(100, () => {
          if (this.scene) this.sprite.clearTint();
      });

      if (this.health <= 0) {
          this.destroy();
      }
  }

  /**
   * Destroys the building and emits an event for the manager to clean up the grid.
   */
  public destroy(fromScene?: boolean) {
    // Notify manager before full destruction
    this.scene.events.emit('building-destroyed', this);
    super.destroy(fromScene);
  }
}