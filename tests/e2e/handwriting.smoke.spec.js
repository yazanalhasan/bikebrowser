import { expect, test } from 'playwright/test';

async function drawPracticeLetter(page) {
  const canvas = page.locator('canvas.bb-handwriting-canvas').first();
  await canvas.scrollIntoViewIfNeeded();
  const box = await canvas.boundingBox();
  if (!box) throw new Error('Handwriting canvas is missing.');

  await page.mouse.move(box.x + box.width * 0.32, box.y + box.height * 0.15);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.32, box.y + box.height * 0.85, { steps: 8 });
  await page.mouse.move(box.x + box.width * 0.72, box.y + box.height * 0.62, { steps: 8 });
  await page.mouse.move(box.x + box.width * 0.35, box.y + box.height * 0.84, { steps: 8 });
  await page.mouse.up();
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.removeItem('bikebrowser.handwritingProgress');
    window.localStorage.removeItem('bikebrowser.letterDetectiveProgress');
    window.localStorage.setItem('bikebrowser.accessibility', JSON.stringify({
      dyslexiaMode: true,
      lowercasePriority: true,
      enhancedConfusableLetters: true,
      preserveCapitalBD: true,
      increasedSpacing: true,
      reducedMotion: true,
      readingFocusMode: false,
      phonemeAudio: false,
      fontMode: 'atkinson',
    }));
  });
});

test('Letter Detective handwriting captures vector strokes and awards progress', async ({ page }) => {
  await page.goto('/learn/letter-detective');
  await expect(page.getByRole('heading', { name: 'Letter Detective' })).toBeVisible();
  await expect(page.getByTestId('handwriting-panel')).toBeVisible();

  await drawPracticeLetter(page);
  await page.getByRole('button', { name: 'Check writing' }).click();

  await expect(page.getByText(/handwriting stars/i)).toBeVisible();
  const attempts = await page.evaluate(() => JSON.parse(
    window.localStorage.getItem('bikebrowser.handwritingProgress'),
  ).improvementMetrics.totalAttempts);
  expect(attempts).toBe(1);
});

test('spelling Write mode uses the shared handwriting canvas', async ({ page }) => {
  await page.goto('/spelling-trainer');
  await page.getByRole('button', { name: /Write/ }).click();
  await expect(page.getByTestId('handwriting-panel')).toBeVisible();

  await drawPracticeLetter(page);
  await page.getByRole('button', { name: 'Check writing' }).click();

  await expect(page.getByText(/Handwriting practice strengthens spelling memory/i)).toBeVisible();
});
