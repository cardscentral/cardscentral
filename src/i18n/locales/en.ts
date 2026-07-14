import { FullTranslationMap } from '../types';

// English is the source of truth and MUST define every key — other languages
// may omit keys and fall back to these values (see `t()` in ../index.ts).
const en: FullTranslationMap = {

  myCards: 'My Cards',
  settings: 'Settings',
  noCardsYet: 'No Cards Yet',
  noCardsSubtitle: 'Tap the + button to add your first loyalty card',
  addCard: 'Add Card',
  selectShop: 'Select Shop',
  searchShops: 'Search shops...',
  cardNumber: 'Card Number',
  enterCardNumber: 'Enter card number',
  nickname: 'Nickname',
  nicknameOptional: 'Nickname (optional)',
  notes: 'Notes',
  notesOptional: 'Notes (optional)',
  saveCard: 'Save Card',
  editCard: 'Edit Card',
  deleteCard: 'Delete Card',
  deleteConfirm: 'Are you sure you want to delete this card? This cannot be undone.',
  cancel: 'Cancel',
  delete: 'Delete',
  scan: 'Scan',
  chooseCountry: 'Select your country',
  language: 'Language',
  country: 'Country',
  premium: 'Premium',
  premiumDescription: 'Sync cards across devices (coming soon)',
  listView: 'List view',
  gridView: 'Grid view',
  import: 'Import cards',
  importTitle: 'Import cards',
  importDescription: 'Already have your cards as a JSON export (e.g. from a self-hosted VoucherVault that supports data export)? Paste the JSON below or pick the file. Not every app offers an export \u2014 if yours doesn\u2019t, just add cards manually with the + button.',

  importPlaceholder: 'Paste VoucherVault export JSON here',
  importButton: 'Import',
  importPickFile: 'Pick a file\u2026',
  importDone: 'Done',
  importEmpty: 'Nothing to import yet.',
  openApp: 'Open app',
  installApp: 'Install app',
  viewInStore: 'View in store',
  getOnAppStore: 'Get on the App Store',
  getOnPlayStore: 'Get on Google Play',
  appRequiredBanner: 'This program uses the retailer\u2019s own app. Open it to show your card and collect points \u2014 the number below is a backup.',
  appAvailableBanner: 'This retailer has an official app with extra features. Open or install it below.',
  couldNotOpenApp: 'Could not open the app or store.',
};

export default en;
