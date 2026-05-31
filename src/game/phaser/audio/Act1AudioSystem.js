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
    };
    this.speechAvailable = typeof window !== 'undefined' && 'speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined';
    this.currentUtterance = null;
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

    if (!this.settings.speechEnabled || !this.speechAvailable || !normalized) {
      this.lastSpoken = { text, normalized, voiceId: profile.voiceId, skipped: true };
      this.recordAudit('speech_skipped', {
        voiceId: profile.voiceId,
        reason: this.speechAvailable ? 'speech_disabled' : 'speech_unavailable',
        normalized,
      });
      return { ok: false, reason: this.speechAvailable ? 'speech_disabled' : 'speech_unavailable', normalized, voice: profile };
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

  autoSpeakLine(line) {
    if (!this.settings.autoSpeak || !line?.text) return { ok: false, reason: 'auto_speak_disabled' };
    return this.speakLine(line.text, line.voiceId || line.speaker, {
      language: line.language,
      emotion: line.emotion,
    });
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
