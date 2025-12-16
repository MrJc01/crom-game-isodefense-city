
export interface WaveConfig {
  waveNumber: number;
  enemyCount: number;
  spawnInterval: number; // Time in ms between spawns
  enemyType: 'basic' | 'fast' | 'tank';
}

export const LEVEL_1_WAVES: WaveConfig[] = [
  { waveNumber: 1, enemyCount: 5, spawnInterval: 2000, enemyType: 'basic' },
  { waveNumber: 2, enemyCount: 8, spawnInterval: 1500, enemyType: 'fast' },
  { waveNumber: 3, enemyCount: 4, spawnInterval: 2500, enemyType: 'tank' },
  { waveNumber: 4, enemyCount: 15, spawnInterval: 1000, enemyType: 'basic' }, // Swarm
  { waveNumber: 5, enemyCount: 10, spawnInterval: 1200, enemyType: 'fast' }
];
