import assert from 'node:assert/strict';
import { test } from 'node:test';

import { getUploadServerBase } from '../src/renderer/spellingTrainer/uploadServer.js';
import { chooseWorksheetOcrAction } from '../src/renderer/spellingTrainer/ocrActions.js';

test('public hosts do not point advanced OCR at the phone loopback address', () => {
  assert.equal(getUploadServerBase('bike-browser.com'), null);
});

test('localhost can use the local worksheet upload server', () => {
  assert.equal(getUploadServerBase('localhost'), 'http://127.0.0.1:3000');
});

test('Run OCR falls back to browser OCR when the advanced OCR server is not connected', () => {
  assert.equal(chooseWorksheetOcrAction({ advancedConnected: false }), 'basic');
});

test('Run OCR uses advanced OCR only when the server is connected', () => {
  assert.equal(chooseWorksheetOcrAction({ advancedConnected: true }), 'advanced');
});
