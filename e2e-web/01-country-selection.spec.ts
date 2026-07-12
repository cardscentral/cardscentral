import { test, expect } from '@playwright/test';
import { launchFresh } from './helpers';

// Mirrors .maestro/flows/01-country-selection.yaml
test('first launch shows country selection and proceeds to cards list', async ({ page }) => {
  await launchFresh(page);

  await expect(page.getByText('Select your country')).toBeVisible();
  await expect(page.getByTestId('country-SK')).toBeVisible();

  await page.getByTestId('country-SK').click();

  await expect(page.getByTestId('cards-list-screen')).toBeVisible();
});
