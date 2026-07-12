import { test, expect } from '@playwright/test';
import { bootToCardsList } from './helpers';

// Mirrors .maestro/flows/08-settings.yaml
test('settings screen shows country, language and clear-data rows', async ({ page }) => {
  await bootToCardsList(page);

  await page.getByTestId('tab-settings').click();

  await expect(page.getByTestId('settings-screen')).toBeVisible();
  await expect(page.getByTestId('settings-country')).toBeVisible();
  await expect(page.getByTestId('settings-language')).toBeVisible();
  await expect(page.getByTestId('settings-clear-data')).toBeVisible();
});
