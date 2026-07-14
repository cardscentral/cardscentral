import { test, expect } from '@playwright/test';
import { bootToCardsList } from './helpers';

// Mirrors .maestro/flows/10-language-change.yaml
//
// Language (and country) selection uses an in-app Modal picker rather than a
// RN `Alert.alert` with buttons — the latter renders as a no-op on
// react-native-web, so tapping options did nothing on the web/PWA build. This
// verifies the picker opens and a selection actually applies + persists.
test('UI is localized to the selected country default (Slovak)', async ({ page }) => {
  await bootToCardsList(page);

  // SK default → Slovak strings in the cards tab/header.
  await expect(page.getByText(/Moje karty/).first()).toBeVisible();

  await page.getByTestId('tab-settings').click();
  await expect(page.getByTestId('settings-screen')).toBeVisible();

  // The language row shows the active language (Slovak).
  await expect(page.getByTestId('settings-language')).toBeVisible();
  await expect(page.getByTestId('settings-language-value')).toContainText(/Sloven/);
});

test('can change the language via the picker (works on web)', async ({ page }) => {
  await bootToCardsList(page);
  await page.getByTestId('tab-settings').click();
  await expect(page.getByTestId('settings-screen')).toBeVisible();

  // Open the language picker and switch to English.
  await page.getByTestId('settings-language').click();
  await expect(page.getByTestId('picker-language')).toBeVisible();
  await page.getByTestId('picker-language-en').click();

  // The row now reflects English, and it persists across a reload.
  await expect(page.getByTestId('settings-language-value')).toContainText('English');
  await expect
    .poll(() => page.evaluate(() => localStorage.getItem('@cardscentral/language')))
    .toBe('en');

  await page.reload();
  await page.getByTestId('tab-settings').click();
  await expect(page.getByTestId('settings-language-value')).toContainText('English');
});

test('can change the country via the picker (works on web)', async ({ page }) => {
  await bootToCardsList(page);
  await page.getByTestId('tab-settings').click();
  await expect(page.getByTestId('settings-screen')).toBeVisible();

  // Open the country picker and switch to Germany.
  await page.getByTestId('settings-country').click();
  await expect(page.getByTestId('picker-country')).toBeVisible();
  await page.getByTestId('picker-country-DE').click();

  // The row now reflects Germany, and it persists across a reload.
  await expect(page.getByTestId('settings-country')).toContainText('Germany');
  await expect
    .poll(() => page.evaluate(() => localStorage.getItem('@cardscentral/country')))
    .toBe('DE');
});
