export function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function requestAiWorksheetOcr({
  worksheet,
  fetchImpl = fetch,
  toDataUrl = fileToDataUrl
} = {}) {
  if (!worksheet?.file) {
    return {
      success: false,
      fallbackRequired: true,
      words: [],
      error: 'No worksheet file selected.'
    };
  }

  const imageDataUrl = await toDataUrl(worksheet.file);
  const response = await fetchImpl('/api/spelling-ocr', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      imageDataUrl,
      fileName: worksheet.file.name || worksheet.name || 'worksheet'
    })
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    return {
      success: false,
      fallbackRequired: true,
      words: [],
      error: payload.error || `AI OCR returned HTTP ${response.status}`
    };
  }

  return {
    success: Boolean(payload.success),
    provider: payload.provider || null,
    rawText: payload.rawText || '',
    words: Array.isArray(payload.words) ? payload.words : [],
    confidence: payload.confidence || 'low',
    fallbackRequired: payload.fallbackRequired !== false,
    errors: payload.errors || [],
    error: payload.error || ''
  };
}
