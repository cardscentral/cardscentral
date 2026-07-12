import { test, expect } from '@playwright/test';
import { bootToCardsList, addCard, openCard } from './helpers';

// Mirrors .maestro/flows/04-edit-card.yaml
test('edit a card nickname', async ({ page }) => {
  await bootToCardsList(page);
  await addCard(page, { shop: 'tesco', number: '1234567890123', nickname: 'My Tesco Card' });

  await openCard(page, /My Tesco Card/);

  await page.getByTestId('edit-card-button').click();

  const nickname = page.getByTestId('edit-nickname-input');
  await expect(nickname).toBeVisible();

  // RN's controlled TextInput on web doesn't always react to Playwright's
  // fill() (it sets .value without firing the change event React listens to).
  // Select-all + type char-by-char to reliably drive onChangeText.
  await nickname.click();
  await nickname.press('ControlOrMeta+a');
  await nickname.pressSequentially('Tesco Bratislava');
  await expect(nickname).toHaveValue('Tesco Bratislava');

  await page.getByTestId('save-edit-button').click();

  // Saving returns to the (stale) detail screen via goBack(). React Navigation's
  // stack history doesn't map cleanly to browser back, so instead reload the
  // app: with a country already selected it re-reads storage and lands on the
  // cards list, where the updated nickname must be shown.
  await expect(page.getByTestId('card-detail-screen')).toBeVisible();
  await page.reload();
  await expect(page.getByTestId('cards-list-screen')).toBeVisible();
  await expect(page.getByText(/Tesco Bratislava/).first()).toBeVisible();
});



