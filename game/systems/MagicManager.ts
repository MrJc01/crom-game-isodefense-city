
import Phaser from 'phaser';
import { MainScene } from '../scenes/MainScene';
import { Tower } from '../objects/Tower';

export type SpellType = 'REPAIR' | 'OVERCHARGE' | 'NUKE';

export interface SpellConfig {
    id: SpellType;
    name: string;
    manaCost: number;
    cooldownMs: number;
    description: string;
}

export const SPELLS: Record<SpellType, SpellConfig> = {
    REPAIR: {
        id: 'REPAIR',
        name: 'Repair Protocol',
        manaCost: 50,
        cooldownMs: 5000,
        description: 'Restores 5 Integrity to the Colony.'
    },
    OVERCHARGE: {
        id: 'OVERCHARGE',
        name: 'Overcharge',
        manaCost: 100,
        cooldownMs: 45000,
        description: '+50% Tower Damage for 15s.'
    },
    NUKE: {
        id: 'NUKE',
        name: 'Orbital Strike',
        manaCost: 150,
        cooldownMs: 60000,
        description: 'Deals 500 DMG to all enemies.'
    }
};

export class MagicManager extends Phaser.Events.EventEmitter {
    private scene: MainScene;
    private cooldowns: Map<SpellType, number> = new Map();

    constructor(scene: MainScene) {
        super();
        this.scene = scene;
    }

    public castSpell(spellId: SpellType): boolean {
        const spell = SPELLS[spellId];
        if (!spell) return false;

        // 1. Check Cooldown
        const now = this.scene.time.now;
        const lastCast = this.cooldowns.get(spellId) || 0;
        if (now < lastCast + spell.cooldownMs) {
            return false; // Still on cooldown
        }

        // 2. Check Cost
        const currentMana = this.scene.gameManager.mana;
        if (currentMana < spell.manaCost) {
            return false; // Not enough mana
        }

        // 3. Execute
        this.scene.gameManager.spendMana(spell.manaCost);
        this.cooldowns.set(spellId, now);

        this.applySpellEffect(spellId);

        return true;
    }

    private applySpellEffect(spellId: SpellType) {
        switch(spellId) {
            case 'REPAIR':
                this.scene.gameManager.lives += 5;
                // Emit update manually as gameManager lives isn't a setter that emits? 
                // Wait, GameManager emitStats sends current values. We need to trigger that.
                // Hack: Earn 0 gold to trigger stat emit, or add explicit method. 
                // Ideally GameManager.lives should allow setter.
                // Assuming GameManager logic: We can call earnGold(0) to force update or access private method.
                // Cleanest: GameManager.loseLife reduces. We can add heal. 
                // Since I cannot change GameManager easily in this step without re-pasting it:
                // I will just modify the property and hope UI updates on next tick or I can force it.
                // GameManager.earnGold(0) works to emit 'stats-changed'.
                this.scene.gameManager.earnGold(0);
                
                // Visuals
                this.scene.audioManager.playSFX('sfx_build_place', { volume: 1.0 });
                // Play visual on HQ (10,10)
                const hqPos = this.scene.gridManager.cartesianToIso(10, 10);
                this.scene.particleManager.playEffect('BUILD', hqPos.x, hqPos.y);
                break;

            case 'OVERCHARGE':
                this.applyOvercharge();
                break;

            case 'NUKE':
                this.applyNuke();
                break;
        }
    }

    private applyOvercharge() {
        // Visual
        this.scene.cameras.main.flash(200, 255, 0, 0); // Red flash
        this.scene.audioManager.playSFX('sfx_ui_click', { volume: 1.0 }); // Placeholder sound

        const duration = 15000;
        const towers: Tower[] = [];

        // Apply Buff
        this.scene.buildingManager.getAllBuildings().forEach(b => {
            if (b instanceof Tower && b.towerKey !== 'HQ') {
                b.setDamageMultiplier(1.5);
                towers.push(b);
            }
        });

        // Revert after duration
        this.scene.time.delayedCall(duration, () => {
            towers.forEach(t => {
                if (t.active) {
                    t.setDamageMultiplier(1.0);
                }
            });
        });
    }

    private applyNuke() {
        // Visuals
        this.scene.cameras.main.shake(500, 0.02);
        this.scene.cameras.main.flash(500, 255, 255, 255);
        this.scene.audioManager.playSFX('sfx_shoot_cannon', { volume: 1.0, force: true });

        // Ensure scene and getEnemies exist
        if (!this.scene || typeof this.scene.getEnemies !== 'function') return;

        const enemies = this.scene.getEnemies();
        
        // Damage all enemies
        // Copy array to avoid modification issues during iteration (death removal)
        [...enemies].forEach(enemy => {
            if (enemy.active) {
                this.scene.particleManager.playEffect('EXPLOSION', enemy.x, enemy.y);
                enemy.takeDamage(500);
            }
        });
    }

    public getCooldownProgress(spellId: SpellType): number {
        const spell = SPELLS[spellId];
        const lastCast = this.cooldowns.get(spellId) || 0;
        const now = this.scene.time.now;
        
        if (now >= lastCast + spell.cooldownMs) return 1; // Ready
        
        const elapsed = now - lastCast;
        return elapsed / spell.cooldownMs;
    }
}
