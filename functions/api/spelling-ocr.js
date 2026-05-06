import {
  buildDefaultSpellingOcrProviders,
  createSpellingOcrService,
} from '../../src/server/spelling-ocr-service.mjs';

export async function onRequestPost(context) {
  try {
    const body = await context.request.json();
    const imageDataUrl = String(body?.imageDataUrl || '');
    const fileName = String(body?.fileName || 'worksheet');

    if (imageDataUrl.length > 10 * 1024 * 1024) {
      return Response.json({
        success: false,
        provider: null,
        rawText: '',
        words: [],
        confidence: 'low',
        fallbackRequired: true,
        error: 'Image is too large. Try a smaller photo.'
      }, { status: 413 });
    }

    const service = createSpellingOcrService({
      providers: buildDefaultSpellingOcrProviders(context.env, fetch)
    });

    const result = await service.recognizeWorksheet({ imageDataUrl, fileName });
    return Response.json(result);
  } catch (error) {
    return Response.json({
      success: false,
      provider: null,
      rawText: '',
      words: [],
      confidence: 'low',
      fallbackRequired: true,
      error: error.message || 'Spelling OCR request failed.'
    }, { status: 400 });
  }
}
