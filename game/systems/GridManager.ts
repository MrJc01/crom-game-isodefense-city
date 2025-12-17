
import Phaser from 'phaser';
import { MAP_SIZE, TILE_WIDTH, TILE_HEIGHT } from '../../constants';
import { IsoUtils } from '../utils/IsoUtils';

export class GridManager {
  private scene: Phaser.Scene;
  private gridGraphics: Phaser.GameObjects.Graphics;
  private cursorGraphics: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    
    // Layer for the static floor
    this.gridGraphics = this.scene.add.graphics();
    // Layer for the dynamic cursor
    this.cursorGraphics = this.scene.add.graphics();
    
    // CRITICAL: Ensure cursor is always rendered above buildings
    this.cursorGraphics.setDepth(99999);

    this.drawGrid();
  }

  /**
   * Converts Grid Coordinates (Col, Row) to Screen Coordinates (X, Y).
   * @param col Grid Column
   * @param row Grid Row
   */
  public cartesianToIso(col: number, row: number): Phaser.Math.Vector2 {
    const point = IsoUtils.gridToScreen(col, row);
    return new Phaser.Math.Vector2(point.x, point.y);
  }

  /**
   * Converts Screen Coordinates (X, Y) to Grid Coordinates (Col, Row).
   * @param x Screen X
   * @param y Screen Y
   */
  public isoToCartesian(x: number, y: number): Phaser.Math.Vector2 {
    const point = IsoUtils.screenToGrid(x, y);
    return new Phaser.Math.Vector2(point.col, point.row);
  }

  /**
   * Renders the static isometric floor grid with a tactical checkerboard style.
   */
  private drawGrid() {
    this.gridGraphics.clear();

    const colorDark = 0x0f172a; // Slate 900
    const colorLight = 0x1e293b; // Slate 800
    const borderColor = 0x334155; // Slate 700

    for (let col = 0; col < MAP_SIZE; col++) {
      for (let row = 0; row < MAP_SIZE; row++) {
        const p = this.cartesianToIso(col, row);
        
        // Checkerboard Logic
        const isEven = (col + row) % 2 === 0;
        const fillColor = isEven ? colorLight : colorDark;
        const alpha = isEven ? 0.8 : 0.6;

        // Draw Filled Tile
        this.gridGraphics.fillStyle(fillColor, alpha);
        this.drawIsoTile(this.gridGraphics, p.x, p.y, true);

        // Draw Subtle Border
        this.gridGraphics.lineStyle(1, borderColor, 0.2);
        this.drawIsoTile(this.gridGraphics, p.x, p.y, false);
      }
    }
  }

  /**
   * Helper to draw a single diamond shape at a given center point.
   */
  private drawIsoTile(graphics: Phaser.GameObjects.Graphics, x: number, y: number, fill: boolean) {
    const halfW = TILE_WIDTH / 2;
    const halfH = TILE_HEIGHT / 2;

    // Diamond path relative to center (x,y)
    graphics.beginPath();
    graphics.moveTo(x, y - halfH);      // Top
    graphics.lineTo(x + halfW, y);      // Right
    graphics.lineTo(x, y + halfH);      // Bottom
    graphics.lineTo(x - halfW, y);      // Left
    graphics.closePath();

    if (fill) graphics.fillPath();
    else graphics.strokePath();
  }

  /**
   * Update loop to handle cursor interaction.
   * Returns the current grid position under the mouse.
   */
  public update(): Phaser.Math.Vector2 {
    this.cursorGraphics.clear();
    
    const pointer = this.scene.input.activePointer;
    const worldPoint = this.scene.cameras.main.getWorldPoint(pointer.x, pointer.y);
    
    // Convert mouse world position to grid coordinates
    const gridPos = this.isoToCartesian(worldPoint.x, worldPoint.y);

    // Check if within map bounds
    if (
      gridPos.x >= 0 && 
      gridPos.x < MAP_SIZE && 
      gridPos.y >= 0 && 
      gridPos.y < MAP_SIZE
    ) {
      // Get the screen position for the snapped grid cell
      const snapPos = this.cartesianToIso(gridPos.x, gridPos.y);

      // Animation: Pulse Alpha
      const alpha = 0.3 + 0.2 * Math.sin(this.scene.time.now / 150);

      // Draw Holographic Cursor
      this.cursorGraphics.lineStyle(2, 0x38bdf8, 0.8); // Cyan-400 Outline
      this.cursorGraphics.fillStyle(0x38bdf8, alpha); // Cyan Fill
      
      this.drawIsoTile(this.cursorGraphics, snapPos.x, snapPos.y, true);
      this.drawIsoTile(this.cursorGraphics, snapPos.x, snapPos.y, false);
      
      // Draw "Reticle" Corners rising up
      const halfW = TILE_WIDTH / 2;
      const halfH = TILE_HEIGHT / 2;
      const rise = 15;

      this.cursorGraphics.lineStyle(1, 0x38bdf8, 0.5);
      this.cursorGraphics.beginPath();
      
      // Left corner vertical
      this.cursorGraphics.moveTo(snapPos.x - halfW, snapPos.y);
      this.cursorGraphics.lineTo(snapPos.x - halfW, snapPos.y - rise);
      
      // Right corner vertical
      this.cursorGraphics.moveTo(snapPos.x + halfW, snapPos.y);
      this.cursorGraphics.lineTo(snapPos.x + halfW, snapPos.y - rise);
      
      // Top corner vertical
      this.cursorGraphics.moveTo(snapPos.x, snapPos.y - halfH);
      this.cursorGraphics.lineTo(snapPos.x, snapPos.y - halfH - rise);
      
      this.cursorGraphics.strokePath();
    }
    
    return gridPos;
  }
}
