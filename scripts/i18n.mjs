/**
 * Bisou Phuket — homepage internationalization data.
 *
 * Same approach as Bisou Bangkok: the English homepage template is NEVER
 * tokenized. The build renders English, then localizeHomeHtml (build-site.mjs)
 * string-replaces a dictionary of EXACT English snippets with their translations
 * to emit dist/<lang>/index.html. The English page can never regress.
 *
 * Only languages in LOCALES are emitted + advertised via hreflang. STRINGS lives
 * in i18n-strings.json (one object per locale: exact English snippet ->
 * translation). Phuket's menu is English-only (no bilingual spans), so the menu
 * keeps English dish names with translated category labels; no Thai-menu trick.
 */

import { readFileSync } from 'node:fs';

export const LOCALES = ['fr', 'ru', 'zh', 'th'];

export function localeMeta(lang) {
  const map = {
    en: { lang: 'en', ogLocale: 'en_US' },
    fr: { lang: 'fr', ogLocale: 'fr_FR' },
    ru: { lang: 'ru', ogLocale: 'ru_RU' },
    zh: { lang: 'zh', ogLocale: 'zh_CN' },
    th: { lang: 'th', ogLocale: 'th_TH' }
  };
  return map[lang] || map.en;
}

export const LOCALE_LABELS = { en: 'EN', fr: 'FR', ru: 'RU', zh: '中文', th: 'ไทย' };
export const LOCALE_NAMES = { en: 'English', fr: 'Français', ru: 'Русский', zh: '中文', th: 'ไทย' };

export const STRINGS = JSON.parse(
  readFileSync(new URL('./i18n-strings.json', import.meta.url), 'utf-8')
);
