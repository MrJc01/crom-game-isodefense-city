
import Phaser from 'phaser';

export class BuildButton extends Phaser.GameObjects.Container {
  // TypeScript declarations for inherited methods/properties
  declare add: (child: Phaser.GameObjects.GameObject | Phaser.GameObjects.GameObject[]) => this;
  declare setSize: (width: number, height: number) => this;
  declare setInteractive: (hitArea?: any, callback?: Phaser.Types.Input.HitAreaCallback, dropZone?: boolean) => this;
  declare on: (event: string | symbol, fn: Function, context?: any) => this;
  declare setScale: (x: number, y?: number) => this;
  declare alpha: number;

  private bgGraphics: Phaser.GameObjects.Graphics;
  private icon: Phaser.GameObjects.Sprite;
  private nameText: Phaser.GameObjects.Text;
  private costText: Phaser.GameObjects.Text;
  
  private w: number = 120;
  private h: number = 90;
  private isSelected: boolean = false;
  
  public key: string;
  public cost: number;

  constructor(
    scene: Phaser.Scene, 
    x: number, 
    y: number, 
    key: string, 
    name: string, 
    cost: number, 
    tint: number,
    texture: string
  ) {
    super(scene, x, y);
    this.key = key;
    this.cost = cost;

    // Background
    this.bgGraphics = scene.add.graphics();
    this.add(this.bgGraphics);
    
    // Icon
    this.icon = scene.add.sprite(0, -15, texture);
    this.icon.setTint(tint);
    this.icon.setScale(0.8);
    // Ensure icon fits within bounds if sprite is large
    if (this.icon.height > 64) {
        this.icon.setDisplaySize(48, 48); // proportional scale roughly
    }
    this.add(this.icon);
    
    // Name
    this.nameText = scene.add.text(0, 15, name, { 
        font: 'bold 14px monospace', color: '#ffffff' 
    }).setOrigin(0.5);
    this.add(this.nameText);

    // Cost
    this.costText = scene.add.text(0, 32, `${cost}g`, { 
        font: '12px monospace', color: '#fbbf24' 
    }).setOrigin(0.5);
    this.add(this.costText);
    
    // Interaction
    this.setSize(this.w, this.h);
    this.setInteractive(new Phaser.Geom.Rectangle(-this.w/2, -this.h/2, this.w, this.h), Phaser.Geom.Rectangle.Contains);
    
    this.on('pointerover', this.onHover, this);
    this.on('pointerout', this.onOut, this);

    this.draw();
  }

  public setActive(isActive: boolean) {
    this.isSelected = isActive;
    this.draw();
  }

  public setAffordable(canAfford: boolean) {
    this.alpha = canAfford ? 1 : 0.5;
  }

  public onClick(callback: () => void) {
      this.on('pointerdown', callback);
  }

  private onHover() {
      if (!this.isSelected) {
          this.setScale(1.05);
      }
  }

  private onOut() {
      this.setScale(1.0);
  }

  private draw() {
    this.bgGraphics.clear();
    
    // Background Fill
    const fillColor = 0x1e293b; // Slate 800
    this.bgGraphics.fillStyle(fillColor, 0.95);
    this.bgGraphics.fillRoundedRect(-this.w/2, -this.h/2, this.w, this.h, 12);
    
    // Border Stroke
    if (this.isSelected) {
        this.bgGraphics.lineStyle(3, 0x10b981, 1); // Emerald 500 (Active)
        this.bgGraphics.strokeRoundedRect(-this.w/2, -this.h/2, this.w, this.h, 12);
    } else {
        this.bgGraphics.lineStyle(2, 0x475569, 1); // Slate 600 (Idle)
        this.bgGraphics.strokeRoundedRect(-this.w/2, -this.h/2, this.w, this.h, 12);
    }
  }
}
