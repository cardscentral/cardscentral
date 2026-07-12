import { test, expect } from '@playwright/test';
import { bootToCardsList, addCard, openCard } from './helpers';

// Mirrors .maestro/flows/05-delete-card.yaml
//
// Deletion is confirmed via a RN `Alert.alert` with buttons. react-native-web
// renders Alert button lists as a no-op, so the confirmation dialog never
// appears in the browser and the destructive tap can't be completed on web —
// the actual delete is covered by the native Maestro suite.
//
// On web we verify the delete affordance is present and reachable on the card
// detail screen (the entry point to the native confirm).
test('card detail exposes the delete action', async ({ page }) => {
  await bootToCardsList(page);
  await addCard(page, { shop: 'tesco', number: '1234567890123', nickname: 'My Tesco Card' });

  const detail = await openCard(page, /My Tesco Card/);

  await expect(detail.getByTestId('delete-card-button')).toBeVisible();
  await expect(detail.getByTestId('delete-card-button')).toBeEnabled();
});
