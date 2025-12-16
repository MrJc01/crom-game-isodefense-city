import Phaser from 'phaser';

export class CameraManager {
  private scene: Phaser.Scene;
  private camera: Phaser.Cameras.Scene2D.Camera;
  
  // State
  private _isPanning: boolean = false;
  private startPoint: Phaser.Math.Vector2;

  // Config
  private readonly MIN_ZOOM = 0.5;
  private readonly MAX_ZOOM = 2.0;
  private readonly ZOOM_FACTOR = 0.1;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.camera = scene.cameras.main;
    this.startPoint = new Phaser.Math.Vector2();

    // Disable Context Menu to allow Right-Click Panning
    this.scene.input.mouse?.disableContextMenu();

    // Event Listeners
    this.scene.input.on('pointerdown', this.onPointerDown, this);
    this.scene.input.on('pointermove', this.onPointerMove, this);
    this.scene.input.on('pointerup', this.onPointerUp, this);
    this.scene.input.on('wheel', this.onWheel, this);
  }

  /**
   * Public accessor to check if the camera is currently being manipulated.
   */
  public get isPanning(): boolean {
    return this._isPanning;
  }

  /**
   * Helper to determine if a specific pointer interaction was a drag operation 
   * rather than a click (moved more than 5px).
   */
  public isDragging(pointer: Phaser.Input.Pointer): boolean {
    return pointer.getDistance() > 5;
  }

  private onPointerDown(pointer: Phaser.Input.Pointer) {
    // Start Panning on Middle Click or Right Click
    if (pointer.middleButtonDown() || pointer.rightButtonDown()) {
      this._isPanning = true;
      this.startPoint.set(pointer.x, pointer.y);
      this.scene.input.setDefaultCursor('grabbing');
    }
  }

  private onPointerMove(pointer: Phaser.Input.Pointer) {
    if (this._isPanning) {
      // Calculate delta. 
      // We divide by zoom to ensure 1:1 movement regardless of zoom level.
      const dx = (pointer.x - this.startPoint.x) / this.camera.zoom;
      const dy = (pointer.y - this.startPoint.y) / this.camera.zoom;

      this.camera.scrollX -= dx;
      this.camera.scrollY -= dy;

      // Update start point for the next frame
      this.startPoint.set(pointer.x, pointer.y);
    }
  }

  private onPointerUp(pointer: Phaser.Input.Pointer) {
    // Stop Panning if the panning button was released
    // Note: checks if NO panning buttons are down anymore
    if (!pointer.middleButtonDown() && !pointer.rightButtonDown()) {
      if (this._isPanning) {
        this._isPanning = false;
        this.scene.input.setDefaultCursor('default');
      }
    }
  }

  private onWheel(
    pointer: Phaser.Input.Pointer,
    gameObjects: any[],
    deltaX: number,
    deltaY: number,
    deltaZ: number
  ) {
    // Zoom Logic
    const oldZoom = this.camera.zoom;
    
    // Determine direction
    const zoomDirection = deltaY > 0 ? -1 : 1; 
    const newZoom = Phaser.Math.Clamp(
      oldZoom + zoomDirection * this.ZOOM_FACTOR, 
      this.MIN_ZOOM, 
      this.MAX_ZOOM
    );

    // Zoom Towards Pointer Logic
    // 1. Get world position under mouse BEFORE zoom
    const worldPoint = this.camera.getWorldPoint(pointer.x, pointer.y);
    
    // 2. Apply Zoom
    this.camera.setZoom(newZoom);

    // 3. Get world position under mouse AFTER zoom
    const newWorldPoint = this.camera.getWorldPoint(pointer.x, pointer.y);

    // 4. Pan camera to align the points (keep mouse over same world spot)
    this.camera.scrollX += (worldPoint.x - newWorldPoint.x);
    this.camera.scrollY += (worldPoint.y - newWorldPoint.y);
  }

  public update(delta: number) {
    // Logic if we wanted momentum or keyboard scrolling could go here
  }
  
  public destroy() {
     this.scene.input.off('pointerdown', this.onPointerDown, this);
     this.scene.input.off('pointermove', this.onPointerMove, this);
     this.scene.input.off('pointerup', this.onPointerUp, this);
     this.scene.input.off('wheel', this.onWheel, this);
  }
}