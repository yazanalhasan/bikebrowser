# Voice Profile Schema

## Goal

Provide the lightest possible data shape for subtle NPC voice identity.

The schema supports only:

- `pitch`
- `rate`
- optional `voiceHint`
- optional `tone`

It should not become a performance system.

## Recommended File

`BikeBrowserWorld/Data/audio/voice_profiles.json`

## Shape

```json
{
  "default": {
    "pitch": 1.0,
    "rate": 0.95,
    "voiceHint": "neutral",
    "tone": "calm"
  },
  "speakers": {
    "Mrs. Ramirez": {
      "pitch": 1.08,
      "rate": 0.98,
      "voiceHint": "warm feminine",
      "tone": "warm_practical"
    }
  }
}
```

## Field Rules

`pitch`:

- Required.
- Numeric.
- Recommended restrained range: `0.88` to `1.12`.
- Values outside `0.84` to `1.16` should fail validation unless explicitly approved.

`rate`:

- Required.
- Numeric.
- Recommended restrained range: `0.88` to `1.02`.
- Values outside `0.84` to `1.08` should fail validation unless explicitly approved.

`voiceHint`:

- Optional.
- Human-readable hint for future platform voice selection.
- Should not be required by runtime.
- Examples: `warm feminine`, `older thoughtful`, `measured`, `light casual`.

`tone`:

- Optional.
- Small emotional tag for audit and review.
- Should not drive complex runtime behavior.
- Examples: `thoughtful`, `warm_practical`, `measured`, `calm_outdoors`, `light_casual`.

## Current Speaker Profile Draft

```json
{
  "default": {
    "pitch": 1.0,
    "rate": 0.95,
    "voiceHint": "neutral grounded",
    "tone": "calm"
  },
  "speakers": {
    "Mr. Chen": {
      "pitch": 0.86,
      "rate": 0.88,
      "voiceHint": "older thoughtful",
      "tone": "thoughtful"
    },
    "Mrs. Ramirez": {
      "pitch": 1.08,
      "rate": 0.98,
      "voiceHint": "warm feminine",
      "tone": "warm_practical"
    },
    "Ranger Nita": {
      "pitch": 1.03,
      "rate": 0.94,
      "voiceHint": "calm outdoors",
      "tone": "calm_outdoors"
    },
    "Dr. Maya": {
      "pitch": 1.02,
      "rate": 0.91,
      "voiceHint": "measured thoughtful",
      "tone": "measured"
    },
    "Old Miner Pete": {
      "pitch": 0.9,
      "rate": 0.86,
      "voiceHint": "older grounded",
      "tone": "unhurried"
    },
    "Zevon": {
      "pitch": 1.0,
      "rate": 0.96,
      "voiceHint": "warm curious",
      "tone": "curious"
    },
    "Jacob": {
      "pitch": 0.96,
      "rate": 0.94,
      "voiceHint": "steady practical",
      "tone": "steady"
    },
    "Charlie": {
      "pitch": 1.06,
      "rate": 1.0,
      "voiceHint": "bright calm",
      "tone": "bright"
    },
    "Cole": {
      "pitch": 0.98,
      "rate": 0.93,
      "voiceHint": "calm direct",
      "tone": "direct"
    },
    "James": {
      "pitch": 0.95,
      "rate": 0.92,
      "voiceHint": "measured workshop",
      "tone": "measured"
    }
  }
}
```

## Runtime Resolution Rules

1. Resolve by exact speaker display name.
2. If unavailable, resolve by NPC id if passed through later.
3. If still unavailable, use `default`.
4. Never fail dialogue playback because a profile is missing.
5. Log missing profile only in validation or debug contexts, not as a disruptive runtime error.

## Validation Rules

Validation should confirm:

- `default` exists.
- Every profile has numeric `pitch` and `rate`.
- Current dialogue speakers resolve to a profile.
- Mrs. Ramirez and Mr. Chen do not resolve to identical pitch/rate pairs.
- All pitch/rate values remain within restrained bounds.

## Non-Goals

Do not add:

- mood blending
- per-line acting direction
- accent simulation
- gender inference
- dynamic emotional performance
- external voice generation dependencies
