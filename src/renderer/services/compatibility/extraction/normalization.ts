export function normalizeText(value: unknown): string {
  return String(value || '')
    .replace(/[–—]/g, '-')
    .replace(/\s+/g, ' ')
    .trim();
}

export function normalizeUpper(value: unknown): string {
  return normalizeText(value).toUpperCase();
}

export function parseNumber(value: unknown): number | undefined {
  const parsed = Number(String(value || '').replace(/[^\d.]/g, ''));
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function maxCassetteTooth(range: unknown): number | undefined {
  const match = String(range || '').match(/[-–](\d{2})\s*T?/i);
  return match ? Number(match[1]) : undefined;
}

export function normalizeCategory(text: string): string {
  const lower = text.toLowerCase();
  if (lower.includes('derailleur')) return 'rear-derailleur';
  if (lower.includes('cassette')) return 'cassette';
  if (lower.includes('chain')) return 'chain';
  if (lower.includes('brake') || lower.includes('rotor')) return 'brake';
  if (lower.includes('wheel') || lower.includes('hub')) return 'wheel';
  if (lower.includes('seatpost') || lower.includes('dropper')) return 'seatpost';
  if (lower.includes('handlebar') || lower.includes('stem')) return 'cockpit';
  return 'general';
}
