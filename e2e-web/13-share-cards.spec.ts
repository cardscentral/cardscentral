import { test, expect } from '@playwright/test';
import { bootToCardsList, addCard, openCard } from './helpers';


// Mirrors .maestro/flows/13-share-cards.yaml
//
// Multi-card sharing produces a single self-contained link (no server). On the
// web build the actual "share" hands off to the Web Share API or the clipboard;
// react-native-web renders the resulting `Alert.alert` confirmation as a no-op,
// so we can't assert the toast in the browser. Instead we verify the full
// selection UI is reachable and the share affordance is present and enabled —
// the native Maestro suite exercises the OS share sheet.
test('share cards screen lets you select cards and reach the share action', async ({ page }) => {
  await bootToCardsList(page);
  await addCard(page, { shop: 'tesco', number: '1234567890123', nickname: 'My Tesco Card' });
  await addCard(page, { shop: 'lidl', number: '9876543210987', nickname: 'My Lidl Card' });

  // Settings → Share cards
  await page.getByTestId('tab-settings').click();
  await expect(page.getByTestId('settings-screen')).toBeVisible();
  await page.getByTestId('settings-share-cards').click();

  const screen = page.getByTestId('share-cards-screen');
  await expect(screen).toBeVisible();

  // Both added cards are listed and selected by default (common case: share all).
  const rows = page.getByTestId('share-card-row');
  await expect(rows).toHaveCount(2);

  // Toggling "select all" deselects everything and disables the share button.
  // react-native-web renders a disabled Touchable as a <div aria-disabled="true">
  // (not a real disabled control), so assert the ARIA state rather than
  // Playwright's toBeDisabled(), which only understands native form controls.
  await page.getByTestId('share-select-all').click();
  await expect(page.getByTestId('share-cards-button')).toHaveAttribute('aria-disabled', 'true');

  // Re-selecting all re-enables the share action.
  await page.getByTestId('share-select-all').click();
  const shareButton = page.getByTestId('share-cards-button');
  await expect(shareButton).toBeVisible();
  await expect(shareButton).not.toHaveAttribute('aria-disabled', 'true');

});

test('share cards shows an empty state when there are no cards', async ({ page }) => {
  await bootToCardsList(page);

  await page.getByTestId('tab-settings').click();
  await expect(page.getByTestId('settings-screen')).toBeVisible();
  await page.getByTestId('settings-share-cards').click();

  await expect(page.getByTestId('share-cards-empty')).toBeVisible();
});

test('card detail exposes a single-card share action', async ({ page }) => {
  await bootToCardsList(page);
  await addCard(page, { shop: 'tesco', number: '1234567890123', nickname: 'My Tesco Card' });

  const detail = await openCard(page, /My Tesco Card/);

  await expect(detail.getByTestId('share-card-button')).toBeVisible();
  await expect(detail.getByTestId('share-card-button')).toBeEnabled();
});

