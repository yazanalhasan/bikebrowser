# BikeBrowser Reward Cues

Four-tier accomplishment audio. Warm, calm, embodied. Stardew-quiet, not Mario coin.

| File | Tier | Duration | Use |
|---|---|---|---|
| reward_tiny | tiny | 150 ms | Objective tick (1/5 → 2/5). Soft wooden tick at E5 with warm 2nd harmonic. |
| reward_small | small | 300 ms | Item added, notebook entry written, recipe learned. Two-note chime C5→E5, soft arpeggio. |
| reward_medium | medium | 600 ms | Quest completed. Three-note C-E-G major triad, staggered, ringing. |
| reward_large | large | 1.2 s | Capstone / act milestone. C major arpeggio with sustained root and gentle bell shimmer. |

Both .wav (44.1kHz 16-bit mono) and .ogg (Vorbis q6) versions included. Prefer .ogg for Godot web export.

Peak levels are calibrated -9 dB (tiny) to -6 dB (large) — quieter cues for smaller events, slightly fuller for milestones. None are loud. Mix on the SFX bus around -6 to -3 dB headroom under music.

All four share the same tonal center (C major) so they feel like one family across the session.
