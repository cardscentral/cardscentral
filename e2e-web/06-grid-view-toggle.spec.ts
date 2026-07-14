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

// The chosen layout is remembered across reloads / app restarts (persisted in
// localStorage on web, AsyncStorage on native).
test('remembers the selected view mode across a reload', async ({ page }) => {
  await bootToCardsList(page);
  await addCard(page, { shop: 'tesco', number: '9999888877776666' });

  // Choose grid view — grid renders each card with a `card-grid-item-*` testID.
  await page.getByTestId('view-toggle-grid').click();
  await expect(page.locator('[data-testid^="card-grid-item-"]').first()).toBeVisible();

  // Reload the app: the grid layout should be restored (not the default list).
  await page.reload();
  await expect(page.getByTestId('cards-list-screen')).toBeVisible();
  await expect(page.locator('[data-testid^="card-grid-item-"]').first()).toBeVisible();
});

