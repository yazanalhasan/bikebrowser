/**
 * AudioManager — centralized game audio controller.
 *
 * Uses the Web Audio API directly (not Phaser sound) so it works
 * regardless of Phaser lifecycle and can be controlled from React.
 *
 * Features:
 *   • Volume buses: master, music, sfx, ambient
 *   • Mute toggles per bus
 *   • Music crossfade (smooth scene transitions)
 *   • Ducking (lower music during stingers)
 *   • SFX cooldown (prevent spam)
 *   • Random pitch/volume variation for repeated sounds
 *   • Mobile-safe: no audio until first user gesture
 *   • Visibility-aware: suspend on hidden, resume on visible
 *   • Clean shutdown when leaving /play
 */

import { ALL_ASSETS, ASSET_MAP, SCENE_MUSIC, SCENE_MUSIC_ALT, SCENE_AMBIENT } from './audioManifest.js';
import { loadAudioSettings, saveAudioSettings } from './audioSettings.js';
import { generateProceduralSound } from './proceduralAudio.js';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const CROSSFADE_MS = 1200;       // music crossfade duration
const DUCK_AMOUNT = 0.35;        // music volume multiplier during ducking
const DUCK_RESTORE_MS = 800;     // time to restore music after duck
const SFX_COOLDOWN_MS = 80;      // min ms between repeated SFX of same key
const PITCH_VARIATION = 0.06;    // ±6% for repeated mechanic sounds
const VOL_VARIATION = 0.08;      // ±8% variation

// ---------------------------------------------------------------------------
// AudioManager class
// ---------------------------------------------------------------------------
export default class AudioManager {
  constructor() {
    /** @type {AudioContext|null} */
    this.ctx = null;

    // Bus gain nodes
    this.masterGain = null;
    this.musicGain = null;
    this.sfxGain = null;
    this.ambientGain = null;

    // Loaded audio buffers: key → AudioBuffer
    this._buffers = new Map();
    // Currently loading keys (avoid duplicate fetches)
    this._loading = new Set();

    // Active sources
    /** @type {AudioBufferSourceNode|null} */
    this._currentMusic = null;
    this._currentMusicKey = null;
    this._currentMusicGainNode = null;

    /** @type {AudioBufferSourceNode|null} */
    this._currentAmbient = null;
    this._currentAmbientKey = null;
    this._currentAmbientGainNode = null;

    // SFX cooldown tracking: key → last play timestamp
    this._sfxLastPlayed = new Map();

    // Settings
    this.settings = loadAudioSettings();

    // State
    this._unlocked = false;
    this._suspended = false;
    this._ducking = false;
    this._duckTimer = null;

    // Bind visibility handler
    this._onVisibility = this._onVisibility.bind(this);
  }

  // =========================================================================
  // Lifecycle
  // =========================================================================

  /**
   * Initialize the audio context. Call this on the first user gesture.
   * Returns true if newly initialized, false if already unlocked.
   */
  unlock() {
    if (this._unlocked && this.ctx) return false;

    this.ctx = new (window.AudioContext || window.webkitAudioContext)();

    // Build gain node chain: source → bus → master → destination
    this.masterGain = this.ctx.createGain();
    this.masterGain.connect(this.ctx.destination);

    this.musicGain = this.ctx.createGain();
    this.musicGain.connect(this.masterGain);

    this.sfxGain = this.ctx.createGain();
    this.sfxGain.connect(this.masterGain);

    this.ambientGain = this.ctx.createGain();
    this.ambientGain.connect(this.masterGain);

    this._applySettings();
    this._unlocked = true;

    document.addEventListener('visibilitychange', this._onVisibility);

    return true;
  }

  /** Whether the audio context has been unlocked by a user gesture. */
  get isUnlocked() {
    return this._unlocked;
  }

  /**
   * Suspend all audio (when leaving /play or tab hidden).
   */
  suspend() {
    if (!this.ctx) return;
    this._suspended = true;
    this.ctx.suspend();
  }

  /**
   * Resume audio (returning to /play or tab visible).
   */
  resume() {
    if (!this.ctx) return;
    this._suspended = false;
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  /**
   * Stop all currently playing audio (music, ambient, SFX).
   * Does not close the context — use destroy() for full shutdown.
   */
  stopAll() {
    this.stopMusic(200);
    this.stopAmbient(200);
    // No active SFX tracking needed — one-shots auto-stop.
  }

  /**
   * Full shutdown — stop everything, close context.
   */
  destroy() {
    document.removeEventListener('visibilitychange', this._onVisibility);
    this.stopMusic();
    this.stopAmbient();
    if (this.ctx && this.ctx.state !== 'closed') {
      this.ctx.close().catch(() => {});
    }
    this.ctx = null;
    this._unlocked = false;
    this._buffers.clear();
    this._loading.clear();
    clearTimeout(this._duckTimer);
  }

  // =========================================================================
  // Asset Loading
  // =========================================================================

  /**
   * Preload a single audio asset by key.
   * @param {string} key
   * @returns {Promise<AudioBuffer|null>}
   */
  async load(key) {
    if (this._buffers.has(key)) return this._buffers.get(key);
    if (this._loading.has(key)) return null; // already in flight

    const asset = ASSET_MAP[key];
    if (!asset) {
      console.warn(`[AudioManager] Unknown asset key: ${key}`);
      return null;
    }

    this._loading.add(key);
    try {
      // Try each format; skip empty/missing files (0-byte placeholders)
      const exts = ['.ogg', '.mp3', '.wav'];
      for (const ext of exts) {
        try {
          const resp = await fetch(asset.path + ext);
          if (!resp.ok) continue;
          const arrayBuf = await resp.arrayBuffer();
          if (arrayBuf.byteLength === 0) continue;
          const audioBuf = await this.ctx.decodeAudioData(arrayBuf);
          this._buffers.set(key, audioBuf);
          this._loading.delete(key);
          return audioBuf;
        } catch {
          // decode failed for this format, try next
          continue;
        }
      }
      // File missing or empty — try procedural fallback
      const procBuf = await generateProceduralSound(this.ctx, key);
      if (procBuf) {
        this._buffers.set(key, procBuf);
        this._loading.delete(key);
        return procBuf;
      }
      this._loading.delete(key);
      return null;
    } catch {
      // Decode failed — try procedural fallback
      try {
        const procBuf = await generateProceduralSound(this.ctx, key);
        if (procBuf) {
          this._buffers.set(key, procBuf);
          this._loading.delete(key);
          return procBuf;
        }
      } catch { /* ignore */ }
      this._loading.delete(key);
      return null;
    }
  }

  /**
   * Preload multiple assets by key.
   * @param {string[]} keys
   */
  async preloadKeys(keys) {
    if (!this.ctx) return;
    await Promise.all(keys.map((k) => this.load(k)));
  }

  /**
   * Preload assets for a specific scene.
   * @param {string} sceneKey — e.g. 'GarageScene'
   */
  async preloadForScene(sceneKey) {
    const keys = [];
    // Scene music & ambient (primary + alternate)
    if (SCENE_MUSIC[sceneKey]) keys.push(SCENE_MUSIC[sceneKey]);
    if (SCENE_MUSIC_ALT[sceneKey]) keys.push(SCENE_MUSIC_ALT[sceneKey]);
    if (SCENE_AMBIENT[sceneKey]) keys.push(SCENE_AMBIENT[sceneKey]);
    // Always preload common UI sfx + stingers
    keys.push('ui_tap', 'ui_panel_open', 'ui_panel_close', 'ui_notebook_open',
      'ui_quest_accept', 'ui_quest_complete', 'ui_error', 'ui_success',
      'interaction_ping', 'item_pickup', 'reward_stinger',
      'reward_tarabi_stinger', 'upgrade_unlock_hybrid');
    await this.preloadKeys(keys);
  }

  // =========================================================================
  // Music
  // =========================================================================

  /**
   * Play a music track. Crossfades from any currently playing track.
   * @param {string} key
   */
  async playMusic(key) {
    console.log('[AudioManager] playMusic:', key, 'ctx:', !!this.ctx, 'suspended:', this._suspended, 'currentKey:', this._currentMusicKey);
    if (!this.ctx || this._suspended) { console.warn('[AudioManager] playMusic BAIL: no ctx or suspended'); return; }
    if (this._currentMusicKey === key) { console.log('[AudioManager] playMusic SKIP: already playing', key); return; }

    const buffer = this._buffers.get(key) || await this.load(key);
    console.log('[AudioManager] playMusic buffer for', key, ':', buffer ? `${buffer.duration}s` : 'NULL');
    if (!buffer) return;

    const asset = ASSET_MAP[key];
    const targetVol = asset?.volume ?? 0.5;

    // Fade out old music
    if (this._currentMusic) {
      this._fadeOutSource(this._currentMusic, this._currentMusicGainNode, CROSSFADE_MS);
    }

    // Create new source
    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = asset?.loop ?? true;

    const gainNode = this.ctx.createGain();
    gainNode.gain.setValueAtTime(0, this.ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(targetVol, this.ctx.currentTime + CROSSFADE_MS / 1000);

    source.connect(gainNode);
    gainNode.connect(this.musicGain);
    source.start(0);

    this._currentMusic = source;
    this._currentMusicKey = key;
    this._currentMusicGainNode = gainNode;

    source.onended = () => {
      if (this._currentMusic === source) {
        this._currentMusic = null;
        this._currentMusicKey = null;
        this._currentMusicGainNode = null;
      }
    };
  }

  /** Stop current music with a quick fade. */
  stopMusic(fadeMs = 400) {
    if (this._currentMusic && this._currentMusicGainNode) {
      this._fadeOutSource(this._currentMusic, this._currentMusicGainNode, fadeMs);
    }
    this._currentMusic = null;
    this._currentMusicKey = null;
    this._currentMusicGainNode = null;
  }

  // =========================================================================
  // Ambient
  // =========================================================================

  /**
   * Play an ambient track. Crossfades from any currently playing ambient.
   * @param {string} key
   */
  async playAmbient(key) {
    if (!this.ctx || this._suspended) return;
    if (this._currentAmbientKey === key) return;

    const buffer = this._buffers.get(key) || await this.load(key);
    if (!buffer) return;

    const asset = ASSET_MAP[key];
    const targetVol = asset?.volume ?? 0.3;

    if (this._currentAmbient) {
      this._fadeOutSource(this._currentAmbient, this._currentAmbientGainNode, CROSSFADE_MS);
    }

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = asset?.loop ?? true;

    const gainNode = this.ctx.createGain();
    gainNode.gain.setValueAtTime(0, this.ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(targetVol, this.ctx.currentTime + CROSSFADE_MS / 1000);

    source.connect(gainNode);
    gainNode.connect(this.ambientGain);
    source.start(0);

    this._currentAmbient = source;
    this._currentAmbientKey = key;
    this._currentAmbientGainNode = gainNode;

    source.onended = () => {
      if (this._currentAmbient === source) {
        this._currentAmbient = null;
        this._currentAmbientKey = null;
        this._currentAmbientGainNode = null;
      }
    };
  }

  stopAmbient(fadeMs = 400) {
    if (this._currentAmbient && this._currentAmbientGainNode) {
      this._fadeOutSource(this._currentAmbient, this._currentAmbientGainNode, fadeMs);
    }
    this._currentAmbient = null;
    this._currentAmbientKey = null;
    this._currentAmbientGainNode = null;
  }

  // =========================================================================
  // SFX
  // =========================================================================

  /**
   * Play a one-shot sound effect.
   * @param {string} key
   * @param {{ vary?: boolean }} opts — vary: add pitch/vol variation
   */
  async playSfx(key, opts = {}) {
    if (!this.ctx || this._suspended) return;

    // Cooldown check
    const now = performance.now();
    const last = this._sfxLastPlayed.get(key) || 0;
    if (now - last < SFX_COOLDOWN_MS) return;
    this._sfxLastPlayed.set(key, now);

    const buffer = this._buffers.get(key) || await this.load(key);
    if (!buffer) return;

    const asset = ASSET_MAP[key];
    let vol = asset?.volume ?? 0.4;
    let rate = 1.0;

    // Random variation for mechanic sounds
    if (opts.vary) {
      vol *= 1 + (Math.random() * 2 - 1) * VOL_VARIATION;
      rate = 1 + (Math.random() * 2 - 1) * PITCH_VARIATION;
    }

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.playbackRate.value = rate;

    const gainNode = this.ctx.createGain();
    gainNode.gain.value = vol;

    source.connect(gainNode);
    gainNode.connect(this.sfxGain);
    source.start(0);

    // Auto-cleanup
    source.onended = () => {
      source.disconnect();
      gainNode.disconnect();
    };
  }

  // =========================================================================
  // Stingers (with duck)
  // =========================================================================

  /**
   * Play a stinger cue and momentarily duck the music.
   * @param {string} key
   */
  async playStinger(key) {
    if (!this.ctx || this._suspended) return;

    // Duck music
    this._duckMusic();

    // Play the stinger as SFX
    await this.playSfx(key);
  }

  _duckMusic() {
    if (!this._currentMusicGainNode || this._ducking) return;
    this._ducking = true;

    const g = this._currentMusicGainNode.gain;
    const current = g.value;
    g.setValueAtTime(current, this.ctx.currentTime);
    g.linearRampToValueAtTime(current * DUCK_AMOUNT, this.ctx.currentTime + 0.15);

    clearTimeout(this._duckTimer);
    this._duckTimer = setTimeout(() => {
      if (this._currentMusicGainNode) {
        const gn = this._currentMusicGainNode.gain;
        gn.linearRampToValueAtTime(current, this.ctx.currentTime + DUCK_RESTORE_MS / 1000);
      }
      this._ducking = false;
    }, 600);
  }

  // =========================================================================
  // Settings / Volume
  // =========================================================================

  /**
   * Update a setting and apply immediately.
   * @param {string} prop — setting key from audioSettings defaults
   * @param {*} value
   */
  setSetting(prop, value) {
    this.settings[prop] = value;
    this._applySettings();
    saveAudioSettings(this.settings);
  }

  /** Apply all current settings to gain nodes. */
  _applySettings() {
    if (!this.masterGain) return;
    const s = this.settings;
    const masterVol = s.masterMute ? 0 : s.masterVolume;
    this.masterGain.gain.setTargetAtTime(masterVol, this.ctx.currentTime, 0.05);
    this.musicGain.gain.setTargetAtTime(s.musicMute ? 0 : s.musicVolume, this.ctx.currentTime, 0.05);
    this.sfxGain.gain.setTargetAtTime(s.sfxMute ? 0 : s.sfxVolume, this.ctx.currentTime, 0.05);
    this.ambientGain.gain.setTargetAtTime(s.ambientMute ? 0 : s.ambientVolume, this.ctx.currentTime, 0.05);
  }

  // =========================================================================
  // Scene helpers
  // =========================================================================

  /**
   * Convenience: crossfade to the correct music + ambient for a scene.
   * @param {string} sceneKey
   */
  async transitionToScene(sceneKey) {
    console.log('[AudioManager] transitionToScene:', sceneKey);
    const musicKey = SCENE_MUSIC[sceneKey];
    const ambientKey = SCENE_AMBIENT[sceneKey];
    console.log('[AudioManager] musicKey:', musicKey, 'ambientKey:', ambientKey, 'ctx:', !!this.ctx, 'suspended:', this._suspended);
    if (musicKey) this.playMusic(musicKey);
    if (ambientKey) this.playAmbient(ambientKey);
  }

  /**
   * Like transitionToScene, but uses the Arabic-inspired / hybrid alternate
   * music track for the scene (if one exists). Falls back to primary.
   * @param {string} sceneKey
   */
  async transitionToSceneAlt(sceneKey) {
    const musicKey = SCENE_MUSIC_ALT[sceneKey] || SCENE_MUSIC[sceneKey];
    const ambientKey = SCENE_AMBIENT[sceneKey];
    if (musicKey) this.playMusic(musicKey);
    if (ambientKey) this.playAmbient(ambientKey);
  }

  // =========================================================================
  // Internal helpers
  // =========================================================================

  _fadeOutSource(source, gainNode, ms) {
    if (!gainNode || !this.ctx) return;
    try {
      const g = gainNode.gain;
      g.setValueAtTime(g.value, this.ctx.currentTime);
      g.linearRampToValueAtTime(0, this.ctx.currentTime + ms / 1000);
      setTimeout(() => {
        try { source.stop(); } catch { /* already stopped */ }
        try { source.disconnect(); gainNode.disconnect(); } catch { /* ok */ }
      }, ms + 50);
    } catch { /* ok */ }
  }

  _onVisibility() {
    if (document.hidden) {
      this.suspend();
    } else {
      this.resume();
    }
  }
}
