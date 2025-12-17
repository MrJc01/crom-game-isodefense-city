
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
  private buildings: Building[] = []; // List of all active buildings

  // State
  private selectedKey: string = 'ARCHER'; 
  private isWallMode: boolean = false;
  private selectedTower: Tower | null = null;
  
  // Visuals
  private ghost: Phaser.GameObjects.Sprite;
  private rangeGraphics: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene, gridManager: GridManager) {
    this.scene = scene as MainScene;
    this.gridManager = gridManager;
    this.gridState = Array(MAP_SIZE).fill(null).map(() => Array(MAP_SIZE).fill(null));

    // Initialize GameManager integration
    this.scene.gameManager.init(this.scene, this);

    // Ghost
    this.ghost = this.scene.add.sprite(0, 0, 'tower_lvl1');
    this.ghost.setOrigin(0.5, 1);
    this.ghost.setAlpha(0.6);
    this.ghost.setDepth(999999);
    this.ghost.setVisible(false);

    // Range
    this.rangeGraphics = this.scene.add.graphics();
    this.rangeGraphics.setDepth(999998);

    // Setup Event Listeners
    this.scene.events.on('building-destroyed', this.onBuildingDestroyed, this);

    // Spawn HQ
    this.initializeHQ();
  }

  private initializeHQ() {
      // Spawn HQ at Center (10, 10)
      const cx = 10;
      const cy = 10;
      
      // Force place even if "cost" check fails (it's free/initial)
      const pos = this.gridManager.cartesianToIso(cx, cy);
      const hq = new Tower(this.scene, pos.x, pos.y, 'HQ');
      
      this.scene.add.existing(hq);
      (hq as any).setDepth(pos.y);
      hq.setGridPos(cx, cy);

      this.gridState[cx][cy] = hq;
      this.buildings.push(hq);
  }

  public getBuildingAt(col: number, row: number): Building | null {
      if (col < 0 || col >= MAP_SIZE || row < 0 || row >= MAP_SIZE) return null;
      return this.gridState[col][row];
  }

  public getAllBuildings(): Building[] {
      return this.buildings;
  }

  public setBuildingType(key: string) {
    this.deselectTower();
    this.selectedKey = key;
    this.isWallMode = (key === 'WALL');
    
    const texture = this.isWallMode ? 'wall_stone' : 'tower_lvl1';
    this.ghost.setTexture(texture);
    this.ghost.setOrigin(0.5, 1);

    if (!this.isWallMode && TOWER_TYPES[key]) {
        this.ghost.setTint(TOWER_TYPES[key].tint);
    } else {
        this.ghost.clearTint();
    }
  }

  public update(gridPos: Phaser.Math.Vector2) {
    if (this.selectedTower) {
        this.ghost.setVisible(false);
        this.drawRangeCircle();
        return;
    }
    
    // Check Phase
    if (this.scene.waveManager.currentPhase === 'COMBAT') {
        this.ghost.setVisible(false);
        this.rangeGraphics.clear();
        return;
    }

    this.rangeGraphics.clear();
    const isValidBounds = gridPos.x >= 0 && gridPos.x < MAP_SIZE && gridPos.y >= 0 && gridPos.y < MAP_SIZE;

    if (!isValidBounds) {
        this.ghost.setVisible(false);
        return;
    }

    this.ghost.setVisible(true);
    const screenPos = IsoUtils.gridToScreen(gridPos.x, gridPos.y);
    this.ghost.setPosition(screenPos.x, screenPos.y);
    this.ghost.setDepth(screenPos.y + 1); 

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
            this.ghost.setTint(0x4ade80);
        }
    }
  }

  private drawRangeCircle() {
      if (!this.selectedTower) return;
      this.rangeGraphics.clear();
      this.rangeGraphics.lineStyle(2, 0xffffff, 0.5);
      this.rangeGraphics.fillStyle(0xffffff, 0.1);
      this.rangeGraphics.fillCircle(this.selectedTower.x, this.selectedTower.y, this.selectedTower.currentRange);
      this.rangeGraphics.strokeCircle(this.selectedTower.x, this.selectedTower.y, this.selectedTower.currentRange);
  }

  public handleInteractAt(col: number, row: number) {
      // Bounds check
      if (col < 0 || col >= MAP_SIZE || row < 0 || row >= MAP_SIZE) {
          this.deselectTower();
          return;
      }

      if (this.isCellOccupied(col, row)) {
          const building = this.gridState[col][row];
          if (building instanceof Tower) {
              this.selectTower(building);
          } else {
              this.deselectTower();
          }
      } else {
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
      const col = this.selectedTower.gridCol;
      const row = this.selectedTower.gridRow;

      this.gridState[col][row] = null;
      this.buildings = this.buildings.filter(b => b !== this.selectedTower);

      this.scene.gameManager.earnGold(refund);
      this.scene.particleManager.playEffect('BUILD', this.selectedTower.x, this.selectedTower.y);
      this.selectedTower.destroy();
      this.deselectTower();
  }

  private onBuildingDestroyed(building: Building) {
      const col = building.gridCol;
      const row = building.gridRow;
      
      if (this.gridState[col][row] === building) {
          this.gridState[col][row] = null;
      }
      this.buildings = this.buildings.filter(b => b !== building);
      
      // If it was selected, deselect
      if (this.selectedTower === building) {
          this.deselectTower();
      }
  }

  private getCost(key: string): number {
    if (key === 'WALL') return 20;
    return TOWER_TYPES[key]?.cost || 100;
  }

  public isCellOccupied(col: number, row: number): boolean {
    if (col < 0 || col >= MAP_SIZE || row < 0 || row >= MAP_SIZE) return true;
    return this.gridState[col][row] !== null;
  }

  public placeBuilding(col: number, row: number): boolean {
    if (this.scene.waveManager.currentPhase === 'COMBAT') return false;
    if (this.isCellOccupied(col, row)) return false;

    const cost = this.getCost(this.selectedKey);
    if (!this.scene.gameManager.canAfford(cost)) return false;

    const pos = this.gridManager.cartesianToIso(col, row);

    let building: Building;
    if (this.isWallMode) {
      building = new Wall(this.scene, pos.x, pos.y);
      // Walls need health config? Default is 100
      building.maxHealth = 500;
      building.health = 500;
    } else {
      building = new Tower(this.scene, pos.x, pos.y, this.selectedKey);
    }
    
    building.setGridPos(col, row);
    this.scene.add.existing(building);
    (building as any).setDepth(pos.y);

    this.gridState[col][row] = building;
    this.buildings.push(building);
    this.scene.gameManager.spendGold(cost);
    
    this.scene.audioManager.playSFX('sfx_build_place', { volume: 0.8 });
    this.scene.particleManager.playEffect('BUILD', pos.x, pos.y);
    
    return true;
  }
}
