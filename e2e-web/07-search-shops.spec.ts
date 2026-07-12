import { test, expect } from '@playwright/test';
import { bootToCardsList } from './helpers';

// Mirrors .maestro/flows/07-search-shops.yaml
test('search filters shops when adding a card', async ({ page }) => {
  await bootToCardsList(page);

  await page.getByTestId('add-card-button').click();
  const search = page.getByTestId('shop-search-input');
  await expect(search).toBeVisible();

  // Search for H&M.
  await search.fill('H&M');
  await expect(page.getByTestId('shop-select-hm')).toBeVisible();

  // Clear and search for Lidl.
  await search.fill('Lidl');
  await expect(page.getByTestId('shop-select-lidl')).toBeVisible();
});
