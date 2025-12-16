
import Phaser from 'phaser';
import { Building } from '../objects/Building';
import { Tower } from '../objects/Tower';
import { Wall } from '../objects/Wall';
import { GridManager } from './GridManager';
import { MainScene } from '../scenes/MainScene';
import { MAP_SIZE } from '../../constants';
import { IsoUtils } from '../utils/IsoUtils';
import { TOWER_TYPES } from '../data/TowerTypes';

export class BuildingManager {
  private scene: MainScene;
  private gridManager: GridManager;
  private gridState: (Building | null)[][];

  // State
  private selectedKey: string = 'ARCHER'; // Default
  private isWallMode: boolean = false;
  
  // Ghost Preview
  private ghost: Phaser.GameObjects.Sprite;

  constructor(scene: Phaser.Scene, gridManager: GridManager) {
    this.scene = scene as MainScene;
    this.gridManager = gridManager;
    this.gridState = Array(MAP_SIZE).fill(null).map(() => Array(MAP_SIZE).fill(null));

    this.ghost = this.scene.add.sprite(0, 0, 'tower_lvl1');
    this.ghost.setOrigin(0.5, 1);
    this.ghost.setAlpha(0.6);
    this.ghost.setDepth(999999);
    this.ghost.setVisible(false);
  }

  public setBuildingType(key: string) {
    this.selectedKey = key;
    this.isWallMode = (key === 'WALL');
    
    const texture = this.isWallMode ? 'wall_stone' : 'tower_lvl1';
    this.ghost.setTexture(texture);
    this.ghost.setOrigin(0.5, 1);

    // Apply tint to ghost to match tower type
    if (!this.isWallMode && TOWER_TYPES[key]) {
        this.ghost.setTint(TOWER_TYPES[key].tint);
    } else {
        this.ghost.clearTint();
    }
  }

  public update(gridPos: Phaser.Math.Vector2) {
    const isValidBounds = 
        gridPos.x >= 0 && gridPos.x < MAP_SIZE && 
        gridPos.y >= 0 && gridPos.y < MAP_SIZE;

    if (!isValidBounds) {
        this.ghost.setVisible(false);
        return;
    }

    this.ghost.setVisible(true);

    // Move Ghost
    const screenPos = IsoUtils.gridToScreen(gridPos.x, gridPos.y);
    this.ghost.setPosition(screenPos.x, screenPos.y);
    this.ghost.setDepth(screenPos.y + 1); 

    // Validate
    const isOccupied = this.isCellOccupied(gridPos.x, gridPos.y);
    const cost = this.getCost(this.selectedKey);
    const canAfford = this.scene.gameManager.canAfford(cost);

    if (isOccupied || !canAfford) {
        // Override tint for error, but we need to remember the original tint
        // Ideally we use a separate "Error" graphic, but here we just red-out.
        this.ghost.setTint(0xff0000); 
    } else {
        // Restore Tint
        if (!this.isWallMode && TOWER_TYPES[this.selectedKey]) {
            this.ghost.setTint(TOWER_TYPES[this.selectedKey].tint);
        } else {
            this.ghost.clearTint();
            this.ghost.setTint(0x4ade80); // Greenish for walls
        }
    }
  }

  private getCost(key: string): number {
    if (key === 'WALL') return 20;
    return TOWER_TYPES[key]?.cost || 100;
  }

  public isCellOccupied(col: number, row: number): boolean {
    if (col < 0 || col >= MAP_SIZE || row < 0 || row >= MAP_SIZE) {
      return true;
    }
    return this.gridState[col][row] !== null;
  }

  public placeBuilding(col: number, row: number): boolean {
    if (this.isCellOccupied(col, row)) return false;

    const cost = this.getCost(this.selectedKey);
    if (!this.scene.gameManager.canAfford(cost)) return false;

    const pos = this.gridManager.cartesianToIso(col, row);

    let building: Building;
    if (this.isWallMode) {
      building = new Wall(this.scene, pos.x, pos.y);
    } else {
      // Pass the specific tower key (ARCHER, CANNON, etc)
      building = new Tower(this.scene, pos.x, pos.y, this.selectedKey);
    }
    
    this.scene.add.existing(building);
    (building as any).setDepth(pos.y);

    this.gridState[col][row] = building;
    this.scene.gameManager.spendGold(cost);
    
    // Play SFX
    this.scene.audioManager.playSFX('sfx_build_place', { volume: 0.8 });

    // VFX: Build Dust
    if (this.scene.particleManager) {
        this.scene.particleManager.playEffect('BUILD', pos.x, pos.y);
    }
    
    return true;
  }
}
