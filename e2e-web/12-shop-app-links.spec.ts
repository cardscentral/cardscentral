import { test, expect } from '@playwright/test';
import { bootToCardsList, addCard, openCard } from './helpers';

// Mirrors .maestro/flows/11-shop-app-links.yaml
//
// The card detail screen surfaces the "official retailer app" affordances:
// an app section and a store/app button (a store listing link on web).
//
// Note: on the web/PWA build, browsers can't detect or reliably deep-link into
// installed native apps, so the "app available" badge is intentionally NOT
// shown here — even for shops with a known native app (e.g. Tesco). The badge
// is a native-only affordance. See hasShopApp()/canDetectInstalledApps().
test('card detail shows official-app store links (no app badge on web)', async ({ page }) => {
  await bootToCardsList(page);
  await addCard(page, { shop: 'tesco', number: '1234567890123', nickname: 'My Tesco Card' });

  const detail = await openCard(page, /My Tesco Card/);

  await expect(detail.getByTestId('shop-app-section')).toBeVisible();
  await expect(detail.getByTestId('open-store-button')).toBeVisible();

  // On web the app-available badge is suppressed (no app detection in browsers).
  await expect(detail.getByTestId('shop-app-badge')).toHaveCount(0);
});
