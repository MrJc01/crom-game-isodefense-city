
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
  
  // UI Fields
  description: string;
  dpsEstimate: string;
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
    tint: 0x3b82f6, // Blue
    description: "Reliable kinetic damage. High accuracy against single targets.",
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
    projectileColor: 0x1e293b, // Dark Slate (Cannonball)
    isAoE: true,
    blastRadius: 80,
    tint: 0xef4444, // Red
    description: "Heavy ordnance. Deals splash damage to clustered hostiles.",
    dpsEstimate: "DPS: 20 (AoE)"
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
    tint: 0x10b981, // Emerald
    description: "High-caliber precision rifle. Eliminates high-value targets from afar.",
    dpsEstimate: "DPS: 33"
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
    },
    description: "Cryogenic emitter. Slows enemy movement speed by 50%.",
    dpsEstimate: "Support"
  }
};
