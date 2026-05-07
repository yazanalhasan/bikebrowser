export async function recognizeHandwritingWithCloudflare({ imageBlob, mode = 'letter', signal }) {
  if (!imageBlob) {
    return { text: '', confidence: 0, latencyMs: 0, source: 'cloudflare-unavailable', skipped: true };
  }

  const startedAt = performance.now();
  const formData = new FormData();
  formData.append('image', imageBlob, 'handwriting.webp');
  formData.append('mode', mode);

  const response = await fetch('/api/handwriting/recognize-letter', {
    method: 'POST',
    body: formData,
    signal,
  });

  if (!response.ok) {
    throw new Error(`Handwriting OCR unavailable (${response.status})`);
  }

  const result = await response.json();
  return {
    text: result.text || '',
    confidence: Number(result.confidence || 0),
    latencyMs: Math.round(performance.now() - startedAt),
    source: result.source || 'cloudflare',
  };
}
