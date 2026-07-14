import { test, expect } from '@playwright/test';
import { bootToCardsList, addCard, openCard } from './helpers';

// Mirrors .maestro/flows/05-delete-card.yaml
//
// Deletion is confirmed before it runs. On web, react-native-web renders a
// multi-button `Alert.alert` as a no-op, so the screen instead uses the
// browser's native `window.confirm()` there. Playwright auto-dismisses dialogs
// by default, so we register a handler that accepts the confirm, then assert
// the card is actually gone from the list.
test('card detail deletes the card after confirmation', async ({ page }) => {
  await bootToCardsList(page);
  await addCard(page, { shop: 'tesco', number: '1234567890123', nickname: 'My Tesco Card' });

  const detail = await openCard(page, /My Tesco Card/);

  const deleteButton = detail.getByTestId('delete-card-button');
  await deleteButton.scrollIntoViewIfNeeded();
  await expect(deleteButton).toBeVisible();
  await expect(deleteButton).toBeEnabled();

  // Accept the native confirm() that guards the destructive action, and make
  // sure it actually appears (proves the delete path ran on web).
  const dialogPromise = page.waitForEvent('dialog').then((dialog) => dialog.accept());
  await deleteButton.click();
  await dialogPromise;

  // The card should be gone from the (now empty) cards list.
  await expect(page.getByTestId('empty-state')).toBeVisible();



});
