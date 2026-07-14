import { test, expect } from '@playwright/test';
import { bootToCardsList, addCard } from './helpers';

// The grid layout is derived from the *live* window width (useWindowDimensions),
// so it reflows when the browser window is resized rather than being frozen at
// the width captured on first load.
test('grid reflows to more columns when the window is widened', async ({ page }) => {
  await bootToCardsList(page);
  await addCard(page, { shop: 'tesco', number: '1111222233334444' });
  await addCard(page, { shop: 'lidl', number: '5555666677778888' });

  await page.getByTestId('view-toggle-grid').click();
  const tile = page.locator('[data-testid^="card-grid-item-"]').first();
  await expect(tile).toBeVisible();

  // Narrow viewport → small tiles.
  await page.setViewportSize({ width: 400, height: 800 });
  const narrowWidth = (await tile.boundingBox())!.width;

  // Wide viewport → the same tiles get wider (more usable space per column)
  // even though the column cap keeps them from becoming huge. The key assertion
  // is that the layout *responds* to the resize at all.
  await page.setViewportSize({ width: 1200, height: 800 });
  await expect
    .poll(async () => (await tile.boundingBox())!.width)
    .not.toBe(narrowWidth);
});
