import { test, expect } from '@playwright/test';
import { bootToCardsList } from './helpers';

// Verifies the dark/light/system theme toggle in Settings and that the chosen
// preference survives a page reload (persisted via localStorage on web).
test('theme preference can be changed and persists across reload', async ({ page }) => {
  await bootToCardsList(page);

  await page.getByTestId('tab-settings').click();
  await expect(page.getByTestId('settings-theme')).toBeVisible();

  // Switch to Dark and confirm it was persisted.
  await page.getByTestId('settings-theme-dark').click();
  await expect
    .poll(() => page.evaluate(() => localStorage.getItem('@cardscentral/theme')))
    .toBe('dark');

  // Reload: the preference must survive (persisted via localStorage). Navigate
  // back to Settings to read it back from the UI.
  await page.reload();
  await expect(page.getByTestId('tab-settings')).toBeVisible();
  await page.getByTestId('tab-settings').click();
  await expect(page.getByTestId('settings-theme')).toBeVisible();

  await expect

    .poll(() => page.evaluate(() => localStorage.getItem('@cardscentral/theme')))
    .toBe('dark');

  // Switch back to System to leave storage in a clean-ish state.
  await page.getByTestId('settings-theme-system').click();
  await expect
    .poll(() => page.evaluate(() => localStorage.getItem('@cardscentral/theme')))
    .toBe('system');
});
