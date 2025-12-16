import Phaser from 'phaser';
import { BuildingManager } from './BuildingManager';
import { IsoUtils } from '../utils/IsoUtils';
import { MAP_SIZE } from '../../constants';
import { GridPoint } from '../../types';

interface PathNode {
  col: number;
  row: number;
  g: number; // Cost from start
  h: number; // Heuristic to end
  f: number; // Total cost (g + h)
  parent: PathNode | null;
}

export class PathfindingManager {
  private scene: Phaser.Scene;
  private buildingManager: BuildingManager;
  private debugGraphics: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene, buildingManager: BuildingManager) {
    this.scene = scene;
    this.buildingManager = buildingManager;
    
    // Create graphics layer for debug lines, set high depth to see over buildings
    this.debugGraphics = this.scene.add.graphics();
    this.debugGraphics.setDepth(100000); 
  }

  /**
   * Calculates a path from start to end using A* Algorithm.
   */
  public findPath(start: GridPoint, end: GridPoint): GridPoint[] {
    // 1. Validation
    if (!this.isValidTile(start.col, start.row) || !this.isValidTile(end.col, end.row)) {
      console.warn("Pathfinding: Start or End invalid");
      return [];
    }

    const openList: PathNode[] = [];
    const closedList: boolean[][] = Array(MAP_SIZE).fill(false).map(() => Array(MAP_SIZE).fill(false));

    // Create Start Node
    const startNode: PathNode = {
      col: start.col,
      row: start.row,
      g: 0,
      h: this.getHeuristic(start, end),
      f: 0,
      parent: null
    };
    startNode.f = startNode.g + startNode.h;
    openList.push(startNode);

    while (openList.length > 0) {
      // Sort by F cost (lowest first)
      openList.sort((a, b) => a.f - b.f);
      
      const current = openList.shift()!;
      closedList[current.col][current.row] = true;

      // Check if reached destination
      if (current.col === end.col && current.row === end.row) {
        return this.retracePath(current);
      }

      // Check Neighbors (Up, Down, Left, Right)
      const neighbors = [
        { col: current.col + 1, row: current.row },
        { col: current.col - 1, row: current.row },
        { col: current.col, row: current.row + 1 },
        { col: current.col, row: current.row - 1 }
      ];

      for (const n of neighbors) {
        // Skip if invalid, occupied, or closed
        if (!this.isValidTile(n.col, n.row)) continue;
        if (closedList[n.col][n.row]) continue;
        if (this.buildingManager.isCellOccupied(n.col, n.row)) continue;

        // Calculate costs
        const gCost = current.g + 1; // Distance between neighbors is always 1
        let neighborNode = openList.find(node => node.col === n.col && node.row === n.row);

        if (!neighborNode) {
          neighborNode = {
            col: n.col,
            row: n.row,
            g: gCost,
            h: this.getHeuristic(n, end),
            f: 0,
            parent: current
          };
          neighborNode.f = neighborNode.g + neighborNode.h;
          openList.push(neighborNode);
        } else if (gCost < neighborNode.g) {
          // Found a better path to this neighbor
          neighborNode.g = gCost;
          neighborNode.f = neighborNode.g + neighborNode.h;
          neighborNode.parent = current;
        }
      }
    }

    // No path found
    return [];
  }

  /**
   * Retraces path from end node back to start.
   */
  private retracePath(endNode: PathNode): GridPoint[] {
    const path: GridPoint[] = [];
    let current: PathNode | null = endNode;

    while (current !== null) {
      path.push({ col: current.col, row: current.row });
      current = current.parent;
    }
    
    // Reverse to get Start -> End
    return path.reverse();
  }

  /**
   * Manhattan distance heuristic.
   */
  private getHeuristic(pos: GridPoint, target: GridPoint): number {
    return Math.abs(pos.col - target.col) + Math.abs(pos.row - target.row);
  }

  private isValidTile(col: number, row: number): boolean {
    return col >= 0 && col < MAP_SIZE && row >= 0 && row < MAP_SIZE;
  }

  /**
   * Visual Debugging: Draws the calculated path on the screen.
   */
  public drawDebugPath(path: GridPoint[]) {
    this.debugGraphics.clear();
    if (path.length < 2) return;

    this.debugGraphics.lineStyle(3, 0xffff00, 0.8); // Yellow line
    this.debugGraphics.beginPath();

    const startPos = IsoUtils.gridToScreen(path[0].col, path[0].row);
    this.debugGraphics.moveTo(startPos.x, startPos.y);

    for (let i = 1; i < path.length; i++) {
      const p = IsoUtils.gridToScreen(path[i].col, path[i].row);
      this.debugGraphics.lineTo(p.x, p.y);
    }

    this.debugGraphics.strokePath();

    // Draw little dots at nodes
    this.debugGraphics.fillStyle(0xff0000, 1);
    for (const node of path) {
      const p = IsoUtils.gridToScreen(node.col, node.row);
      this.debugGraphics.fillCircle(p.x, p.y, 3);
    }
    
    // Clear the debug path after 2 seconds
    this.scene.time.delayedCall(2000, () => {
        this.debugGraphics.clear();
    });
  }
}