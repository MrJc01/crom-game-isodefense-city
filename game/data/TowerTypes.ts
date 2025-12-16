
import { IStatusEffect } from '../types/StatusEffects';

export interface ITowerConfig {
  key: string;
  name: string;
  cost: number;
  range: number;
  damage: number;
  cooldown: number; // ms
  projectileSpeed: number;
  projectileColor: number;
  isAoE: boolean;
  blastRadius?: number; // Only required if isAoE is true
  tint: number; // To differentiate visuals without unique sprites
  effect?: IStatusEffect; // Optional status effect payload
}

export const TOWER_TYPES: Record<string, ITowerConfig> = {
  ARCHER: {
    key: 'ARCHER',
    name: 'Archer',
    cost: 100,
    range: 250,
    damage: 15,
    cooldown: 800,
    projectileSpeed: 400,
    projectileColor: 0xfacc15, // Yellow
    isAoE: false,
    tint: 0x3b82f6 // Blue
  },
  CANNON: {
    key: 'CANNON',
    name: 'Cannon',
    cost: 250,
    range: 180,
    damage: 40,
    cooldown: 2000,
    projectileSpeed: 300,
    projectileColor: 0x1e293b, // Dark Slate (Cannonball)
    isAoE: true,
    blastRadius: 80,
    tint: 0xef4444 // Red
  },
  SNIPER: {
    key: 'SNIPER',
    name: 'Sniper',
    cost: 400,
    range: 450,
    damage: 100,
    cooldown: 3000,
    projectileSpeed: 1200, // Very fast
    projectileColor: 0xffffff, // White tracer
    isAoE: false,
    tint: 0x10b981 // Emerald
  },
  ICE: {
    key: 'ICE',
    name: 'Ice',
    cost: 150,
    range: 200,
    damage: 5, // Low damage
    cooldown: 600, // Fast fire
    projectileSpeed: 500,
    projectileColor: 0x06b6d4, // Cyan
    isAoE: false,
    tint: 0x06b6d4, // Cyan
    effect: {
      type: 'SLOW',
      duration: 2000,
      value: 0.5 // 50% speed
    }
  }
};
