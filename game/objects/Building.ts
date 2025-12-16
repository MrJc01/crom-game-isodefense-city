
import Phaser from 'phaser';

export class Building extends Phaser.GameObjects.Container {
  declare x: number;
  declare y: number;
  declare scene: Phaser.Scene;
  declare add: (child: Phaser.GameObjects.GameObject | Phaser.GameObjects.GameObject[]) => this;
  declare setDepth: (value: number) => this;
  declare removeAll: (destroyChildren?: boolean) => this;

  protected sprite: Phaser.GameObjects.Sprite;

  constructor(scene: Phaser.Scene, x: number, y: number, textureKey: string = 'base_tile') {
    super(scene, x, y);
    
    // Create the sprite
    this.sprite = scene.add.sprite(0, 0, textureKey);
    
    // CRITICAL: Set origin to Bottom-Center (0.5, 1)
    // This ensures the "feet" of the building align with the center of the isometric tile.
    this.sprite.setOrigin(0.5, 1);

    // Initial placeholder tint if texture is missing (fallback)
    if (this.sprite.width === 0) {
        // If asset failed to load, draw a fallback rectangle via texture generation or just leave it
        // For this blueprint, we assume assets load or placeholders exist.
    }

    this.add(this.sprite);
  }

  public setVisuals(textureKey: string) {
    this.sprite.setTexture(textureKey);
    // Reset origin just in case texture swap affects it (Phaser usually persists it, but good practice)
    this.sprite.setOrigin(0.5, 1);
  }

  /**
   * Applies a tint to the sprite (useful for damage feedback or selection)
   */
  public setTint(color: number) {
    this.sprite.setTint(color);
  }

  public clearTint() {
    this.sprite.clearTint();
  }

  public destroy(fromScene?: boolean) {
    super.destroy(fromScene);
  }
}
