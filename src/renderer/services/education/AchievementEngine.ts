export function evaluateAchievements(profile: any) {
  const unlocked = new Set(profile.achievements || []);
  const multiplication = profile.subjects?.multiplication || {};
  const patterns = profile.patterns || {};

  if ((multiplication.bestStreak || 0) >= 7) unlocked.add('turbo-builder');
  if ((patterns['9s']?.masteryScore || 0) >= 0.8) unlocked.add('precision-mechanic');
  if ((profile.xp || 0) >= 250) unlocked.add('garage-apprentice');

  return [...unlocked];
}
