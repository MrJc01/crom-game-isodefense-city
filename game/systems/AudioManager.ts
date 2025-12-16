
import Phaser from 'phaser';

export class AudioManager {
  private scene: Phaser.Scene;
  private currentMusic: Phaser.Sound.BaseSound | null = null;
  private isMuted: boolean = false;

  // Rate limiting to prevent "machine gun" audio artifacts when many towers fire at once
  private lastPlayed: Map<string, number> = new Map();
  private readonly SFX_LIMIT_MS = 50; // Minimum time between identical sounds

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  public playMusic(key: string, vol: number = 0.5) {
    if (this.currentMusic) {
      // If same track is playing, do nothing
      if (this.currentMusic.key === key && this.currentMusic.isPlaying) {
        return;
      }
      this.currentMusic.stop();
    }

    // Check if asset exists
    if (this.scene.cache.audio.exists(key)) {
      this.currentMusic = this.scene.sound.add(key, { 
        loop: true, 
        volume: vol 
      });
      this.currentMusic.play();
    }
  }

  public playSFX(key: string, config: { volume?: number, force?: boolean } = {}) {
    if (this.isMuted) return;

    // 1. Rate Limiting Check
    const now = this.scene.time.now;
    const lastTime = this.lastPlayed.get(key) || 0;
    
    if (!config.force && (now - lastTime < this.SFX_LIMIT_MS)) {
      return; // Skip playback to prevent ear-bleeding overlap
    }

    this.lastPlayed.set(key, now);

    // 2. Play with Detune for variety
    // Detune range: -100 to 100 cents (small pitch shift)
    // This makes repetitive sounds (shooting) feel less robotic
    if (this.scene.cache.audio.exists(key)) {
      this.scene.sound.play(key, {
        volume: config.volume || 1.0,
        detune: Phaser.Math.Between(-100, 100)
      });
    }
  }

  public toggleMute() {
    this.isMuted = !this.isMuted;
    this.scene.sound.mute = this.isMuted;
  }
}
