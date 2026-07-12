import { test, expect } from '@playwright/test';
import { bootToCardsList } from './helpers';

// Mirrors .maestro/flows/10-import-vouchervault.yaml
test('import cards from a pasted VoucherVault JSON export', async ({ page }) => {
  await bootToCardsList(page);

  // Settings → Import
  await page.getByTestId('tab-settings').click();
  await expect(page.getByTestId('settings-import')).toBeVisible();
  await page.getByTestId('settings-import').click();

  await expect(page.getByTestId('import-screen')).toBeVisible();

  // Paste a minimal export (merchant "Tesco" maps to the tesco shop).
  await page
    .getByTestId('import-input')
    .fill('[{"merchant":"Tesco","code":"9991234567890","format":"EAN13"}]');

  await page.getByTestId('import-button').click();

  await expect(page.getByTestId('import-success')).toBeVisible();
  await expect(page.getByTestId('import-done')).toBeVisible();
});
