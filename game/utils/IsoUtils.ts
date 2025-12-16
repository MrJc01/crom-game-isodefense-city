import { TILE_WIDTH, TILE_HEIGHT, GAME_WIDTH, GAME_HEIGHT } from '../../constants';
import { Point2D, GridPoint } from '../../types';

/**
 * IsoUtils
 * Handles conversion between Cartesian (Screen) coordinates and Isometric (Grid) coordinates.
 * 
 * Math logic:
 * IsoX = (CartX - CartY)
 * IsoY = (CartX + CartY) / 2
 */
export class IsoUtils {
  // Offset to center the grid on the screen
  // We place (0,0) at top-center roughly
  private static centerX = GAME_WIDTH / 2;
  private static centerY = GAME_HEIGHT / 4; 

  /**
   * Converts Grid Coordinates (row, col) to Screen Coordinates (x, y).
   * @param col The column index (x in grid)
   * @param row The row index (y in grid)
   */
  public static gridToScreen(col: number, row: number): Point2D {
    const x = (col - row) * (TILE_WIDTH / 2) + this.centerX;
    const y = (col + row) * (TILE_HEIGHT / 2) + this.centerY;
    return { x, y };
  }

  /**
   * Converts Screen Coordinates (x, y) to Grid Coordinates (row, col).
   * Useful for mouse picking.
   * @param x Screen X
   * @param y Screen Y
   */
  public static screenToGrid(x: number, y: number): GridPoint {
    // Adjust for offset
    const adjX = x - this.centerX;
    const adjY = y - this.centerY;

    // Inverse Formula
    const col = (adjX / (TILE_WIDTH / 2) + adjY / (TILE_HEIGHT / 2)) / 2;
    const row = (adjY / (TILE_HEIGHT / 2) - adjX / (TILE_WIDTH / 2)) / 2;

    return {
      col: Math.round(col),
      row: Math.round(row)
    };
  }
}