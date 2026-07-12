import { test, expect } from '@playwright/test';
import { bootToCardsList } from './helpers';

// Mirrors .maestro/flows/10-language-change.yaml
//
// The language picker itself is a RN `Alert.alert` with buttons. react-native-web
// renders Alert button lists as a no-op (they never appear in the DOM), so the
// actual language *switch* can only be exercised by the native Maestro suite.
//
// On web we still verify the parts that ARE observable: the localized default
// (Slovak, because Slovakia was selected) is applied to the UI, and the Settings
// language row reflects the current language.
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
