import assert from 'node:assert/strict';
import { test } from 'node:test';

import { requestAiWorksheetOcr } from '../src/renderer/spellingTrainer/aiOcrClient.js';

test('AI OCR client posts a worksheet data URL to the deployable API route', async () => {
  const calls = [];
  const result = await requestAiWorksheetOcr({
    worksheet: {
      file: {
        name: 'words.jpg',
        type: 'image/jpeg'
      }
    },
    toDataUrl: async () => 'data:image/jpeg;base64,abc123',
    fetchImpl: async (url, options) => {
      calls.push({ url, options });
      return {
        ok: true,
        json: async () => ({
          success: true,
          provider: 'openai',
          rawText: 'astounding\nallowance',
          words: ['astounding', 'allowance']
        })
      };
    }
  });

  assert.equal(calls[0].url, '/api/spelling-ocr');
  assert.equal(JSON.parse(calls[0].options.body).fileName, 'words.jpg');
  assert.equal(JSON.parse(calls[0].options.body).imageDataUrl, 'data:image/jpeg;base64,abc123');
  assert.equal(result.provider, 'openai');
  assert.deepEqual(result.words, ['astounding', 'allowance']);
});

test('AI OCR client reports fallbackRequired when the API cannot produce words', async () => {
  const result = await requestAiWorksheetOcr({
    worksheet: { file: { name: 'words.jpg', type: 'image/jpeg' } },
    toDataUrl: async () => 'data:image/jpeg;base64,abc123',
    fetchImpl: async () => ({
      ok: true,
      json: async () => ({ success: false, fallbackRequired: true, words: [] })
    })
  });

  assert.equal(result.success, false);
  assert.equal(result.fallbackRequired, true);
});
