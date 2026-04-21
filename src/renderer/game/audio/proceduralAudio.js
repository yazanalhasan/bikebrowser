/**
 * proceduralAudio.js — Synthesized fallback sounds using Web Audio API.
 *
 * When real .ogg/.mp3 files aren't available, AudioManager calls these
 * generators to create AudioBuffers on the fly. Every sound is original,
 * kid-safe, and pleasant.
 *
 * Each generator receives an AudioContext and returns an AudioBuffer.
 */

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Render an offline graph to an AudioBuffer. */
async function render(ctx, duration, sampleRate, buildGraph) {
  const sr = sampleRate || ctx.sampleRate;
  const offline = new OfflineAudioContext(1, Math.ceil(sr * duration), sr);
  buildGraph(offline, duration);
  return offline.startRendering();
}

/** Simple ADSR envelope gain node. */
function adsr(ctx, t0, a, d, s, r, duration) {
  const g = ctx.createGain();
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(1, t0 + a);
  g.gain.linearRampToValueAtTime(s, t0 + a + d);
  g.gain.setValueAtTime(s, t0 + duration - r);
  g.gain.linearRampToValueAtTime(0, t0 + duration);
  return g;
}

/** Play a note (osc → gain → dest) inside an offline context. */
function note(ctx, freq, start, dur, type = 'sine', vol = 0.3) {
  const osc = ctx.createOscillator();
  osc.type = type;
  osc.frequency.value = freq;
  const env = adsr(ctx, start, 0.01, 0.05, vol, 0.05, dur);
  osc.connect(env);
  env.connect(ctx.destination);
  osc.start(start);
  osc.stop(start + dur);
}

// Frequency helper — maqam-flavored intervals
const A4 = 440;
const semitone = (n) => A4 * Math.pow(2, n / 12);
// Hijaz-flavored scale from D4: D Eb F# G A Bb C D
const hijaz = [293.66, 311.13, 369.99, 392.00, 440.00, 466.16, 523.25, 587.33];
// Bayati-flavored scale from D4: D E♭↓ F G A B♭ C D
const bayati = [293.66, 315, 349.23, 392.00, 440.00, 466.16, 523.25, 587.33];
// Nahawand from C4: C D Eb F G Ab Bb C
const nahawand = [261.63, 293.66, 311.13, 349.23, 392.00, 415.30, 466.16, 523.25];
// Rast from C4: C D E↓ F G A B↓ C
const rast = [261.63, 293.66, 330, 349.23, 392.00, 440.00, 494, 523.25];

// ---------------------------------------------------------------------------
// Music generators — short loops ~4-8 seconds, designed to tile
// ---------------------------------------------------------------------------

const MUSIC_GENERATORS = {
  /** Modern playful garage groove */
  async garage_theme(ctx) {
    return render(ctx, 8, null, (oc, dur) => {
      // Upbeat bass line
      const bass = [261.63, 261.63, 220, 220, 246.94, 246.94, 293.66, 261.63];
      bass.forEach((f, i) => note(oc, f, i * 0.5, 0.45, 'triangle', 0.25));
      // Cheerful melody
      const mel = [523.25, 587.33, 659.25, 587.33, 523.25, 493.88, 523.25, 587.33];
      mel.forEach((f, i) => note(oc, f, i * 0.5 + 0.25, 0.2, 'sine', 0.15));
      // Light hi-hat tick (noise substitute with high osc)
      for (let i = 0; i < 16; i++) {
        note(oc, 8000, i * 0.25, 0.03, 'square', 0.04);
      }
    });
  },

  /** Modern neighborhood riding groove */
  async neighborhood_day(ctx) {
    return render(ctx, 8, null, (oc) => {
      // Driving bass
      const bass = [196, 220, 246.94, 220, 196, 220, 261.63, 246.94];
      bass.forEach((f, i) => note(oc, f, i * 0.5, 0.45, 'triangle', 0.25));
      // Energetic melody
      const mel = [392, 440, 523.25, 587.33, 523.25, 440, 392, 440];
      mel.forEach((f, i) => note(oc, f, i * 0.5 + 0.12, 0.35, 'sine', 0.18));
      // Driving rhythm
      for (let i = 0; i < 16; i++) {
        note(oc, 6000, i * 0.25, 0.02, 'square', 0.05);
        if (i % 4 === 0) note(oc, 80, i * 0.25, 0.15, 'sine', 0.2);
      }
    });
  },

  /** Quest focus — lighter, pulsing */
  async quest_active(ctx) {
    return render(ctx, 8, null, (oc) => {
      const bass = [220, 220, 196, 196, 220, 220, 246.94, 220];
      bass.forEach((f, i) => note(oc, f, i * 0.5, 0.4, 'sine', 0.15));
      // Soft plucks
      const mel = [440, 523.25, 440, 392, 440, 523.25, 587.33, 523.25];
      mel.forEach((f, i) => note(oc, f, i * 0.5 + 0.25, 0.15, 'triangle', 0.12));
    });
  },

  /** Arabic-inspired warm oud + percussion — garage */
  async garage_warm_oud(ctx) {
    return render(ctx, 8, null, (oc) => {
      // Oud-like plucked motif using bayati scale
      const motif = [bayati[0], bayati[2], bayati[3], bayati[4], bayati[3], bayati[2], bayati[0], bayati[4]];
      motif.forEach((f, i) => {
        note(oc, f, i * 0.5, 0.4, 'triangle', 0.22);
        // Soft harmonic overtone
        note(oc, f * 2, i * 0.5, 0.15, 'sine', 0.06);
      });
      // Light darbuka pattern
      for (let i = 0; i < 8; i++) {
        const t = i * 0.5;
        note(oc, 90, t, 0.08, 'sine', 0.2);        // dum
        note(oc, 300, t + 0.25, 0.04, 'square', 0.06); // tek
        note(oc, 300, t + 0.375, 0.04, 'square', 0.04); // ka
      }
      // Warm pad drone
      note(oc, bayati[0] / 2, 0, 8, 'sine', 0.08);
    });
  },

  /** Arabic-inspired desert discovery — spacious, mysterious */
  async desert_discovery(ctx) {
    return render(ctx, 8, null, (oc) => {
      // Nay-like melody (hijaz scale, breathy sine)
      const mel = [hijaz[0], hijaz[3], hijaz[4], hijaz[5], hijaz[4], hijaz[3], hijaz[1], hijaz[0]];
      mel.forEach((f, i) => {
        note(oc, f, i * 0.8, 0.7, 'sine', 0.18);
        // Breathy shimmer
        note(oc, f * 1.002, i * 0.8 + 0.02, 0.6, 'sine', 0.06);
      });
      // Deep drone
      note(oc, hijaz[0] / 2, 0, 8, 'sine', 0.1);
      // Sparse plucked strings
      [0, 2, 4, 6].forEach((i) => {
        note(oc, hijaz[i % hijaz.length] / 2, i * 1.0 + 0.5, 0.3, 'triangle', 0.08);
      });
    });
  },

  /** Hybrid neighborhood ride — modern rhythm + Arabic melodic colors */
  async neighborhood_hybrid_ride(ctx) {
    return render(ctx, 8, null, (oc) => {
      // Modern driving bass
      const bass = [rast[0], rast[0], rast[4], rast[4], rast[3], rast[3], rast[0], rast[4]];
      bass.forEach((f, i) => note(oc, f / 2, i * 0.5, 0.45, 'triangle', 0.22));
      // Arabic-flavored melody on rast
      const mel = [rast[4], rast[5], rast[7], rast[6], rast[5], rast[4], rast[3], rast[4]];
      mel.forEach((f, i) => note(oc, f, i * 0.5 + 0.12, 0.35, 'sine', 0.16));
      // Modern kick + hi-hat
      for (let i = 0; i < 16; i++) {
        note(oc, 7000, i * 0.25, 0.02, 'square', 0.04);
        if (i % 4 === 0) note(oc, 70, i * 0.25, 0.12, 'sine', 0.18);
        if (i % 4 === 2) note(oc, 200, i * 0.25, 0.05, 'square', 0.08);
      }
    });
  },

  /** Hybrid quest focus — light pulse + melodic fragments */
  async quest_focus_hybrid(ctx) {
    return render(ctx, 8, null, (oc) => {
      // Gentle pulse (nahawand flavored)
      const bass = [nahawand[0], nahawand[0], nahawand[4], nahawand[3]];
      bass.forEach((f, i) => note(oc, f / 2, i * 1.0, 0.9, 'sine', 0.12));
      // Melodic fragments
      const mel = [nahawand[4], nahawand[5], nahawand[4], nahawand[2], nahawand[3], nahawand[4]];
      mel.forEach((f, i) => note(oc, f, i * 0.7 + 0.3, 0.5, 'triangle', 0.1));
    });
  },
};

// ---------------------------------------------------------------------------
// Stinger generators — short 1-3 second cues
// ---------------------------------------------------------------------------

const STINGER_GENERATORS = {
  /** Celebratory quest complete — bright ascending */
  async reward_stinger(ctx) {
    return render(ctx, 1.5, null, (oc) => {
      const notes = [523.25, 659.25, 783.99, 1046.50];
      notes.forEach((f, i) => note(oc, f, i * 0.15, 0.4, 'sine', 0.25));
      notes.forEach((f, i) => note(oc, f * 1.5, i * 0.15 + 0.05, 0.3, 'triangle', 0.08));
    });
  },

  /** Upgrade unlock — exciting burst */
  async upgrade_unlock(ctx) {
    return render(ctx, 1.2, null, (oc) => {
      const notes = [440, 554.37, 659.25, 880];
      notes.forEach((f, i) => note(oc, f, i * 0.12, 0.35, 'square', 0.12));
      note(oc, 880, 0.5, 0.6, 'sine', 0.2);
    });
  },

  /** Arabic-inspired reward — qanun/oud sparkle */
  async reward_tarabi_stinger(ctx) {
    return render(ctx, 2.0, null, (oc) => {
      // Ascending hijaz run
      hijaz.forEach((f, i) => {
        note(oc, f, i * 0.12, 0.5, 'triangle', 0.2);
        note(oc, f * 2, i * 0.12 + 0.06, 0.3, 'sine', 0.08);
      });
      // Bright final chord
      note(oc, hijaz[4], 1.0, 0.8, 'sine', 0.18);
      note(oc, hijaz[6], 1.0, 0.8, 'sine', 0.12);
      note(oc, hijaz[7], 1.0, 0.8, 'triangle', 0.1);
    });
  },

  /** Hybrid upgrade unlock — mechanical + Arabic ornament */
  async upgrade_unlock_hybrid(ctx) {
    return render(ctx, 1.5, null, (oc) => {
      // Mechanical rising hit
      [261.63, 329.63, 392, 523.25].forEach((f, i) => {
        note(oc, f, i * 0.1, 0.3, 'square', 0.1);
      });
      // Arabic ornamental run
      [rast[4], rast[5], rast[6], rast[7]].forEach((f, i) => {
        note(oc, f, 0.5 + i * 0.1, 0.4, 'triangle', 0.15);
      });
      note(oc, rast[7], 0.9, 0.5, 'sine', 0.2);
    });
  },
};

// ---------------------------------------------------------------------------
// Ambient generators — 4-6 second textural loops
// ---------------------------------------------------------------------------

const AMBIENT_GENERATORS = {
  /** Neighborhood — soft chirps and breeze feel */
  async neighborhood_ambience(ctx) {
    return render(ctx, 6, null, (oc) => {
      // Wind-like low rumble
      note(oc, 120, 0, 6, 'sine', 0.04);
      note(oc, 125, 0, 6, 'sine', 0.03);
      // Distant bird-like chirps
      [0.5, 1.8, 3.1, 4.4].forEach((t) => {
        note(oc, 2000 + Math.random() * 500, t, 0.08, 'sine', 0.03);
        note(oc, 2200 + Math.random() * 400, t + 0.1, 0.06, 'sine', 0.02);
      });
    });
  },

  /** Garage — subtle hum */
  async garage_ambience(ctx) {
    return render(ctx, 6, null, (oc) => {
      note(oc, 60, 0, 6, 'sine', 0.04);
      note(oc, 120, 0, 6, 'sine', 0.02);
      // Faint metallic ping
      [1.5, 3.5].forEach((t) => {
        note(oc, 1200, t, 0.15, 'triangle', 0.015);
      });
    });
  },

  /** Desert wind */
  async desert_wind(ctx) {
    return render(ctx, 6, null, (oc) => {
      note(oc, 90, 0, 6, 'sine', 0.05);
      note(oc, 95, 0.5, 5.5, 'sine', 0.03);
      note(oc, 180, 1, 4, 'sine', 0.015);
    });
  },
};

// ---------------------------------------------------------------------------
// SFX generators — short <0.5s one-shots
// ---------------------------------------------------------------------------

const SFX_GENERATORS = {
  // -- UI --
  async ui_hover(ctx) {
    return render(ctx, 0.1, null, (oc) => note(oc, 1200, 0, 0.08, 'sine', 0.1));
  },
  async ui_tap(ctx) {
    return render(ctx, 0.15, null, (oc) => {
      note(oc, 800, 0, 0.06, 'square', 0.15);
      note(oc, 1200, 0.03, 0.06, 'sine', 0.1);
    });
  },
  async ui_panel_open(ctx) {
    return render(ctx, 0.2, null, (oc) => {
      note(oc, 400, 0, 0.15, 'triangle', 0.15);
      note(oc, 600, 0.05, 0.12, 'sine', 0.1);
    });
  },
  async ui_panel_close(ctx) {
    return render(ctx, 0.2, null, (oc) => {
      note(oc, 600, 0, 0.12, 'triangle', 0.12);
      note(oc, 400, 0.05, 0.1, 'sine', 0.08);
    });
  },
  async ui_notebook_open(ctx) {
    return render(ctx, 0.25, null, (oc) => {
      note(oc, 500, 0, 0.1, 'triangle', 0.12);
      note(oc, 700, 0.08, 0.12, 'sine', 0.1);
      note(oc, 900, 0.15, 0.08, 'sine', 0.06);
    });
  },
  async ui_quest_accept(ctx) {
    return render(ctx, 0.4, null, (oc) => {
      note(oc, 523.25, 0, 0.15, 'sine', 0.2);
      note(oc, 659.25, 0.12, 0.15, 'sine', 0.2);
      note(oc, 783.99, 0.25, 0.12, 'sine', 0.15);
    });
  },
  async ui_quest_complete(ctx) {
    return render(ctx, 0.5, null, (oc) => {
      [523.25, 587.33, 659.25, 783.99].forEach((f, i) => {
        note(oc, f, i * 0.1, 0.2, 'sine', 0.18);
      });
    });
  },
  async ui_error(ctx) {
    return render(ctx, 0.3, null, (oc) => {
      note(oc, 200, 0, 0.12, 'square', 0.15);
      note(oc, 150, 0.12, 0.15, 'square', 0.12);
    });
  },
  async ui_success(ctx) {
    return render(ctx, 0.3, null, (oc) => {
      note(oc, 600, 0, 0.12, 'sine', 0.18);
      note(oc, 800, 0.1, 0.15, 'sine', 0.15);
    });
  },

  // -- Bike / Mechanic --
  async wheel_roll(ctx) {
    return render(ctx, 1, null, (oc) => {
      for (let i = 0; i < 20; i++) note(oc, 300 + Math.random() * 100, i * 0.05, 0.04, 'triangle', 0.05);
    });
  },
  async gravel_roll(ctx) {
    return render(ctx, 1, null, (oc) => {
      for (let i = 0; i < 25; i++) note(oc, 500 + Math.random() * 300, i * 0.04, 0.03, 'square', 0.03);
    });
  },
  async bike_stop(ctx) {
    return render(ctx, 0.3, null, (oc) => {
      note(oc, 400, 0, 0.25, 'triangle', 0.12);
    });
  },
  async brake_tap(ctx) {
    return render(ctx, 0.15, null, (oc) => {
      note(oc, 2000, 0, 0.1, 'square', 0.08);
    });
  },
  async chain_click(ctx) {
    return render(ctx, 0.1, null, (oc) => {
      note(oc, 1500, 0, 0.05, 'square', 0.1);
      note(oc, 1800, 0.03, 0.04, 'triangle', 0.06);
    });
  },
  async freewheel_tick(ctx) {
    return render(ctx, 0.1, null, (oc) => {
      note(oc, 3000, 0, 0.03, 'square', 0.06);
    });
  },
  async tire_pump(ctx) {
    return render(ctx, 0.4, null, (oc) => {
      note(oc, 150, 0, 0.15, 'sine', 0.2);
      note(oc, 400, 0.15, 0.2, 'triangle', 0.1);
    });
  },
  async patch_apply(ctx) {
    return render(ctx, 0.3, null, (oc) => {
      note(oc, 500, 0, 0.2, 'triangle', 0.1);
      note(oc, 300, 0.1, 0.15, 'sine', 0.08);
    });
  },
  async wrench_turn(ctx) {
    return render(ctx, 0.35, null, (oc) => {
      note(oc, 250, 0, 0.1, 'square', 0.1);
      note(oc, 350, 0.1, 0.1, 'square', 0.08);
      note(oc, 280, 0.2, 0.1, 'triangle', 0.06);
    });
  },
  async ratchet_click(ctx) {
    return render(ctx, 0.1, null, (oc) => {
      note(oc, 2000, 0, 0.04, 'square', 0.1);
      note(oc, 2500, 0.04, 0.03, 'square', 0.06);
    });
  },
  async toolbox_open(ctx) {
    return render(ctx, 0.3, null, (oc) => {
      note(oc, 300, 0, 0.15, 'triangle', 0.12);
      note(oc, 800, 0.1, 0.1, 'triangle', 0.06);
    });
  },
  async toolbox_close(ctx) {
    return render(ctx, 0.25, null, (oc) => {
      note(oc, 700, 0, 0.1, 'triangle', 0.1);
      note(oc, 250, 0.08, 0.15, 'triangle', 0.08);
    });
  },
  async item_pickup(ctx) {
    return render(ctx, 0.3, null, (oc) => {
      note(oc, 800, 0, 0.1, 'sine', 0.2);
      note(oc, 1200, 0.08, 0.15, 'sine', 0.15);
    });
  },
  async upgrade_install(ctx) {
    return render(ctx, 0.4, null, (oc) => {
      note(oc, 400, 0, 0.1, 'square', 0.1);
      note(oc, 600, 0.08, 0.1, 'sine', 0.15);
      note(oc, 900, 0.2, 0.15, 'sine', 0.12);
    });
  },

  // -- World --
  async footstep(ctx) {
    return render(ctx, 0.12, null, (oc) => {
      note(oc, 200 + Math.random() * 60, 0, 0.1, 'triangle', 0.08);
    });
  },
  async interaction_ping(ctx) {
    return render(ctx, 0.3, null, (oc) => {
      note(oc, 1000, 0, 0.08, 'sine', 0.18);
      note(oc, 1500, 0.1, 0.15, 'sine', 0.1);
    });
  },
  async object_inspect(ctx) {
    return render(ctx, 0.25, null, (oc) => {
      note(oc, 700, 0, 0.1, 'triangle', 0.12);
      note(oc, 1000, 0.08, 0.12, 'sine', 0.08);
    });
  },
  async door_interact(ctx) {
    return render(ctx, 0.35, null, (oc) => {
      note(oc, 200, 0, 0.2, 'triangle', 0.15);
      note(oc, 150, 0.15, 0.15, 'sine', 0.1);
    });
  },
  async collectible_pickup(ctx) {
    return render(ctx, 0.35, null, (oc) => {
      note(oc, 900, 0, 0.1, 'sine', 0.2);
      note(oc, 1200, 0.08, 0.12, 'sine', 0.15);
      note(oc, 1600, 0.18, 0.12, 'sine', 0.1);
    });
  },
  async checkpoint_ping(ctx) {
    return render(ctx, 0.4, null, (oc) => {
      note(oc, 800, 0, 0.12, 'sine', 0.18);
      note(oc, 1000, 0.1, 0.12, 'sine', 0.15);
      note(oc, 1200, 0.2, 0.15, 'sine', 0.12);
    });
  },
};

// ---------------------------------------------------------------------------
// Unified lookup — merges all generator maps
// ---------------------------------------------------------------------------
const ALL_GENERATORS = {
  ...MUSIC_GENERATORS,
  ...STINGER_GENERATORS,
  ...AMBIENT_GENERATORS,
  ...SFX_GENERATORS,
};

/**
 * Generate a procedural AudioBuffer for the given key.
 * Returns null if no generator exists for this key.
 *
 * @param {AudioContext} ctx — the live AudioContext
 * @param {string} key — the audio asset key
 * @returns {Promise<AudioBuffer|null>}
 */
export async function generateProceduralSound(ctx, key) {
  const gen = ALL_GENERATORS[key];
  if (!gen) return null;
  try {
    return await gen(ctx);
  } catch (e) {
    console.warn(`[ProceduralAudio] Failed to generate "${key}":`, e);
    return null;
  }
}

/** Check if a procedural generator exists for a given key. */
export function hasProceduralSound(key) {
  return key in ALL_GENERATORS;
}
