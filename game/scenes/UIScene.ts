
import Phaser from 'phaser';
import { MainScene } from './MainScene';
import { Tower } from '../objects/Tower';
import { SpellType } from '../systems/MagicManager';

export class UIScene extends Phaser.Scene {
  declare scene: Phaser.Scenes.ScenePlugin;

  private mainScene!: MainScene;
  private selectedTower: Tower | null = null;
  private handleCommandBound: (e: Event) => void;
  private handleCastBound: (e: Event) => void;

  constructor() {
    super({ key: 'UIScene', active: false });
    // Bind the listener method once so we can remove it correctly on shutdown
    this.handleCommandBound = this.handleCommand.bind(this);
    this.handleCastBound = this.handleCastSpell.bind(this);
  }

  create() {
    this.mainScene = this.scene.get('MainScene') as MainScene;

    // --- 1. Listen to GAME events (Phaser -> React) ---
    
    // Stats (Gold, Lives)
    if (this.mainScene.gameManager) {
      this.mainScene.gameManager.on('stats-changed', this.onStatsChanged, this);
      this.onStatsChanged(this.mainScene.gameManager.getStats()); // Initial emission
    }

    // Wave Events
    if (this.mainScene.waveManager) {
      this.mainScene.waveManager.on('wave-timer', this.onWaveTimer, this);
      this.mainScene.waveManager.on('wave-started', this.onWaveStarted, this);
      this.mainScene.waveManager.on('phase-change', this.onPhaseChange, this);
      this.mainScene.waveManager.on('game-victory', this.onVictory, this);
    }
    
    // Tower Selection
    this.mainScene.events.on('tower-selected', this.onTowerSelected, this);
    this.mainScene.events.on('tower-deselected', this.onTowerDeselected, this);
    this.mainScene.gameManager.on('game-over', this.onDefeat, this);

    // --- 2. Listen to DOM events (React -> Phaser) ---
    window.addEventListener('iso-command', this.handleCommandBound);
    window.addEventListener('iso-cast-spell', this.handleCastBound);
  }

  // --- Game Event Handlers ---

  private onStatsChanged(stats: { gold: number, mana: number, lives: number }) {
    this.dispatch('iso-stats', stats);
  }

  private onWaveTimer(timeLeft: number, totalTime: number) {
    this.dispatch('iso-timer', { timeLeft, totalTime });
  }

  private onWaveStarted(waveNumber: number) {
    this.dispatch('iso-wave-start', { waveNumber });
  }

  private onPhaseChange(phase: string) {
    this.dispatch('iso-phase', { phase });
  }

  private onTowerSelected(tower: Tower) {
    this.selectedTower = tower;
    this.dispatch('iso-selection', tower.getStats());
  }

  private onTowerDeselected() {
    this.selectedTower = null;
    this.dispatch('iso-selection', null);
  }

  private onDefeat() {
    this.dispatch('iso-game-over', { success: false });
  }

  private onVictory(data: { wave: number }) {
    this.dispatch('iso-game-over', { success: true, finalWave: data.wave });
  }

  /**
   * Helper to dispatch CustomEvents to the window
   */
  private dispatch(eventName: string, detail: any) {
    window.dispatchEvent(new CustomEvent(eventName, { detail }));
  }

  // --- React Command Handler ---

  private handleCommand(e: Event) {
    const customEvent = e as CustomEvent;
    const { action, payload } = customEvent.detail;

    switch (action) {
      case 'SET_BUILD_MODE':
        // Payload: { key: string }
        if (payload?.key) {
          this.mainScene.setBuildMode(payload.key);
        }
        break;

      case 'UPGRADE_TOWER':
        if (this.selectedTower) {
          const cost = this.selectedTower.getUpgradeCost();
          if (this.mainScene.gameManager.canAfford(cost)) {
            this.mainScene.gameManager.spendGold(cost);
            this.selectedTower.upgrade();
            // Refresh selection in UI
            this.onTowerSelected(this.selectedTower);
          }
        }
        break;

      case 'SELL_TOWER':
        if (this.selectedTower) {
          this.mainScene.events.emit('request-sell-tower');
        }
        break;
    }
  }

  private handleCastSpell(e: Event) {
      const customEvent = e as CustomEvent;
      const { spellId } = customEvent.detail;

      if (this.mainScene.magicManager) {
          const success = this.mainScene.magicManager.castSpell(spellId as SpellType);
          if (success) {
              // Notify React that cast succeeded (to trigger local UI cooldown logic)
              this.dispatch('iso-spell-cast', { spellId, success: true });
          } else {
              this.dispatch('iso-spell-cast', { spellId, success: false });
          }
      }
  }

  shutdown() {
    window.removeEventListener('iso-command', this.handleCommandBound);
    window.removeEventListener('iso-cast-spell', this.handleCastBound);
  }
}
