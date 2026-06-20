export const NPC_VOICE_PROFILES = {
  narrator: {
    voiceId: 'narrator',
    displayName: 'Narrator',
    rate: 0.92,
    pitch: 1.0,
    language: 'en-US',
    tone: 'clear, friendly scene narration',
    fallbackVoice: 'default',
    legacyNpcId: 'narrator',
    gender: 'default',
    voiceHints: ['natural', 'aria', 'jenny', 'samantha'],
    accessibilityNotes: 'Reads scene panels aloud; clear, slightly slower pacing.',
  },
  zuzu: {
    voiceId: 'zuzu',
    displayName: 'Zuzu',
    rate: 0.98,
    pitch: 1.08,
    language: 'en-US',
    tone: 'curious, bright, grounded',
    fallbackVoice: 'default',
    legacyNpcId: 'zuzu',
    gender: 'default',
    voiceHints: [],
    accessibilityNotes: 'Use clear pacing; never baby-talk.',
  },
  dex: {
    voiceId: 'dex',
    displayName: 'Dex',
    aliases: ['Dex'],
    rate: 1.16,
    pitch: 1.34,
    language: 'en-US',
    tone: 'bratty, cocky, fast-talking BMX kid; snotty bravado over caution',
    fallbackVoice: 'default',
    legacyNpcId: 'dex',
    gender: 'default',
    voiceHints: ['guy', 'eric', 'male', 'man'],
    accessibilityNotes: 'Higher, quicker, snottier than the others (bratty rival energy) — but still playful, never mean or a bully.',
  },
  garage_mentor: {
    voiceId: 'garage_mentor',
    displayName: 'Mr. Chen',
    aliases: ['Mr. Chen'],
    rate: 0.88,
    pitch: 0.92,
    language: 'en-US',
    tone: 'calm mentor, precise and warm',
    fallbackVoice: 'adult-low',
    legacyNpcId: 'mr_chen',
    gender: 'male',
    voiceHints: ['guy', 'david', 'mark', 'daniel', 'james', 'alex', 'male', 'man'],
    accessibilityNotes: 'Slightly slower for instructions and evidence framing.',
  },
  neighbor: {
    voiceId: 'neighbor',
    displayName: 'Mrs. Ramirez',
    aliases: ['Mrs. Ramirez'],
    rate: 0.93,
    pitch: 1.04,
    language: 'en-US',
    tone: 'neighborly, warm, encouraging',
    fallbackVoice: 'adult-warm',
    legacyNpcId: 'mrs_ramirez',
    gender: 'female',
    voiceHints: ['jenny', 'zira', 'samantha', 'karen', 'victoria', 'aria', 'female', 'woman'],
    accessibilityNotes: 'Warm but not exaggerated; Spanish phrases remain contextual.',
  },
  spanish_neighbor: {
    voiceId: 'spanish_neighbor',
    displayName: 'Mrs. Ramirez',
    aliases: ['Spanish-speaking NPC'],
    rate: 0.9,
    pitch: 1.03,
    language: 'es-US',
    tone: 'warm Spanish-context greeting',
    fallbackVoice: 'neighbor',
    legacyNpcId: 'mrs_ramirez',
    gender: 'female',
    voiceHints: ['sabina', 'paloma', 'paulina', 'monica', 'spanish', 'español', 'jenny', 'zira'],
    accessibilityNotes: 'Use Spanish language routing when available; subtitles always include meaning.',
  },
  arabic_mentor: {
    voiceId: 'arabic_mentor',
    displayName: 'Auntie Mariam',
    aliases: ['Auntie Mariam'],
    rate: 0.87,
    pitch: 0.98,
    language: 'ar',
    tone: 'gentle family mentor, steady and caring',
    fallbackVoice: 'adult-warm',
    legacyNpcId: 'auntie_mariam',
    gender: 'female',
    voiceHints: ['hoda', 'naayf', 'arabic', 'ar', 'female', 'woman'],
    accessibilityNotes: 'Use Arabic routing if available; keep phrases short and relationship-based.',
  },
  ecology_sign: {
    voiceId: 'ecology_sign',
    displayName: 'Desert Helper Sign',
    aliases: ['Desert Helper Sign', 'Bridge Sign', 'Map Gate'],
    rate: 0.82,
    pitch: 0.96,
    language: 'en-US',
    tone: 'clear field-guide narration',
    fallbackVoice: 'default',
    legacyNpcId: 'field_guide_sign',
    gender: 'default',
    voiceHints: ['natural', 'aria', 'jenny'],
    accessibilityNotes: 'Slightly slower for observation and safety cues.',
  },
  trader: {
    voiceId: 'trader',
    displayName: 'Local Trader',
    aliases: ['Local Trader'],
    rate: 0.95,
    pitch: 0.97,
    language: 'en-US',
    tone: 'practical, friendly, concise',
    fallbackVoice: 'adult-low',
    legacyNpcId: 'local_trader',
    gender: 'male',
    voiceHints: ['guy', 'david', 'mark', 'daniel', 'male', 'man'],
    accessibilityNotes: 'Keep buying/material lines short and concrete.',
  },
};

const SPEAKER_TO_VOICE = Object.values(NPC_VOICE_PROFILES).reduce((map, profile) => {
  if (!map[profile.displayName]) map[profile.displayName] = profile.voiceId;
  for (const alias of profile.aliases || []) {
    if (!map[alias]) map[alias] = profile.voiceId;
  }
  return map;
}, {});

export class NPCVoiceRegistry {
  constructor(profiles = NPC_VOICE_PROFILES) {
    this.profiles = profiles;
  }

  resolveVoiceId(input) {
    if (!input) return 'zuzu';
    if (this.profiles[input]) return input;
    return SPEAKER_TO_VOICE[input] || 'zuzu';
  }

  getProfile(input) {
    return this.profiles[this.resolveVoiceId(input)] || this.profiles.zuzu;
  }

  getState() {
    return {
      profiles: Object.fromEntries(Object.entries(this.profiles).map(([id, profile]) => [id, { ...profile }])),
      speakerMap: { ...SPEAKER_TO_VOICE },
    };
  }
}
