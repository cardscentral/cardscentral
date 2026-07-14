import { test, expect } from '@playwright/test';
import { bootToCardsList, addCard, openCard } from './helpers';

// Mirrors .maestro/flows/12-shop-app-links.yaml
//
// The card detail screen surfaces the "official retailer app" affordances for
// shops that declare a VERIFIED official app (its YAML `apps` block): an app
// section and a store/app button (a direct store-listing link on web). Shops
// with no verified app show no store section at all — the name-based store
// *search* fallback was removed (see openShopApp.ts).
//
// H&M ('hm') declares a verified app on both platforms, so opening an H&M card
// must show the app section + store button.
//
// Note: on the web/PWA build, browsers can't detect or reliably deep-link into
// installed native apps, so the "app available" badge is intentionally NOT
// shown here — even for shops with a known native app. The badge is a
// native-only affordance. See hasShopApp()/canDetectInstalledApps().
test('card detail shows official-app store links (no app badge on web)', async ({ page }) => {
  await bootToCardsList(page);
  await addCard(page, { shop: 'hm', number: '1234567890123', nickname: 'My H&M Card' });

  const detail = await openCard(page, /My H&M Card/);

  await expect(detail.getByTestId('shop-app-section')).toBeVisible();
  await expect(detail.getByTestId('open-store-button')).toBeVisible();

  // On web the app-available badge is suppressed (no app detection in browsers).
  await expect(detail.getByTestId('shop-app-badge')).toHaveCount(0);
});

