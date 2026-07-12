import { test, expect } from '@playwright/test';
import { bootToCardsList, addCard } from './helpers';

// Mirrors .maestro/flows/02-add-card.yaml
test('add a new loyalty card and see it in the list', async ({ page }) => {
  await bootToCardsList(page);

  await addCard(page, {
    shop: 'tesco',
    number: '1234567890123',
    nickname: 'My Tesco Card',
  });

  await expect(page.getByText(/My Tesco Card/)).toBeVisible();
});
