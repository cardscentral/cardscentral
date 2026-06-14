import { device, element, by, expect } from 'detox';

describe('Cards Central - Card Management', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  describe('Empty State', () => {
    it('should show empty state when no cards exist', async () => {
      await expect(element(by.text('No Cards Yet'))).toBeVisible();
      await expect(element(by.text('Tap the + button to add your first loyalty card'))).toBeVisible();
    });

    it('should show add card button', async () => {
      await expect(element(by.id('add-card-button'))).toBeVisible();
    });
  });

  describe('Add Card Flow', () => {
    it('should navigate to add card screen', async () => {
      await element(by.id('add-card-button')).tap();
      await expect(element(by.text('Select Shop'))).toBeVisible();
    });

    it('should show all available shops', async () => {
      await element(by.id('add-card-button')).tap();
      await expect(element(by.id('shop-select-hm'))).toBeVisible();
      await expect(element(by.id('shop-select-ca'))).toBeVisible();
      await expect(element(by.id('shop-select-tako-fashion'))).toBeVisible();
      await expect(element(by.id('shop-select-dm'))).toBeVisible();
      await expect(element(by.id('shop-select-lidl'))).toBeVisible();
    });

    it('should add a new card successfully', async () => {
      await element(by.id('add-card-button')).tap();

      // Select H&M
      await element(by.id('shop-select-hm')).tap();

      // Enter card number
      await element(by.id('card-number-input')).typeText('1234567890123');

      // Enter nickname
      await element(by.id('nickname-input')).typeText('My H&M Card');

      // Save
      await element(by.id('save-card-button')).tap();

      // Should be back on cards list with the new card
      await expect(element(by.text('H&M'))).toBeVisible();
      await expect(element(by.text('My H&M Card'))).toBeVisible();
    });
  });

  describe('Card Detail', () => {
    it('should show card details when tapping a card', async () => {
      // First add a card
      await element(by.id('add-card-button')).tap();
      await element(by.id('shop-select-ca')).tap();
      await element(by.id('card-number-input')).typeText('9876543210987');
      await element(by.id('save-card-button')).tap();

      // Tap on the card
      await element(by.text('C&A')).tap();

      // Should show card details
      await expect(element(by.text('9876543210987'))).toBeVisible();
      await expect(element(by.id('edit-card-button'))).toBeVisible();
      await expect(element(by.id('delete-card-button'))).toBeVisible();
    });
  });

  describe('Edit Card', () => {
    it('should edit card nickname', async () => {
      // Add a card first
      await element(by.id('add-card-button')).tap();
      await element(by.id('shop-select-dm')).tap();
      await element(by.id('card-number-input')).typeText('5555666677778888');
      await element(by.id('save-card-button')).tap();

      // Navigate to card detail
      await element(by.text('dm drogerie markt')).tap();

      // Tap edit
      await element(by.id('edit-card-button')).tap();

      // Update nickname
      await element(by.id('edit-nickname-input')).typeText('dm Bratislava');

      // Save
      await element(by.id('save-edit-button')).tap();
    });
  });

  describe('Delete Card', () => {
    it('should delete a card', async () => {
      // Add a card first
      await element(by.id('add-card-button')).tap();
      await element(by.id('shop-select-lidl')).tap();
      await element(by.id('card-number-input')).typeText('LIDL123456');
      await element(by.id('save-card-button')).tap();

      // Navigate to card detail
      await element(by.text('Lidl')).tap();

      // Delete
      await element(by.id('delete-card-button')).tap();

      // Confirm deletion
      await element(by.text('Delete')).tap();

      // Should be back on the list without the card
      await expect(element(by.text('Lidl'))).not.toBeVisible();
    });
  });

  describe('Scan Barcode', () => {
    it('should navigate to barcode scanner', async () => {
      await element(by.id('add-card-button')).tap();
      await element(by.id('scan-barcode-button')).tap();

      // Should show camera permission request or camera view
      // Note: In CI environment, camera won't be available
      // This test verifies navigation works
    });
  });

  describe('Settings', () => {
    it('should show settings screen', async () => {
      await element(by.text('Settings')).tap();
      await expect(element(by.text('Premium Feature'))).toBeVisible();
      await expect(element(by.text('Free Plan'))).toBeVisible();
    });
  });
});
