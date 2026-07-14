/**
 * Assembles all per-language translation tables into a single map keyed by
 * language code. Each language lives in its own file in this directory, so
 * adding a language is just: create `xx.ts`, add it to `SupportedLanguage`
 * (types.ts), import it here, and (optionally) list it in the picker/country
 * map in `../index.ts`.
 */
import { SupportedLanguage, TranslationMap } from '../types';

import en from './en';
import sk from './sk';
import cs from './cs';
import de from './de';
import pl from './pl';
import hu from './hu';
import fr from './fr';
import es from './es';
import it from './it';
import nl from './nl';
import pt from './pt';
import ro from './ro';
import sv from './sv';
import da from './da';
import fi from './fi';
import el from './el';
import hr from './hr';
import ru from './ru';
import ja from './ja';
import ko from './ko';
import zh from './zh';
import th from './th';

export const translations: Record<SupportedLanguage, TranslationMap> = {
  en,
  sk,
  cs,
  de,
  pl,
  hu,
  fr,
  es,
  it,
  nl,
  pt,
  ro,
  sv,
  da,
  fi,
  el,
  hr,
  ru,
  ja,
  ko,
  zh,
  th,
};
