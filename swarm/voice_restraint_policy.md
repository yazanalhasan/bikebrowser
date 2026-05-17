# Voice Restraint Policy

## Core Principle

Voice identity should make characters feel emotionally familiar, not theatrical.

The project is a warm dusk BMX neighborhood experience. TTS should support calmness, readability, and human warmth without becoming a new source of stimulation.

## Voice Direction

Voices should feel:

- grounded
- subtle
- warm
- calm
- neighborhood-scale
- emotionally safe

Voices should avoid:

- cartoon pitch shifts
- novelty voices
- dramatic performance
- exaggerated age or gender coding
- rapid delivery
- loudness as personality
- comic contrast between characters

## Character Restraint Notes

Mr. Chen:

- Lower and slower.
- Thoughtful, patient, repair-focused.
- Should feel like someone who listens before speaking.

Mrs. Ramirez:

- Warm, practical, lightly energetic.
- Should feel active and encouraging without sounding chipper or exaggerated.
- Her distinction should come from warmth and tempo, not a cartoon pitch jump.

Ranger Nita:

- Calm outdoors energy.
- Slightly open and steady.
- Should feel observant, not adventurous in a loud way.

Dr. Maya:

- Measured and thoughtful.
- Slightly slower and clear.
- Should feel scientific without sounding cold.

Old Miner Pete:

- Older, grounded, unhurried.
- Avoid rough caricature.
- Warmth matters more than grit.

Neighbor Kid or childlike speakers:

- Casual and light.
- Avoid squeaky or comedic child voices.
- Keep pitch changes modest.

Garage NPCs:

- Zevon, Jacob, Charlie, Cole, and James should remain subtle.
- Their profiles should differentiate rhythm and warmth more than pitch.
- The garage already has high density, so voice should not add more intensity.

## Fallback Policy

Unknown speakers should use a calm grounded fallback:

- pitch near neutral
- rate slightly relaxed
- no exaggerated affect
- no runtime failure

Fallback is acceptable for prototypes, narration, and temporary speakers. It is not acceptable for core recurring NPCs once they appear in the first 15 minutes.

## Overcorrection Risks

Danger signs:

- Mrs. Ramirez becomes noticeably “performed.”
- NPCs sound like categories rather than people.
- Pitch/rate differences draw attention to the TTS system.
- Voice becomes louder emotionally than the scene.
- Dialogue feels like a feature demo instead of a neighbor talking.

If a profile calls attention to itself, reduce it.

## Approval Rule

Any voice profile outside these broad bounds requires explicit convergence review:

- pitch below `0.84`
- pitch above `1.16`
- rate below `0.84`
- rate above `1.08`

The preferred range is narrower:

- pitch `0.88` to `1.12`
- rate `0.88` to `1.02`

## Validation Checklist

Before merge:

- Mrs. Ramirez and Mr. Chen resolve differently.
- Every active dialogue speaker has a profile or intentional fallback.
- Unknown fallback remains calm.
- No voice profile feels like a joke.
- No voice profile increases scene stimulation.
- Vertical slice and runtime smoke tests still pass.

## Editorial Standard

The best result is not “many different voices.”

The best result is that the player feels, quietly, that these are different familiar people in the same neighborhood.
