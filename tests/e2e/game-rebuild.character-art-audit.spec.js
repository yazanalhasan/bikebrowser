import { expect, test } from 'playwright/test';

const REQUIRED_CHARACTERS = ['zuzu', 'mr_chen', 'neighbor', 'auntie_mariam'];

test.describe('Act 1 character art audit bridge', () => {
  test('exposes exact runtime frame and transform metadata for required characters', async ({ page }) => {
    await page.goto('/game-rebuild');
    await page.waitForFunction(() => window.__bikebrowserRebuildReady === true && Boolean(window.__GAME_ART_AUDIT__));

    const audit = await page.evaluate(() => window.__GAME_ART_AUDIT__.captureCharacterRuntimeState());

    expect(audit.sceneName).toBe('NeighborhoodScene');
    expect(audit.characters.map((character) => character.characterId)).toEqual(REQUIRED_CHARACTERS);

    for (const character of audit.characters) {
      expect(character.textureKey, `${character.characterId} texture`).toBeTruthy();
      expect(character.currentFrameIndex, `${character.characterId} frame index`).not.toBeNull();
      expect(character.cutX, `${character.characterId} cutX`).not.toBeNull();
      expect(character.cutY, `${character.characterId} cutY`).not.toBeNull();
      expect(character.cutWidth, `${character.characterId} cutWidth`).toBeGreaterThan(0);
      expect(character.cutHeight, `${character.characterId} cutHeight`).toBeGreaterThan(0);
      expect(character.bounds.width, `${character.characterId} bounds width`).toBeGreaterThan(0);
      expect(character.bounds.height, `${character.characterId} bounds height`).toBeGreaterThan(0);
      expect(character.cameraZoom, `${character.characterId} camera zoom`).toBeGreaterThan(0);
      expect(character).toEqual(expect.objectContaining({
        scaleX: expect.any(Number),
        scaleY: expect.any(Number),
        alpha: expect.any(Number),
        flipX: expect.any(Boolean),
        flipY: expect.any(Boolean),
        rotation: expect.any(Number),
        originX: expect.any(Number),
        originY: expect.any(Number),
        depth: expect.any(Number),
        visible: expect.any(Boolean),
      }));
    }
  });
});
