/**
 * Translations entry point.
 *
 * The actual per-language tables now live in `locales/` (one file per
 * language) and are assembled in `locales/index.ts`. This module just
 * re-exports them plus the shared types so existing imports
 * (`import { translations, SupportedLanguage } from './translations'`)
 * keep working.
 */
export { translations } from './locales';
export type { SupportedLanguage, TranslationKeys, TranslationMap } from './types';
