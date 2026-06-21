// Skate Park reasoning quests (Phase 4). No trivia, no quizzes — each is an
// Observe → Predict → Test → Explain loop the player runs by RIDING. Data-driven;
// the SkateParkSystem evaluates completion from a run's telemetry. educationalTags
// map to the arc.md ladder; `level` names the educational-hierarchy rung in play.

export const SKATEPARK_QUESTS = [
  {
    id: 'sk_predict_distance',
    type: 'prediction',
    level: 'Predict',
    title: 'Which launch goes farther?',
    prompt: 'Predict (◀/▶): does the angled Launch Ramp or the Quarter Pipe throw you FARTHER across the ground? Then ride off both and read the landing markers.',
    teach: 'A low, angled ramp turns speed into DISTANCE; a vertical wall turns it into HEIGHT. Same speed, different launch angle.',
    educationalTags: ['trajectory', 'launch_angle', 'distance'],
  },
  {
    id: 'sk_optimize_flow',
    type: 'optimization',
    level: 'Engineer',
    title: 'Keep your flow',
    prompt: 'Reach the finish flag with a Flow score of at least 60 — keep your speed, link the obstacles, do not bail.',
    teach: 'Flow = momentum preserved across a line. Smooth-and-linked beats fast-then-stop. (Early systems-optimization.)',
    educationalTags: ['momentum', 'optimization', 'systems'],
    target: 60,
  },
  {
    id: 'sk_experiment_friction',
    type: 'experimental',
    level: 'Explain',
    title: 'Friction experiment',
    prompt: 'Change one thing: ride the low-friction steel rail, then the higher-friction concrete pad. Watch the grip readout — which lets you keep more speed?',
    teach: 'Lower surface friction = less speed lost. Same rider, one variable changed — that is an experiment.',
    educationalTags: ['friction', 'experimental_design'],
  },
];

export function questById(id) {
  return SKATEPARK_QUESTS.find((q) => q.id === id) || null;
}
