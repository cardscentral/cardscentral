import { Page, expect } from '@playwright/test';

/**
 * Shared helpers for the web E2E suite.
 *
 * These mirror the Maestro native flows but each spec is self-contained: a
 * fresh Playwright context starts with empty localStorage, so we re-run the
 * setup (select country / add card) instead of relying on cross-flow ordering.
 */

/** Load the app from a clean slate (empty storage → country selection screen). */
export async function launchFresh(page: Page) {
  await page.goto('/');
  // Clear any persisted state (AsyncStorage → localStorage on web) and reload.
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();
}

/** First-run: pick Slovakia, land on the cards list. */
export async function selectCountrySK(page: Page) {
  await expect(page.getByText('Select your country')).toBeVisible();
  await page.getByTestId('country-SK').click();
  await expect(page.getByTestId('cards-list-screen')).toBeVisible();
}

/** Ensure we're on the cards list with SK selected (fresh launch + select). */
export async function bootToCardsList(page: Page) {
  await launchFresh(page);
  await selectCountrySK(page);
}

/**
 * Add a card for the given shop. Returns after we're back on the cards list.
 */
export async function addCard(
  page: Page,
  opts: { shop: string; number: string; nickname?: string }
) {
  await page.getByTestId('add-card-button').click();
  await expect(page.getByTestId('shop-search-input')).toBeVisible();

  const shopButton = page.getByTestId(`shop-select-${opts.shop}`);
  await shopButton.scrollIntoViewIfNeeded();
  await shopButton.click();

  const numberInput = page.getByTestId('card-number-input');
  await expect(numberInput).toBeVisible();
  await numberInput.fill(opts.number);

  if (opts.nickname) {
    await page.getByTestId('nickname-input').fill(opts.nickname);
  }

  const saveButton = page.getByTestId('save-card-button');
  await saveButton.scrollIntoViewIfNeeded();
  await saveButton.click();

  await expect(page.getByTestId('cards-list-screen')).toBeVisible();
}

/**
 * Open the first card whose label matches `text` from the list and wait for the
 * detail screen. Returns the detail-screen locator so callers can scope further
 * assertions to it (the same text/badges can also appear on the list item).
 */
export async function openCard(page: Page, text: RegExp | string) {
  const label = typeof text === 'string' ? new RegExp(text) : text;
  await page.getByText(label).first().click();
  const detail = page.getByTestId('card-detail-screen');
  await expect(detail).toBeVisible();
  return detail;
}

