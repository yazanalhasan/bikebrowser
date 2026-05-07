export async function recognizeHandwriting(imageBlob, options = {}) {
  const provider = options.fetchProvider || fetch;
  const startedAt = Date.now();
  const formData = new FormData();
  formData.append('image', imageBlob, 'handwriting.webp');

  const response = await provider('/api/handwriting/recognize-word', {
    method: 'POST',
    body: formData,
    signal: options.signal,
  });

  if (!response.ok) {
    throw new Error('Handwriting recognition is unavailable; local scoring still works.');
  }

  const data = await response.json();
  return {
    text: data.text || '',
    confidence: Number(data.confidence || 0),
    latencyMs: data.latencyMs || Date.now() - startedAt,
  };
}
