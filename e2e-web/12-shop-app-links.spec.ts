import { test, expect } from '@playwright/test';
import { bootToCardsList, addCard, openCard } from './helpers';

// Mirrors .maestro/flows/11-shop-app-links.yaml
//
// The card detail screen surfaces the "official retailer app" affordances:
// an app section, a store/app button, and — for shops with a known native app
// (Tesco is in the registry) — an "app available" badge.
test('card detail shows official-app links and the app-available badge', async ({ page }) => {
  await bootToCardsList(page);
  await addCard(page, { shop: 'tesco', number: '1234567890123', nickname: 'My Tesco Card' });

  const detail = await openCard(page, /My Tesco Card/);

  await expect(detail.getByTestId('shop-app-section')).toBeVisible();
  await expect(detail.getByTestId('open-store-button')).toBeVisible();

  // Tesco has a known native app → the app-available badge is shown (scoped to
  // the detail screen; the same badge also renders on the list card). The
  // button label is localized, so we assert the stable testID instead of text.
  await expect(detail.getByTestId('shop-app-badge')).toBeVisible();
});
