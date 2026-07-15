import { test, expect } from '@playwright/test';
import { bootToCardsList, addCard, openCard } from './helpers';

/**
 * Refresh persistence.
 *
 * On GitHub Pages the app is a client-side SPA with no server-side routing, so
 * every screen must survive a full page reload (F5 / direct URL). This is the
 * web-only counterpart to the Maestro flows — reloading a native app has no
 * equivalent, so there's no matching .maestro flow.
 *
 * For each reachable screen we navigate there, hit reload(), and assert the
 * SAME screen is still shown (not a fallback to the Cards tab or a 404). The
 * 404.html SPA-redirect + the linking config (each screen has a URL, and
 * param'd screens carry their id in the path) are what make this work.
 */

const SHOP = 'tesco';
const CARD_NUMBER = '1234567890123';

test.describe('refresh keeps you on the same screen', () => {
  test('Cards list (root)', async ({ page }) => {
    await bootToCardsList(page);
    await page.reload();
    await expect(page.getByTestId('cards-list-screen')).toBeVisible();
  });

  test('Settings tab', async ({ page }) => {
    await bootToCardsList(page);
    await page.getByTestId('tab-settings').click();
    await expect(page.getByTestId('settings-screen')).toBeVisible();
    await page.reload();
    await expect(page.getByTestId('settings-screen')).toBeVisible();
  });

  test('Add card (shop picker)', async ({ page }) => {
    await bootToCardsList(page);
    await page.getByTestId('add-card-button').click();
    await expect(page.getByTestId('add-card-screen')).toBeVisible();
    await page.reload();
    await expect(page.getByTestId('add-card-screen')).toBeVisible();
  });

  test('Card details (new card, shopId in URL)', async ({ page }) => {
    await bootToCardsList(page);
    await page.getByTestId('add-card-button').click();
    const shopButton = page.getByTestId(`shop-select-${SHOP}`);
    await shopButton.scrollIntoViewIfNeeded();
    await shopButton.click();
    await expect(page.getByTestId('card-details-screen')).toBeVisible();
    // The shopId must be in the URL so the shop still resolves after reload.
    await expect(page).toHaveURL(new RegExp(`/card-details/${SHOP}$`));
    await page.reload();
    await expect(page.getByTestId('card-details-screen')).toBeVisible();
    await expect(page.getByTestId('card-number-input')).toBeVisible();
  });

  test('Scan barcode', async ({ page }) => {
    await bootToCardsList(page);
    await page.getByTestId('add-card-button').click();
    const shopButton = page.getByTestId(`shop-select-${SHOP}`);
    await shopButton.scrollIntoViewIfNeeded();
    await shopButton.click();
    await page.getByTestId('scan-barcode-button').click();
    await expect(page.getByTestId('scan-screen')).toBeVisible();
    await page.reload();
    await expect(page.getByTestId('scan-screen')).toBeVisible();
  });

  test('Card detail view (cardId in URL)', async ({ page }) => {
    await bootToCardsList(page);
    await addCard(page, { shop: SHOP, number: CARD_NUMBER });
    await openCard(page, CARD_NUMBER);
    await expect(page).toHaveURL(/\/card\/[^/]+$/);
    await page.reload();
    await expect(page.getByTestId('card-detail-screen')).toBeVisible();
  });

  test('Edit card (cardId in URL)', async ({ page }) => {
    await bootToCardsList(page);
    await addCard(page, { shop: SHOP, number: CARD_NUMBER });
    await openCard(page, CARD_NUMBER);
    await page.getByTestId('edit-card-button').click();
    await expect(page.getByTestId('edit-card-screen')).toBeVisible();
    await expect(page).toHaveURL(/\/edit\/[^/]+$/);
    await page.reload();
    await expect(page.getByTestId('edit-card-screen')).toBeVisible();
    await expect(page.getByTestId('edit-card-number-input')).toBeVisible();
  });

  test('Import', async ({ page }) => {
    await bootToCardsList(page);
    await page.getByTestId('tab-settings').click();
    await page.getByTestId('settings-import').click();
    await expect(page.getByTestId('import-screen')).toBeVisible();
    await page.reload();
    await expect(page.getByTestId('import-screen')).toBeVisible();
  });

  test('Share cards', async ({ page }) => {
    await bootToCardsList(page);
    await addCard(page, { shop: SHOP, number: CARD_NUMBER });
    await page.getByTestId('tab-settings').click();
    await page.getByTestId('settings-share-cards').click();
    await expect(page.getByTestId('share-cards-screen')).toBeVisible();
    await page.reload();
    await expect(page.getByTestId('share-cards-screen')).toBeVisible();
  });
});
