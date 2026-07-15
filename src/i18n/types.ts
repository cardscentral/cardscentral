/**
 * Shared i18n types. Each language lives in its own file under `locales/`
 * (see `locales/index.ts`), which keeps individual files small and avoids
 * merge conflicts when several languages are edited in parallel.
 */

export type SupportedLanguage =
  | 'en'
  | 'sk'
  | 'cs'
  | 'de'
  | 'pl'
  | 'hu'
  | 'fr'
  | 'es'
  | 'it'
  | 'nl'
  | 'pt'
  | 'ro'
  | 'sv'
  | 'da'
  | 'fi'
  | 'el'
  | 'hr'
  | 'ru'
  | 'ja'
  | 'ko'
  | 'zh'
  | 'th';

export type TranslationKeys =
  | 'myCards'
  | 'settings'
  | 'noCardsYet'
  | 'noCardsSubtitle'
  | 'addCard'
  | 'selectShop'
  | 'searchShops'
  | 'cardNumber'
  | 'enterCardNumber'
  | 'nickname'
  | 'nicknameOptional'
  | 'notes'
  | 'notesOptional'
  | 'saveCard'
  | 'editCard'
  | 'deleteCard'
  | 'deleteConfirm'
  | 'cancel'
  | 'delete'
  | 'scan'
  | 'chooseCountry'
  | 'language'
  | 'country'
  | 'listView'
  | 'gridView'
  | 'import'
  | 'importTitle'
  | 'importDescription'
  | 'importPlaceholder'
  | 'importButton'
  | 'importPickFile'
  | 'importDone'
  | 'importEmpty'
  | 'openApp'
  | 'installApp'
  | 'viewInStore'
  | 'getOnAppStore'
  | 'getOnPlayStore'
  | 'appRequiredBanner'
  | 'appAvailableBanner'
  | 'couldNotOpenApp'
  | 'shareCard'
  | 'shareCardMessage'
  | 'shareFailed'
  | 'linkCopied'
  | 'addSharedTitle'
  | 'addSharedDescription'
  | 'addSharedButton'
  | 'addSharedInvalid'
  | 'addSharedDuplicate'
  | 'addSharedAdded'
  | 'addSharedDescriptionMany'
  | 'addSharedButtonMany'
  | 'addSharedResult'
  | 'sharedByLabel'
  | 'shareBackupCards'
  | 'shareCardsTitle'
  | 'shareCardsMessage'
  | 'shareCardsDescription'
  | 'shareCardsEmpty'
  | 'selectAll'
  | 'shareSelected'
  | 'dataSection'
  | 'aboutSection'
  | 'version'
  | 'appTagline'
  | 'appearanceSection'
  | 'theme'
  | 'themeSystem'
  | 'themeLight'
  | 'themeDark';





/**
 * A complete set of strings for one language. `en` is the source of truth and
 * must be complete; other languages may omit keys and fall back to English on
 * a per-key basis (see `t()` in `index.ts`), so `TranslationMap` allows partial
 * maps. The English table is typed as `Record<TranslationKeys, string>` in its
 * own file to guarantee completeness.
 */
export type TranslationMap = Partial<Record<TranslationKeys, string>>;

/** A guaranteed-complete language table (used for the English base). */
export type FullTranslationMap = Record<TranslationKeys, string>;

