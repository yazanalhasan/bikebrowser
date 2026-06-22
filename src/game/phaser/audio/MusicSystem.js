export const MUSIC_STATES = {
  neighborhood: {
    key: 'neighborhood',
    label: 'Neighborhood exploration',
    track: '/game/audio/music/neighborhood_hybrid_ride.ogg',
    volume: 0.22,
  },
  garage: {
    key: 'garage',
    label: 'Garage/workbench',
    track: '/game/audio/music/garage_warm_oud.ogg',
    volume: 0.2,
  },
  bridge_problem: {
    key: 'bridge_problem',
    label: 'Bridge problem discovery',
    track: '/game/audio/music/quest_focus_hybrid.ogg',
    volume: 0.18,
  },
  utm_testing: {
    key: 'utm_testing',
    label: 'UTM testing',
    track: '/game/audio/music/quest_focus_hybrid.ogg',
    volume: 0.16,
  },
  ecology_chemistry: {
    key: 'ecology_chemistry',
    label: 'Ecology and chemistry exploration',
    track: '/game/audio/music/warm_hands_quiet_gears.mp3',
    volume: 0.18,
  },
  map_unlock: {
    key: 'map_unlock',
    label: 'Wider world tease',
    track: '/game/audio/music/qanun_jar_lid.mp3',
    volume: 0.2,
  },
};

export class MusicSystem {
  constructor() {
    this.currentState = null;
    this.previousState = null;
    this.unlocked = false;
    this.enabled = true;
    this.reducedAudio = false;
    this.volume = 0.22;
    this.transitionLog = [];
    this.audioElement = null;
  }

  unlock() {
    this.unlocked = true;
    // A track is often selected (transitionTo) before the first user gesture, while
    // autoplay is still blocked — so startElement was skipped. Now that we're
    // unlocked, actually begin playing the already-selected track. Without this the
    // music stays silent forever because unlockAudio() won't re-transition when a
    // currentState already exists.
    if (this.enabled && this.currentState && typeof Audio !== 'undefined') {
      this.startElement(MUSIC_STATES[this.currentState] || MUSIC_STATES.neighborhood);
    }
    return { ok: true, unlocked: true };
  }

  transitionTo(stateKey) {
    const state = MUSIC_STATES[stateKey] || MUSIC_STATES.neighborhood;
    this.previousState = this.currentState;
    this.currentState = state.key;
    this.volume = this.reducedAudio ? 0.08 : state.volume;
    this.transitionLog.push({ state: state.key, label: state.label, at: new Date().toISOString() });
    this.transitionLog = this.transitionLog.slice(-20);

    if (this.unlocked && this.enabled && typeof Audio !== 'undefined') {
      this.startElement(state);
    }
    return { ok: true, state: state.key, label: state.label };
  }

  startElement(state) {
    try {
      if (!this.audioElement) this.audioElement = new Audio();
      if (!this.audioElement.src.endsWith(state.track)) this.audioElement.src = state.track;
      this.audioElement.loop = true;
      this.audioElement.volume = this.volume;
      this.audioElement.play?.().catch?.(() => {});
    } catch {
      // Browser support varies; state still remains inspectable.
    }
  }

  suspend() {
    this.audioElement?.pause?.();
    return { ok: true };
  }

  resume() {
    if (this.unlocked && this.enabled && this.audioElement) this.audioElement.play?.().catch?.(() => {});
    return { ok: true };
  }

  setSettings(settings = {}) {
    if (typeof settings.musicEnabled === 'boolean') this.enabled = settings.musicEnabled;
    if (typeof settings.reducedAudio === 'boolean') this.reducedAudio = settings.reducedAudio;
    if (this.audioElement) this.audioElement.volume = this.reducedAudio ? 0.08 : this.volume;
  }

  getState() {
    return {
      unlocked: this.unlocked,
      enabled: this.enabled,
      reducedAudio: this.reducedAudio,
      currentState: this.currentState,
      previousState: this.previousState,
      volume: this.volume,
      availableStates: MUSIC_STATES,
      transitionLog: this.transitionLog,
    };
  }
}
