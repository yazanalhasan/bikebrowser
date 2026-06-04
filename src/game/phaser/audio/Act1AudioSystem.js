import { MusicSystem } from './MusicSystem.js';
import { NPCVoiceRegistry } from './NPCVoiceRegistry.js';
import { speechNormalizationSystem } from './SpeechNormalizationSystem.js';

export const INTERACTION_CUES = {
  notebook_open: { label: 'Notebook open', volume: 0.15 },
  notebook_close: { label: 'Notebook close', volume: 0.12 },
  material_test: { label: 'Material test', volume: 0.18 },
  bridge_confirm: { label: 'Bridge confirmation', volume: 0.2 },
  bridge_error: { label: 'Bridge not ready', volume: 0.1 },
  trust_gain: { label: 'Trust gain', volume: 0.16 },
  map_unlock: { label: 'Map unlock', volume: 0.22 },
  chemistry_success: { label: 'Chemistry success', volume: 0.16 },
  ecology_observe: { label: 'Ecology observation', volume: 0.14 },
};

export class Act1AudioSystem {
  constructor(options = {}) {
    this.normalizer = options.normalizer || speechNormalizationSystem;
    this.voiceRegistry = options.voiceRegistry || new NPCVoiceRegistry();
    this.musicSystem = options.musicSystem || new MusicSystem();
    this.settings = {
      speechEnabled: true,
      autoSpeak: true,
      musicEnabled: true,
      ambientEnabled: true,
      interactionCuesEnabled: true,
      reducedAudio: false,
      subtitleMode: 'always',
      speechRate: 1,
      useServerVoice: true, // prefer the Executive Brain Piper voice over browser TTS
    };
    this.speechAvailable = typeof window !== 'undefined' && 'speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined';
    this.currentUtterance = null;
    // Server (Piper) voice: fetch synthesized WAV from the EB inspector and play
    // it; fall back to browser Web Speech when the server is unreachable.
    this.serverVoiceDown = false;
    this._serverAudio = null;
    this._ttsBlobCache = new Map();
    this.lastSpoken = null;
    this.lastNormalized = null;
    this.speaking = false;
    this.ambientState = 'neighborhood';
    this.cueLog = [];
    this.errors = [];
    this.auditInstalledAt = new Date().toISOString();
    this.auditLog = [];
    this.voiceCache = [];
    this.voiceAssignments = {};
    this.refreshVoiceCache();
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = () => {
        this.refreshVoiceCache();
      };
    }
    this.installAuditBridge();
  }

  installAuditBridge() {
    if (typeof window === 'undefined') return;
    window.BIKEBROWSER_AUDIO_AUDIT = {
      captureAudioState: () => this.getAuditState(),
      getState: () => this.getAuditState(),
      reset: () => this.resetAudit(),
      unlockAudio: () => this.unlockAudio(),
      speakLine: (text, voiceIdOrSpeaker = 'zuzu', options = {}) => this.speakLine(text, voiceIdOrSpeaker, options),
      stopSpeech: () => this.stopSpeech(),
      transitionMusic: (stateKey) => this.transitionMusic(stateKey),
      setAmbient: (stateKey) => this.setAmbient(stateKey),
      playInteractionCue: (cueId) => this.playInteractionCue(cueId),
    };
    this.recordAudit('audit_bridge_installed', { available: true });
  }

  recordAudit(type, payload = {}) {
    const entry = {
      type,
      at: new Date().toISOString(),
      ...payload,
    };
    this.auditLog.push(entry);
    this.auditLog = this.auditLog.slice(-100);
    return entry;
  }

  resetAudit() {
    this.auditLog = [];
    this.recordAudit('audit_reset', { available: true });
    return this.getAuditState();
  }

  unlockAudio() {
    this.musicSystem.unlock();
    this.musicSystem.setSettings(this.settings);
    if (!this.musicSystem.currentState) this.musicSystem.transitionTo('neighborhood');
    const result = { ok: true, speechAvailable: this.speechAvailable, music: this.musicSystem.getState() };
    this.recordAudit('audio_unlocked', result);
    return result;
  }

  setSettings(settings = {}) {
    this.settings = { ...this.settings, ...settings };
    this.musicSystem.setSettings(this.settings);
    if (!this.settings.speechEnabled) this.stopSpeech();
    this.recordAudit('settings_changed', { settings: { ...this.settings } });
    return this.getState();
  }

  refreshVoiceCache() {
    if (typeof window === 'undefined' || !window.speechSynthesis?.getVoices) {
      this.voiceCache = [];
      this.voiceAssignments = {};
      return this.voiceCache;
    }
    const voices = window.speechSynthesis.getVoices() || [];
    this.voiceCache = voices;
    this.voiceAssignments = Object.fromEntries(
      Object.entries(this.voiceRegistry.profiles).map(([voiceId, profile]) => {
        const voice = this.pickBrowserVoice(profile, profile.language);
        return [voiceId, voice ? {
          name: voice.name,
          lang: voice.lang,
          default: Boolean(voice.default),
        } : { name: '(browser default)', lang: profile.language, default: true }];
      })
    );
    return voices;
  }

  pickBrowserVoice(profile, language) {
    if (!profile || profile.gender === 'default') return null;
    if (!this.voiceCache.length) return null;
    const langPrefix = String(language || profile.language || 'en-US').split('-')[0].toLowerCase();
    const candidates = this.voiceCache.filter((voice) => {
      const voiceLang = String(voice.lang || '').toLowerCase();
      return voiceLang.startsWith(langPrefix) || (langPrefix === 'en' && voiceLang.startsWith('en'));
    });
    const pool = candidates.length ? candidates : this.voiceCache;
    const hints = (profile.voiceHints || []).map((hint) => hint.toLowerCase());
    const hinted = pool.find((voice) => {
      const name = String(voice.name || '').toLowerCase();
      return hints.some((hint) => name.includes(hint));
    });
    if (hinted) return hinted;
    const genderHints = profile.gender === 'female'
      ? ['female', 'woman', 'zira', 'jenny', 'samantha', 'karen', 'victoria', 'aria']
      : ['male', 'man', 'guy', 'david', 'daniel', 'james', 'mark', 'alex'];
    return pool.find((voice) => {
      const name = String(voice.name || '').toLowerCase();
      return genderHints.some((hint) => name.includes(hint));
    }) || pool.find((voice) => String(voice.name || '').toLowerCase().includes('natural')) || pool[0] || null;
  }

  speakLine(text, voiceIdOrSpeaker = 'zuzu', options = {}) {
    const profile = this.voiceRegistry.getProfile(options.voiceId || voiceIdOrSpeaker);
    const normalized = this.normalizer.normalize(text, {
      spellChemicalFormulas: options.spellChemicalFormulas,
      spellAcronyms: options.spellAcronyms,
    });
    this.lastNormalized = normalized;
    this.recordAudit('speech_attempt', {
      voiceId: profile.voiceId,
      displayName: profile.displayName,
      normalized,
      speechAvailable: this.speechAvailable,
    });

    const serverEligible = this.settings.useServerVoice && !this.serverVoiceDown && typeof fetch !== 'undefined';

    if (!this.settings.speechEnabled || !normalized || (!this.speechAvailable && !serverEligible)) {
      this.lastSpoken = { text, normalized, voiceId: profile.voiceId, skipped: true };
      const reason = !this.settings.speechEnabled ? 'speech_disabled' : (!normalized ? 'empty' : 'speech_unavailable');
      this.recordAudit('speech_skipped', { voiceId: profile.voiceId, reason, normalized });
      return { ok: false, reason, normalized, voice: profile };
    }

    // Prefer the Executive Brain Piper voice. Falls back to the browser voice
    // per-line on HTTP error, or globally if the EB server is unreachable.
    if (serverEligible) {
      this.lastSpoken = {
        text, normalized, voiceId: profile.voiceId, via: 'server',
        language: options.language || profile.language || 'en-US',
      };
      this.recordAudit('speech_started', { ...this.lastSpoken });
      this.speaking = true;
      this.speakViaServer(normalized, profile, options);
      return { ok: true, normalized, voice: profile, via: 'server' };
    }

    return this._speakViaBrowser(text, normalized, profile, options);
  }

  // Browser Web Speech path (also the fallback when the server voice is down).
  _speakViaBrowser(text, normalized, profile, options = {}) {
    if (!this.speechAvailable) {
      this.lastSpoken = { text, normalized, voiceId: profile.voiceId, skipped: true };
      return { ok: false, reason: 'speech_unavailable', normalized, voice: profile };
    }
    this.stopSpeech();
    try {
      const utterance = new SpeechSynthesisUtterance(normalized);
      utterance.rate = (options.rate || profile.rate) * this.settings.speechRate;
      utterance.pitch = options.pitch || profile.pitch;
      utterance.lang = options.language || profile.language || 'en-US';
      const selectedVoice = this.pickBrowserVoice(profile, utterance.lang);
      if (selectedVoice) utterance.voice = selectedVoice;
      utterance.onend = () => {
        this.speaking = false;
        this.currentUtterance = null;
        this.recordAudit('speech_ended', { voiceId: profile.voiceId });
      };
      utterance.onerror = (event) => {
        this.speaking = false;
        this.currentUtterance = null;
        if (!['interrupted', 'canceled'].includes(event.error)) {
          this.errors.push({ type: 'speech', error: event.error || 'unknown' });
          this.recordAudit('speech_error', { voiceId: profile.voiceId, error: event.error || 'unknown' });
        }
      };
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
      this.currentUtterance = utterance;
      this.speaking = true;
      this.lastSpoken = {
        text,
        normalized,
        voiceId: profile.voiceId,
        language: utterance.lang,
        rate: utterance.rate,
        pitch: utterance.pitch,
        selectedVoiceName: selectedVoice?.name || '(browser default)',
      };
      this.recordAudit('speech_started', { ...this.lastSpoken });
      return { ok: true, normalized, voice: profile };
    } catch (error) {
      this.errors.push({ type: 'speech_exception', message: error.message });
      this.recordAudit('speech_exception', { voiceId: profile.voiceId, message: error.message });
      return { ok: false, reason: 'speech_exception', normalized, voice: profile };
    }
  }

  // Base URL of the Executive Brain inspector that serves /inspect/tts.
  // Override per-deploy with window.__BIKEBROWSER_TTS_BASE__.
  _ttsBase() {
    if (typeof window !== 'undefined' && window.__BIKEBROWSER_TTS_BASE__) return window.__BIKEBROWSER_TTS_BASE__;
    return 'http://localhost:8000';
  }

  // Fetch a Piper-synthesized WAV from EB and play it. On a network/CORS error
  // the server is marked down (browser voice from then on); on an HTTP error
  // (e.g. 409 CARE-gated voice) just this line falls back to the browser voice.
  async speakViaServer(normalized, profile, options = {}) {
    const language = options.language || profile.language || 'en-US';
    const key = `${profile.voiceId}|${language}|${normalized}`;
    try {
      let url = this._ttsBlobCache.get(key);
      if (!url) {
        const q = `text=${encodeURIComponent(normalized)}&voice=${encodeURIComponent(profile.voiceId)}&language=${encodeURIComponent(language)}`;
        const resp = await fetch(`${this._ttsBase()}/inspect/tts?${q}`, { method: 'GET' });
        if (!resp.ok) {
          // Per-line block (CARE gate / disabled): fall back to browser for this line only.
          this.recordAudit('server_tts_http', { status: resp.status, voiceId: profile.voiceId });
          return this._speakViaBrowser(normalized, normalized, profile, options);
        }
        const blob = await resp.blob();
        url = URL.createObjectURL(blob);
        this._ttsBlobCache.set(key, url);
      }
      this.stopSpeech();
      const audio = new Audio(url);
      this._serverAudio = audio;
      this.speaking = true;
      audio.onended = () => { this.speaking = false; this._serverAudio = null; };
      audio.onerror = () => { this.speaking = false; this._serverAudio = null; };
      await audio.play();
      this.recordAudit('server_tts_played', { voiceId: profile.voiceId, engine: 'piper' });
      return { ok: true, via: 'server' };
    } catch (err) {
      // Network/CORS error -> EB server unreachable; use the browser voice from now on.
      this.serverVoiceDown = true;
      this.recordAudit('server_tts_down', { message: String(err && err.message || err) });
      return this._speakViaBrowser(normalized, normalized, profile, options);
    }
  }

  autoSpeakLine(line) {
    if (!this.settings.autoSpeak || !line?.text) return { ok: false, reason: 'auto_speak_disabled' };
    return this.speakLine(line.text, line.voiceId || line.speaker, {
      language: line.language,
      emotion: line.emotion,
    });
  }

  // Narrator: read a scene panel's on-screen text aloud. Quieted by M
  // (reducedAudio) and re-playable with R (sets lastSpoken). De-duped so a
  // re-render of the same panel text does not restart the narration.
  narrate(text, options = {}) {
    const body = (Array.isArray(text) ? text.filter(Boolean).join('. ') : String(text || '')).trim();
    if (!body) return { ok: false, reason: 'empty' };
    if (this.settings.reducedAudio) return { ok: false, reason: 'reduced_audio' };
    const now = Date.now();
    if (options.dedupe !== false && body === this._lastNarrated
      && (this.speaking || now - (this._lastNarrateAt || 0) < 1200)) {
      return { ok: false, reason: 'duplicate' };
    }
    this._lastNarrated = body;
    this._lastNarrateAt = now;
    return this.speakLine(body, options.voiceId || 'narrator', { rate: options.rate });
  }

  replayLast() {
    if (!this.lastSpoken?.text) return { ok: false, reason: 'nothing_to_replay' };
    return this.speakLine(this.lastSpoken.text, this.lastSpoken.voiceId, { force: true });
  }

  stopSpeech() {
    if (this.speechAvailable) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // ignore browser-specific speech shutdown failures
      }
    }
    // Stop the server (Piper) audio element too (M/Esc/quiet must silence it).
    if (this._serverAudio) {
      try { this._serverAudio.pause(); this._serverAudio.currentTime = 0; } catch { /* noop */ }
      this._serverAudio = null;
    }
    this.speaking = false;
    this.currentUtterance = null;
    this.recordAudit('speech_stopped', { ok: true });
    return { ok: true };
  }

  transitionMusic(stateKey) {
    const result = this.musicSystem.transitionTo(stateKey);
    this.recordAudit('music_transition', { requestedState: stateKey, result, music: this.musicSystem.getState() });
    return result;
  }

  setAmbient(stateKey) {
    this.ambientState = stateKey;
    this.recordAudit('ambient_changed', { ambientState: stateKey });
    return { ok: true, ambientState: stateKey };
  }

  // A short ascending arpeggio via Web Audio — the actual "reward" sound on a
  // quest/objective completion. 'quest' plays a fuller 4-note fanfare. Silenced
  // by reducedAudio (M) / speech-disabled settings.
  playRewardChime(kind = 'objective') {
    if (this.settings.reducedAudio) return { ok: false, reason: 'reduced_audio' };
    if (typeof window === 'undefined') return { ok: false, reason: 'no_window' };
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return { ok: false, reason: 'no_webaudio' };
      this._sfxCtx = this._sfxCtx || new AC();
      const ctx = this._sfxCtx;
      if (ctx.state === 'suspended') ctx.resume();
      const now = ctx.currentTime;
      // C5 E5 G5 (+C6 for quest) — a bright major arpeggio.
      const notes = kind === 'quest' ? [523.25, 659.25, 783.99, 1046.5] : [659.25, 783.99, 1046.5];
      const step = 0.10;
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.value = freq;
        const t0 = now + i * step;
        gain.gain.setValueAtTime(0.0001, t0);
        gain.gain.exponentialRampToValueAtTime(0.18, t0 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.22);
        osc.connect(gain).connect(ctx.destination);
        osc.start(t0);
        osc.stop(t0 + 0.24);
      });
      this.recordAudit('reward_chime', { kind, notes: notes.length });
      return { ok: true };
    } catch (error) {
      return { ok: false, reason: 'sfx_error', message: error.message };
    }
  }

  playInteractionCue(cueId) {
    const cue = INTERACTION_CUES[cueId] || { label: cueId, volume: 0.1 };
    if (this.settings.interactionCuesEnabled && !this.settings.reducedAudio) {
      this.cueLog.push({ cueId, label: cue.label, at: new Date().toISOString() });
    } else {
      this.cueLog.push({ cueId, label: cue.label, skipped: true, at: new Date().toISOString() });
    }
    this.cueLog = this.cueLog.slice(-30);
    this.recordAudit('interaction_cue', {
      cueId,
      label: cue.label,
      skipped: !this.settings.interactionCuesEnabled || this.settings.reducedAudio,
    });
    return { ok: true, cue };
  }

  getAuditState() {
    const state = this.getState();
    const events = [...this.auditLog];
    return {
      available: true,
      installedAt: this.auditInstalledAt,
      speechAvailable: this.speechAvailable,
      settings: state.settings,
      lastSpoken: state.lastSpoken,
      lastNormalized: state.lastNormalized,
      voiceAssignments: state.browserVoices.assignments,
      music: state.music,
      ambient: state.ambient,
      interactionCues: state.interactionCues,
      events,
      eventCounts: events.reduce((counts, event) => {
        counts[event.type] = (counts[event.type] || 0) + 1;
        return counts;
      }, {}),
      errors: [...this.errors],
    };
  }

  getState() {
    return {
      speechAvailable: this.speechAvailable,
      settings: { ...this.settings },
      speaking: this.speaking,
      lastSpoken: this.lastSpoken,
      lastNormalized: this.lastNormalized,
      voices: this.voiceRegistry.getState(),
      browserVoices: {
        count: this.voiceCache.length,
        assignments: this.voiceAssignments,
      },
      music: this.musicSystem.getState(),
      ambient: {
        enabled: this.settings.ambientEnabled,
        state: this.ambientState,
      },
      interactionCues: {
        enabled: this.settings.interactionCuesEnabled,
        log: this.cueLog,
      },
      errors: this.errors,
    };
  }
}
