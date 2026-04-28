export function hasCorrectOption(quest, input) {
  const selectedId = typeof input === 'string' ? input : input?.optionId;
  return selectedId === quest?.evaluation?.correctOptionId ||
    quest?.options?.some((option) => option.id === selectedId && option.correct);
}

export function hasCorrectSet(quest, input) {
  const selected = Array.isArray(input) ? input : input?.optionIds;
  if (!Array.isArray(selected)) return false;

  const expected = quest?.evaluation?.correctSet || [];
  if (selected.length !== expected.length) return false;

  const expectedSet = new Set(expected);
  return selected.every((id) => expectedSet.has(id));
}

export function hasCorrectSequence(quest, input) {
  const selected = Array.isArray(input) ? input : input?.sequence;
  const expected = quest?.evaluation?.correctSequence || quest?.sequence || [];
  if (!Array.isArray(selected) || selected.length !== expected.length) return false;
  return selected.every((id, index) => id === expected[index]);
}
