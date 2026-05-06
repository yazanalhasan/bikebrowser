export function calculateMasteryScore({ attempts = 0, correct = 0, fastestMs = null, firstTryCorrect = 0 }) {
  if (!attempts) return 0;
  const accuracy = correct / attempts;
  const firstTry = firstTryCorrect / attempts;
  const speed = fastestMs ? Math.max(0, Math.min(1, (4500 - fastestMs) / 3300)) : 0;
  return Number(Math.min(1, accuracy * 0.55 + firstTry * 0.2 + speed * 0.25).toFixed(2));
}
