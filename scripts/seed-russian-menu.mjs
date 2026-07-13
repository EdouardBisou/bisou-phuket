/**
 * One-off seeder: writes Russian translations (titleRu / nameRu) into Sanity
 * for the menu categories and dishes, so /menu can offer the EN/РУС toggle.
 *
 * Safe to re-run: every patch uses setIfMissing, so a translation the staff
 * has already corrected in the studio is NEVER overwritten. To force-refresh
 * a single dish, clear its Russian field in the studio and run again.
 *
 * Usage: node scripts/seed-russian-menu.mjs        (dry run, prints the plan)
 *        node scripts/seed-russian-menu.mjs --write (applies the mutations)
 */

import { createClient } from '@sanity/client';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

function readToken() {
  if (process.env.SANITY_API_WRITE_TOKEN) return process.env.SANITY_API_WRITE_TOKEN;
  try {
    const env = readFileSync(path.join(ROOT, '.env.local'), 'utf-8');
    const m = env.match(/^SANITY_API_WRITE_TOKEN=(.+)$/m);
    return m ? m[1].trim() : '';
  } catch {
    return '';
  }
}

const WRITE = process.argv.includes('--write');
const token = readToken();
if (WRITE && !token) {
  console.error('No SANITY_API_WRITE_TOKEN found (env or .env.local). Aborting.');
  process.exit(1);
}

const client = createClient({
  projectId: '5oq4q4y4',
  dataset: 'production',
  apiVersion: '2024-10-01',
  token,
  useCdn: false
});

// ---------------------------------------------------------------------------
// Category titles (by _id). Restaurant-menu register. Cocktail and wine ITEM
// names stay untranslated on purpose (proper names and bottles stay Latin);
// the staff can add Russian per item in the studio if they ever want it.
// ---------------------------------------------------------------------------
const CATEGORY_RU = {
  'vN4diHvObCIH3xcwe0w2nK': 'Первый поцелуй',
  'lm7HPUxO6sxBngTsnYJF2E': 'Крудо',
  'lm7HPUxO6sxBngTsnYJHTy': 'Закуски',
  'tq26EiOjHN2Z9UTAdS0nnM': 'Фирменные блюда шефа',
  'zp4BnJGF3tCu3385rdbMbf': 'Основные блюда',
  'zp4BnJGF3tCu3385rdbc4n': 'Домашняя паста',
  'lm7HPUxO6sxBngTsnYJbXK': 'Гарниры',
  'zp4BnJGF3tCu3385rdbsI5': 'Десерты и сыр',
  'tq26EiOjHN2Z9UTAdS1D0i': 'Коктейли',
  'lm7HPUxO6sxBngTsnYJu18': 'Безалкогольные коктейли',
  'lm7HPUxO6sxBngTsnYJuUY': 'Вино: шампанское и игристое',
  'lm7HPUxO6sxBngTsnYJuk2': 'Вино белое',
  'zp4BnJGF3tCu3385rdctKP': 'Вино красное'
};

// ---------------------------------------------------------------------------
// Dish names (by _id). Fine-dining register, standard Russian menu
// transliterations for French/Japanese terms; brand names kept in Latin
// (Bisou, BFC, Prunier, Joselito).
// ---------------------------------------------------------------------------
const DISH_RU = {
  // First Kiss
  'zp4BnJGF3tCu3385rdYfa9': 'Французский тост с чёрным трюфелем',
  'vN4diHvObCIH3xcwe0w8B3': 'Французский тост с икрой',
  'tq26EiOjHN2Z9UTAdS0LgW': 'Французский тост с фуа-гра и копчёным угрём',
  'tq26EiOjHN2Z9UTAdS0MSK': 'Тартар из говядины с картофельным мильфёем',
  'lm7HPUxO6sxBngTsnYJEw2': 'Тарталетка с дорадой и юдзу',
  'zp4BnJGF3tCu3385rdZZ0b': 'BFC: жареная курица Bisou',

  // Crudo
  'zp4BnJGF3tCu3385rdYzWF': 'Тартар из голубого тунца, оторо, юдзу, авокадо',
  'lm7HPUxO6sxBngTsnYJGmc': 'Гребешок с Хоккайдо, кокос, огурец',
  'lm7HPUxO6sxBngTsnYJHNm': 'Севиче из мадай, тогараси, пикантное масло',
  'lm7HPUxO6sxBngTsnYJJNe': 'Краб-ролл, французский тост, соус бёр-блан',
  'zp4BnJGF3tCu3385rdYuTN': 'Устрица «Грин Кисс», яблоко, огурец',
  'zp4BnJGF3tCu3385rdYvSv': 'Устрица №4 фин де клер',
  'zp4BnJGF3tCu3385rda51X': 'Плато морепродуктов Bisou',
  'zp4BnJGF3tCu3385rda75l': 'Икра Prunier 30 г, французский тост, луковый дип, крем-фреш',

  // Plates
  'tq26EiOjHN2Z9UTAdS0P8O': 'Тартар из вагю, картофельные чипсы, желток',
  'tq26EiOjHN2Z9UTAdS0Qbo': 'Гужер с сыром конте и хамоном иберико',
  'lm7HPUxO6sxBngTsnYJRyI': 'Мини-бургер с вагю, чеддер, карамелизированный лук',
  'lm7HPUxO6sxBngTsnYJKIw': 'Салат из красного цикория, морковно-имбирная заправка, сыр тет-де-муан',
  'a4f75142-1ac5-449f-b09c-39269bf64080': 'Цветная капуста в темпуре, топлёное масло, песто из зелени',
  'zp4BnJGF3tCu3385rdZuLt': 'Салат романо на углях, цезарь, хрустящая куриная кожа, анчоус',
  'lm7HPUxO6sxBngTsnYJLu2': 'Хамон иберико Joselito',
  'zp4BnJGF3tCu3385rdZTSx': 'Тарелка французских фермерских сыров',

  // Chef Signature
  'zp4BnJGF3tCu3385rdZxFP': 'Говядина Веллингтон, фуа-гра, грибы',
  'lm7HPUxO6sxBngTsnYJUFC': 'Утиная грудка, лук, красный цикорий',
  'zp4BnJGF3tCu3385rda1Sz': 'Сибас в соляной корке фламбе, бёр-блан, масло чили',

  // Mains
  'zp4BnJGF3tCu3385rdbTdd': 'Конфи из групера, зелёная спаржа, горошек, бёр-блан',
  'lm7HPUxO6sxBngTsnYJXAM': 'Щупальце осьминога, жареная кукуруза, гуанчиале, пикантное масло',
  'tq26EiOjHN2Z9UTAdS0wWK': 'Хвост морского чёрта, пряный рис, бёр-блан, гуанчиале',
  'tq26EiOjHN2Z9UTAdS0pnU': 'Стейк из вагю «онглет»',
  'tq26EiOjHN2Z9UTAdS18Cy': 'Иберийская свиная корейка, соус моле, тыква',
  'tq26EiOjHN2Z9UTAdS17lI': 'Бараньи рёбрышки, баклажан, соус рас-эль-ханут',
  'zp4BnJGF3tCu3385rdbZVn': 'Говяжья щека 24 часа томления, картофельный мильфёй',
  'lm7HPUxO6sxBngTsnYJZVu': 'Цыплёнок по-провансальски, соус сюпрем, баскский гарнир',

  // Homemade Pasta
  'lm7HPUxO6sxBngTsnYJaAA': 'Паста с чёрным трюфелем, фаготтини, парижская ветчина, пармезан',
  'tq26EiOjHN2Z9UTAdS19Ei': 'Ньокки, красный песто, тыква',
  'zp4BnJGF3tCu3385rdbhXJ': 'Паста с ндуей, тортеллини, томат, чеснок',
  'ae1eaa32-015e-465b-85b4-2bfe908b90fb': 'Лингвини с голубым крабом, лимонный бёр-блан',

  // Sides
  'c74ea925-4513-41e7-8c1f-c9fc99c25779': 'Французская стручковая фасоль',
  'zp4BnJGF3tCu3385rdbkb5': 'Картофель фри',
  'lm7HPUxO6sxBngTsnYJcD8': 'Картофельное пюре',
  'zp4BnJGF3tCu3385rdbnPT': 'Зелёный салат с голубым сыром',
  'tq26EiOjHN2Z9UTAdS1AqW': 'Брокколини',

  // Dessert & Cheese
  'zp4BnJGF3tCu3385rdbtrX': 'Шоколадное суфле гран-крю, шоколадное мороженое',
  'tq26EiOjHN2Z9UTAdS1BCK': 'Ванильный мильфёй, фундучное мороженое',
  'tq26EiOjHN2Z9UTAdS1C3A': '«Плавающий остров», крем англез, попкорн, карамель',
  'lm7HPUxO6sxBngTsnYJhVO': 'Клубника, крем шантийи, клубничный сорбет',
  'tq26EiOjHN2Z9UTAdS1CtA': 'Сырная тарелка, французские фермерские сыры'
};

// ---------------------------------------------------------------------------

async function main() {
  const ids = [...Object.keys(CATEGORY_RU), ...Object.keys(DISH_RU)];
  const existing = await client.fetch('*[_id in $ids]{_id, name, title, nameRu, titleRu}', { ids });
  const byId = new Map(existing.map((d) => [d._id, d]));

  let planned = 0;
  let skippedFilled = 0;
  let missing = 0;
  const tx = client.transaction();

  for (const [id, ru] of Object.entries(CATEGORY_RU)) {
    const doc = byId.get(id);
    if (!doc) { console.log(`  [missing]  ${id}`); missing++; continue; }
    if (doc.titleRu) { skippedFilled++; continue; }
    console.log(`  [category] ${doc.title}  ->  ${ru}`);
    tx.patch(id, (p) => p.setIfMissing({ titleRu: ru }));
    planned++;
  }

  for (const [id, ru] of Object.entries(DISH_RU)) {
    const doc = byId.get(id);
    if (!doc) { console.log(`  [missing]  ${id}`); missing++; continue; }
    if (doc.nameRu) { skippedFilled++; continue; }
    console.log(`  [dish]     ${doc.name}  ->  ${ru}`);
    tx.patch(id, (p) => p.setIfMissing({ nameRu: ru }));
    planned++;
  }

  console.log(`\n${planned} to write, ${skippedFilled} already translated (kept), ${missing} not found in Sanity.`);

  if (!WRITE) {
    console.log('Dry run. Re-run with --write to apply.');
    return;
  }
  if (!planned) { console.log('Nothing to write.'); return; }
  await tx.commit();
  console.log('Done. Russian translations are live in Sanity; rebuild the site to publish them.');
}

main().catch((e) => { console.error(e.message || e); process.exit(1); });
