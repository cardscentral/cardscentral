import { test, expect } from '@playwright/test';
import { bootToCardsList, addCard, openCard } from './helpers';

// Mirrors .maestro/flows/03-view-card-detail.yaml
test('open a card and see its detail screen with the number', async ({ page }) => {
  await bootToCardsList(page);
  await addCard(page, { shop: 'tesco', number: '1234567890123', nickname: 'My Tesco Card' });

  const detail = await openCard(page, /My Tesco Card/);

  // Scope to the detail screen — the number also renders on the list card.
  await expect(detail.getByText(/1234567890123/).first()).toBeVisible();
});
