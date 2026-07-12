import { test, expect } from '@playwright/test';
import { bootToCardsList, addCard } from './helpers';

// Mirrors .maestro/flows/06-grid-view-toggle.yaml
test('toggle between list and grid view keeps cards visible', async ({ page }) => {
  await bootToCardsList(page);
  await addCard(page, { shop: 'tesco', number: '9999888877776666' });

  // View toggle is present once at least one card exists.
  await expect(page.getByTestId('view-toggle')).toBeVisible();

  // Switch to grid view — card still visible.
  await page.getByTestId('view-toggle-grid').click();
  await expect(page.getByText(/Tesco/).first()).toBeVisible();

  // Switch back to list view — card still visible.
  await page.getByTestId('view-toggle-list').click();
  await expect(page.getByText(/Tesco/).first()).toBeVisible();
});
