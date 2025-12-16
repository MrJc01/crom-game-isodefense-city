import Phaser from 'phaser';

export interface IStatusEffect {
  type: 'SLOW' | 'BURN' | 'STUN';
  duration: number; // in ms
  value: number; // e.g., 0.5 for 50% speed
  timer?: Phaser.Time.TimerEvent;
}
