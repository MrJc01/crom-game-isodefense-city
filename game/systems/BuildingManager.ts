
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
  private selectedTower: Tower | null = null;
  
  // Visuals
  private ghost: Phaser.GameObjects.Sprite;
  private rangeGraphics: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene, gridManager: GridManager) {
    this.scene = scene as MainScene;
    this.gridManager = gridManager;
    this.gridState = Array(MAP_SIZE).fill(null).map(() => Array(MAP_SIZE).fill(null));

    // Ghost Building Preview
    this.ghost = this.scene.add.sprite(0, 0, 'tower_lvl1');
    this.ghost.setOrigin(0.5, 1);
    this.ghost.setAlpha(0.6);
    this.ghost.setDepth(999999);
    this.ghost.setVisible(false);

    // Range Indicator (Selection)
    this.rangeGraphics = this.scene.add.graphics();
    this.rangeGraphics.setDepth(999998); // Just below ghost
  }

  public setBuildingType(key: string) {
    this.deselectTower(); // Clear selection when switching build modes
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
    // If we have a selected tower, draw its range and HIDE the ghost
    if (this.selectedTower) {
        this.ghost.setVisible(false);
        this.drawRangeCircle();
        return;
    }

    // Otherwise, Build Mode Logic
    this.rangeGraphics.clear();

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

    // Validate Placement
    const isOccupied = this.isCellOccupied(gridPos.x, gridPos.y);
    const cost = this.getCost(this.selectedKey);
    const canAfford = this.scene.gameManager.canAfford(cost);

    if (isOccupied || !canAfford) {
        this.ghost.setTint(0xff0000); 
    } else {
        if (!this.isWallMode && TOWER_TYPES[this.selectedKey]) {
            this.ghost.setTint(TOWER_TYPES[this.selectedKey].tint);
        } else {
            this.ghost.clearTint();
            this.ghost.setTint(0x4ade80); // Greenish for walls
        }
    }
  }

  private drawRangeCircle() {
      if (!this.selectedTower) return;
      
      this.rangeGraphics.clear();
      this.rangeGraphics.lineStyle(2, 0xffffff, 0.5);
      this.rangeGraphics.fillStyle(0xffffff, 0.1);
      
      // Draw perfect circle for range (since game logic uses 2D distance)
      this.rangeGraphics.fillCircle(this.selectedTower.x, this.selectedTower.y, this.selectedTower.currentRange);
      this.rangeGraphics.strokeCircle(this.selectedTower.x, this.selectedTower.y, this.selectedTower.currentRange);
  }

  // --- SELECTION LOGIC ---

  public handleInteractAt(col: number, row: number) {
      // FIX: Strictly check bounds before accessing gridState to prevent undefined errors
      if (col < 0 || col >= MAP_SIZE || row < 0 || row >= MAP_SIZE) {
          this.deselectTower();
          return;
      }

      if (this.isCellOccupied(col, row)) {
          const building = this.gridState[col][row];
          if (building instanceof Tower) {
              this.selectTower(building);
          } else {
              // Clicked a wall or other building
              this.deselectTower();
          }
      } else {
          // Empty tile: Check if we have a selection to deselect, OR place building
          if (this.selectedTower) {
              this.deselectTower();
          } else {
              this.placeBuilding(col, row);
          }
      }
  }

  public selectTower(tower: Tower) {
      this.selectedTower = tower;
      this.scene.events.emit('tower-selected', tower);
  }

  public deselectTower() {
      if (this.selectedTower) {
          this.selectedTower = null;
          this.rangeGraphics.clear();
          this.scene.events.emit('tower-deselected');
      }
  }

  public sellSelectedTower() {
      if (!this.selectedTower) return;

      const refund = this.selectedTower.getSellValue();
      // Reverse lookup for now since we didn't store grid coords on the object (Optimization TODO)
      const gridPos = this.findBuildingGridPos(this.selectedTower);

      if (gridPos) {
          this.gridState[gridPos.x][gridPos.y] = null;
      }

      this.scene.gameManager.earnGold(refund);
      this.scene.particleManager.playEffect('BUILD', this.selectedTower.x, this.selectedTower.y); // Poof
      this.selectedTower.destroy();
      this.deselectTower();
  }

  private findBuildingGridPos(building: Building): {x: number, y: number} | null {
      for(let x=0; x<MAP_SIZE; x++) {
          for(let y=0; y<MAP_SIZE; y++) {
              if (this.gridState[x][y] === building) return {x, y};
          }
      }
      return null;
  }

  // --- BUILDING LOGIC ---

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
      building = new Tower(this.scene, pos.x, pos.y, this.selectedKey);
    }
    
    this.scene.add.existing(building);
    (building as any).setDepth(pos.y);

    this.gridState[col][row] = building;
    this.scene.gameManager.spendGold(cost);
    
    this.scene.audioManager.playSFX('sfx_build_place', { volume: 0.8 });
    
    if (this.scene.particleManager) {
        this.scene.particleManager.playEffect('BUILD', pos.x, pos.y);
    }
    
    return true;
  }
}
