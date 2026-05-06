export function recommendDifficulty({ masteryScore = 0, streak = 0, hesitationSpike = false, recentAccuracy = 1 }) {
  if (hesitationSpike || recentAccuracy < 0.55) return 'support';
  if (masteryScore > 0.8 && streak >= 5) return 'advance';
  if (masteryScore > 0.55 && recentAccuracy >= 0.75) return 'stretch';
  return 'practice';
}
