
import { IStatusEffect } from '../types/StatusEffects';

export interface ITowerConfig {
  key: string;
  name: string;
  cost: number;
  range: number;
  damage: number;
  cooldown: number; 
  projectileSpeed: number;
  projectileColor: number;
  isAoE: boolean;
  blastRadius?: number; 
  tint: number; 
  effect?: IStatusEffect; 
  health: number; // New stat
  
  description: string;
  dpsEstimate: string;
}

export const TOWER_TYPES: Record<string, ITowerConfig> = {
  HQ: {
    key: 'HQ',
    name: 'Headquarters',
    cost: 0,
    range: 0,
    damage: 0,
    cooldown: 0,
    projectileSpeed: 0,
    projectileColor: 0,
    isAoE: false,
    tint: 0xffffff,
    health: 5000,
    description: "The heart of the colony. Protect it at all costs.",
    dpsEstimate: "Core"
  },
  ARCHER: {
    key: 'ARCHER',
    name: 'Archer',
    cost: 100,
    range: 250,
    damage: 15,
    cooldown: 800,
    projectileSpeed: 400,
    projectileColor: 0xfacc15,
    isAoE: false,
    tint: 0x3b82f6,
    health: 200,
    description: "Reliable kinetic damage. High accuracy.",
    dpsEstimate: "DPS: 19"
  },
  CANNON: {
    key: 'CANNON',
    name: 'Cannon',
    cost: 250,
    range: 180,
    damage: 40,
    cooldown: 2000,
    projectileSpeed: 300,
    projectileColor: 0x1e293b,
    isAoE: true,
    blastRadius: 80,
    tint: 0xef4444,
    health: 350,
    description: "Heavy ordnance with splash damage.",
    dpsEstimate: "DPS: 20 (AoE)"
  },
  SNIPER: {
    key: 'SNIPER',
    name: 'Sniper',
    cost: 400,
    range: 450,
    damage: 100,
    cooldown: 3000,
    projectileSpeed: 1200,
    projectileColor: 0xffffff,
    isAoE: false,
    tint: 0x10b981,
    health: 150,
    description: "High-caliber precision rifle.",
    dpsEstimate: "DPS: 33"
  },
  ICE: {
    key: 'ICE',
    name: 'Ice',
    cost: 150,
    range: 200,
    damage: 5,
    cooldown: 600,
    projectileSpeed: 500,
    projectileColor: 0x06b6d4,
    isAoE: false,
    tint: 0x06b6d4,
    health: 200,
    effect: { type: 'SLOW', duration: 2000, value: 0.5 },
    description: "Slows enemy movement speed.",
    dpsEstimate: "Support"
  },
  GOLD_MINE: {
    key: 'GOLD_MINE',
    name: 'Gold Mine',
    cost: 150,
    range: 0,
    damage: 0,
    cooldown: 0,
    projectileSpeed: 0,
    projectileColor: 0,
    isAoE: false,
    tint: 0xfbbf24,
    health: 100,
    description: "Generates +5 Gold every second.",
    dpsEstimate: "Econ"
  },
  MANA_CRYSTAL: {
    key: 'MANA_CRYSTAL',
    name: 'Mana Crystal',
    cost: 200,
    range: 0,
    damage: 0,
    cooldown: 0,
    projectileSpeed: 0,
    projectileColor: 0,
    isAoE: false,
    tint: 0xa855f7, // Purple
    health: 100,
    description: "Generates +2 Mana every second.",
    dpsEstimate: "Econ"
  }
};
