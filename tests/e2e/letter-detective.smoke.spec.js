import { expect, test } from 'playwright/test';

test('Letter Detective renders and a correct answer updates score', async ({ page }) => {
  await page.addInitScript(() => {
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
  await page.goto('/learn/letter-detective');

  await expect(page.getByRole('heading', { name: 'Letter Detective' })).toBeVisible();
  await expect(page.locator('.app-root')).toHaveClass(/bb-font-atkinson/);
  await expect(page.locator('.app-root')).toHaveClass(/bb-reduced-motion/);
  await expect(page.getByRole('button', { name: /Case Match/ })).toBeVisible();
  await expect(page.getByTestId('letter-detective-score')).toHaveText('0');
  await expect(page.getByRole('heading', { name: 'Find the lowercase match for B' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'b', exact: true })).toHaveText('b');

  await page.getByRole('button', { name: 'b', exact: true }).click();

  await expect(page.getByTestId('letter-detective-score')).toHaveText('1');
  await expect(page.getByText('Nice')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Find the uppercase match for d' })).toBeVisible({ timeout: 3000 });

  await page.reload();
  await expect(page.locator('.app-root')).toHaveClass(/bb-font-atkinson/);
});
