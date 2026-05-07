const JSON_HEADERS = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store',
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: JSON_HEADERS });
}

function cors(response) {
  const headers = new Headers(response.headers);
  headers.set('access-control-allow-origin', '*');
  headers.set('access-control-allow-methods', 'POST, OPTIONS');
  headers.set('access-control-allow-headers', 'content-type');
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

async function recognizeWithHuggingFace(image, env) {
  if (!env.HF_API_TOKEN) {
    return {
      text: '',
      confidence: 0,
      latencyMs: 0,
      source: 'local-only',
      skipped: true,
      message: 'HF_API_TOKEN is not configured; local handwriting scoring remains available.',
    };
  }

  const startedAt = Date.now();
  const endpoint = `https://api-inference.huggingface.co/models/${env.HF_MODEL || 'microsoft/trocr-base-handwritten'}`;
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${env.HF_API_TOKEN}`,
      'content-type': image.type || 'image/webp',
    },
    body: image.stream(),
  });

  if (!response.ok) {
    return {
      text: '',
      confidence: 0,
      latencyMs: Date.now() - startedAt,
      source: 'huggingface',
      error: `OCR provider returned ${response.status}`,
    };
  }

  const data = await response.json();
  const first = Array.isArray(data) ? data[0] : data;
  return {
    text: first?.generated_text || first?.text || '',
    confidence: Number(first?.score || 0),
    latencyMs: Date.now() - startedAt,
    source: 'huggingface',
  };
}

async function handleRecognize(request, env, kind) {
  const form = await request.formData();
  const image = form.get('image');
  if (!(image instanceof File)) {
    return json({ error: 'Missing handwriting image.' }, 400);
  }

  const result = await recognizeWithHuggingFace(image, env);
  return json({ ...result, kind });
}

async function handleScore(request) {
  const body = await request.json().catch(() => ({}));
  return json({
    source: 'worker-local-merge',
    effortScore: Number(body.effortScore || 0),
    legibilityScore: Number(body.legibilityScore || 0),
    orientationScore: Number(body.orientationScore || 0),
    improvementScore: Number(body.improvementScore || 0),
    finalRewardScore: Number(body.finalRewardScore || 1),
    message: 'Cloud scoring accepted; local scoring remains the source of immediate feedback.',
  });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (request.method === 'OPTIONS') return cors(new Response(null, { status: 204 }));

    try {
      if (request.method !== 'POST') return cors(json({ error: 'Use POST.' }, 405));
      if (url.pathname.endsWith('/score-handwriting')) return cors(await handleScore(request, env, ctx));
      if (url.pathname.endsWith('/recognize-word')) return cors(await handleRecognize(request, env, 'word'));
      if (url.pathname.endsWith('/recognize-letter')) return cors(await handleRecognize(request, env, 'letter'));
      return cors(json({ error: 'Unknown handwriting endpoint.' }, 404));
    } catch (error) {
      console.error(JSON.stringify({ event: 'handwriting-api-error', message: error.message }));
      return cors(json({ error: 'Handwriting service unavailable.' }, 500));
    }
  },
};
