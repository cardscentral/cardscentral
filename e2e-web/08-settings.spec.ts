import { test, expect } from '@playwright/test';
import { bootToCardsList } from './helpers';

// Mirrors .maestro/flows/08-settings.yaml
test('settings screen shows country, language, share and version rows', async ({ page }) => {
  await bootToCardsList(page);

  await page.getByTestId('tab-settings').click();

  await expect(page.getByTestId('settings-screen')).toBeVisible();
  await expect(page.getByTestId('settings-country')).toBeVisible();
  await expect(page.getByTestId('settings-language')).toBeVisible();
  await expect(page.getByTestId('settings-share-cards')).toBeVisible();
  await expect(page.getByTestId('settings-import')).toBeVisible();
  // Version row links to the GitHub release notes for this build.
  await expect(page.getByTestId('settings-version')).toBeVisible();
});

