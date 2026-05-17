# Emotional Pacing Audit

Date: 2026-05-17
Author: experiential-playtest-validation sprint

Code-level audit of the calmness, warmth, and breathing room of the first 15 minutes.

## 1. Calmness scorecard

| Moment | Calm? | Notes |
|---|---|---|
| First spawn in Neighborhood | ✓ | Dusk palette, ambient music. No HUD intrusion. |
| Approach Mrs. Ramirez | ✓ (after Phase 2 NPC radius fix) | 32-px circle means she only reacts when player is adjacent. |
| Brake check | ✓ | Single quiet "Looks good." line at completion. No stinger, no panel pop. |
| Tire/chain/report safety steps | ⚠ | Three rapid press-to-advance steps. Each fires `interaction_feedback.emit` + `AudioService.play_sfx`. Three audio cues + three feedback lines in ~6 seconds. **Mild stacking concern.** |
| Approach Mr. Chen | ✓ | 32-px circle. Quiet presence line, debounced 14s. |
| Walk to garage | ✓ | New entrance under Zuzu's house. No NPC in the way. |
| ChainHotspot first engage | ✓ | Camera zoom is gentle (0.42s sine-eased). Rig appears smoothly. |
| Chain repair in progress | ✓ | One pedal hold, one continuous mechanism. No interruptions. |
| Chain verified | ⚠⚠ | **Stacking concern flagged in `garage_payoff_reduction_check.md` from previous sprint: 7+ cues land in 2 seconds.** Plan documented, not yet shipped. |
| Walk back to neighborhood | ✓ | Garage exit transition, fade overlay, region-music swap. |

**Score: 7 calm, 2 mild concern, 1 known stacking issue.**

## 2. Garage stacking — recap from prior sprint

Previously identified, still present:

At `chain_repair` completion, the following land within ~2 seconds:
1. `SEATED_CHAIN` texture swap on RepairBike (primary, kept)
2. Wheel rotation acceleration in static prop (also keep — supportive)
3. `RepairGlint` brightens (redundant)
4. `DrivetrainFocusGlow` flickers (redundant)
5. `wheel_spin_success` SFX (player's own action — keep)
6. `reward_chime` stinger via RewardBridge → AudioService (stacked on top of #5 — drop)
7. `RewardPanel` 3.16s tween (delay it ~1.5s so it doesn't stack)
8. `hint_label` overwritten 3 times in <1s (only last message survives, others are noise — drop the early ones)

The 5-LOC fix (`AudioService._on_reward_feedback` guard against stacking within 600ms) was deferred from the prior sprint because it touches the Core/AudioService boundary. **It remains the single highest-impact emotional-pacing fix available.**

## 3. New observation: SafetyCheckStation rapid-step risk

After the embodied brake step, the player presses E three more times:
- check_tires: `tire_press` SFX, "Firm tire..." feedback
- check_chain: `chain_roll` SFX, "The chain rolls easy..." feedback
- report_safety_check: `soft_reward` SFX, "Mrs. Ramirez smiles..." feedback

If the player presses E quickly (which the prompt invites), all three fire in ~3 seconds. That's three SFX + three interaction_feedback lines.

The audio cues are short and themed ("warm/curious/celebrate" tones), so unlike the garage stacking, this isn't loud. But it's a thicker cluster than the rest of the slice.

**Mitigation suggestion (low priority):** add a 0.4s minimum gap between SafetyCheckStation step advances. Small enough to feel natural, large enough that the audio cues don't overlap. ~5 LOC in SafetyCheckStation.gd's `advance_check`. **Tracked, not urgent.**

## 4. Warmth audit

| Element | Warm? | Notes |
|---|---|---|
| Color palette | ✓ | Dusk-warm throughout. `#71546f` background, `#ffd27a` accent glows, `#e7a765` sky band. |
| NPC dialog tone | ✓ | All dialog reads neighborly, not transactional. Mrs. Ramirez "adjusts one glove and gives Zuzu an easy smile." |
| Quest feedback lines | ✓ | Brake: "Looks good." Chain: "Drivetrain clean." Soft, observational. |
| Reward UI copy | ⚠ | "Quiet chain repair" + "Chain Detective" badge + allowance amount. Reads warmer than typical game UI but the badge label is gamier than the rest of the world's voice. |
| Audio | ✓ | Music beds per-region, fades smoothly on transition. |
| Camera | ✓ | Position smoothing enabled on Player.Camera2D. Zoom transitions sine-eased. |

**Warmth is consistently authored.** The only mild gamy note is "Chain Detective" — fine, but reads more reward-system than world.

## 5. Breathing room

| Phase | Time density | Notes |
|---|---|---|
| First 60s of exploration | Sparse | Player can walk, look, do nothing. Music is the only thing happening. |
| Mrs. Ramirez approach to brake completion | ~90s for an unhurried player | Plenty of room for the player to stop and look at the bike. |
| Garage entry to chain repair start | ~30s | Adequate, but the garage is dense; eye is pulled in many directions. |
| Chain repair to garage exit | ~60s including looking around | The repair itself is ~2s of active engagement; the rest is mood-soaking. |
| Return + lingering | Open-ended | If the player wants to walk back to Mrs. Ramirez or Mr. Chen, they can. |

**Breathing room is good outside the chain_repair completion moment.** That moment is over-dense; the rest of the slice respects the calm-pacing rule.

## 6. UI visibility

Reviewed: dialog box, prompts, HUD.

- **DialogBox**: per-region instance. Hidden until invoked. Fades in/out. Doesn't persist. ✓
- **Prompts**: small pill-shaped labels with subtle pulse (`pulse_time` driven). Only visible when player in range. ✓
- **HUD**: not deeply read in this audit; flagged for separate review. The Phase 10 garage-payoff doc flagged `hint_label` overwrites as the loudest HUD noise; that remains.
- **Reward UI**: tweens in over ~3.16 seconds at chain_repair completion. Visible duration is fine; the timing (stacked on the verification moment) is the issue, not the visibility itself.

## 7. Audio pacing

Reviewed `AudioService` cue routing:
- Region music: continuous bed per region, fades on transition. ✓
- Ambience: subtle, continuous, region-specific. ✓
- Interaction SFX: per-event, short. Tone tags drive pitch/volume routing. ✓
- Completion stingers: present, stacked at chain_repair (the Phase 10 flag). ⚠
- Voice TTS: per-NPC profile via `voice_profiles.json` (verified by Phase 8 audit — clean).

**Silence as a deliberate authored choice:** the brake "Looks good." is at "quiet" tone, which routes to a low-volume audio cue. The chain "Drivetrain clean." is on-screen text only — no audio. That's intentional and honored.

## 8. Pacing interruptions

Reviewed for: dialog boxes blocking movement, modal panels, forced waits.

- DialogBox blocks movement while open (typical, fine).
- TransitionZone fades the screen for ~0.18s before region change (gentle, fine).
- Camera zoom on ChainHotspot engage is 0.42s sine-eased — doesn't block input (the zoom happens *while* the player is already holding).
- RewardPanel at chain_repair completion has a 3.16s lifecycle. Not modal. Player can move past it. **Fine, but it lands stacked on the verification moment — see §3.**

No accidental blockers found.

## 9. Top three pacing fixes

1. **AudioService stinger-stacking guard** (5 LOC, deferred from prior sprint). Removes the doubled audio cue at chain_repair completion.
2. **RewardPanel deferral** (~10 LOC). Wait 1.5s after `chain_repair` completion before tweening it in, so it lands *after* the tactile moment rather than on it.
3. **SafetyCheckStation step gap** (5 LOC). 0.4s minimum gap between rapid press-to-advance steps so the audio cues don't overlap.

All three are surgical, in the 5-15 LOC range, and reversible. None require architectural change.

## 10. What this audit cannot evaluate

- Whether the warmth feels patronizing or authentic.
- Whether the dusk palette reads as cozy or as gloomy.
- Whether the pacing feels calm or empty/slow.
- Whether silence at the chain "Drivetrain clean." moment feels deliberate or like a missing cue.

A human playtest will surface these subjective judgments. The code-level audit can only tell you what the game *does*, not how it *feels*.
