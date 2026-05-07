import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  createSpellingOcrService,
  normalizeSpellingOcrResponse,
} from '../src/server/spelling-ocr-service.mjs';

test('worksheet OCR tries Thaura, DeepSeek, then OpenAI and returns the first useful result', async () => {
  const calls = [];
  const service = createSpellingOcrService({
    providers: [
      {
        name: 'thaura',
        run: async () => {
          calls.push('thaura');
          throw new Error('Thaura vision unavailable');
        }
      },
      {
        name: 'deepseek',
        run: async () => {
          calls.push('deepseek');
          return '{"rawText":"1. astounding\\n2. allowance","words":["astounding","allowance"],"confidence":0.86}';
        }
      },
      {
        name: 'openai',
        run: async () => {
          calls.push('openai');
          return '{"words":["should-not-run"]}';
        }
      }
    ]
  });

  const result = await service.recognizeWorksheet({
    imageDataUrl: 'data:image/jpeg;base64,abc123',
    fileName: 'worksheet.jpg'
  });

  assert.deepEqual(calls, ['thaura', 'deepseek']);
  assert.equal(result.success, true);
  assert.equal(result.provider, 'deepseek');
  assert.deepEqual(result.words, ['astounding', 'allowance']);
  assert.equal(result.fallbackRequired, false);
});

test('worksheet OCR asks the browser to fall back when every AI provider fails', async () => {
  const service = createSpellingOcrService({
    providers: [
      { name: 'thaura', run: async () => ({ words: [] }) },
      { name: 'deepseek', run: async () => { throw new Error('no vision model'); } },
      { name: 'openai', run: async () => '' }
    ]
  });

  const result = await service.recognizeWorksheet({
    imageDataUrl: 'data:image/png;base64,abc123',
    fileName: 'worksheet.png'
  });

  assert.equal(result.success, false);
  assert.equal(result.provider, null);
  assert.equal(result.fallbackRequired, true);
  assert.deepEqual(result.words, []);
  assert.equal(result.errors.length, 3);
});

test('normalization accepts JSON, raw text, and filters duplicate non-words', () => {
  const result = normalizeSpellingOcrResponse(
    'thaura',
    '```json\n{"rawText":"Spelling Words\\n1. Astounding\\n2. Astounding\\n3. Allowance","words":["Astounding","Astounding","Allowance","2"],"confidence":"high"}\n```'
  );

  assert.equal(result.provider, 'thaura');
  assert.equal(result.rawText.includes('Astounding'), true);
  assert.deepEqual(result.words, ['astounding', 'allowance']);
  assert.equal(result.confidence, 'high');
});
