import { test, expect } from '@playwright/test';
import { bootToCardsList, addCard, openCard } from './helpers';

// Regression test for: "browser Back button in the PWA does nothing".
//
// React Navigation on web only syncs to the URL (and therefore browser
// history) when a `linking` config is provided. Without it, navigating to a
// screen never pushes a history entry, so the browser Back button has nothing
// to pop. With linking wired up, opening a card should change the URL and
// pressing Back should return to the cards list.
test('browser back navigates from card detail to the list', async ({ page }) => {
  await bootToCardsList(page);
  await addCard(page, { shop: 'tesco', number: '1234567890123', nickname: 'My Tesco Card' });

  const listUrl = page.url();

  const detail = await openCard(page, /My Tesco Card/);
  await expect(detail).toBeVisible();

  // Opening the card should have pushed a new history entry (URL changed).
  expect(page.url()).not.toBe(listUrl);

  // The browser Back button should now return us to the cards list.
  await page.goBack();
  await expect(page.getByTestId('cards-list-screen')).toBeVisible();
  await expect(detail).toBeHidden();
});
