/**
 * One-shot seeder: copy the Bangkok menu (categories + items, with dish photos)
 * into the Phuket Sanity project, so Phuket launches with the same menu and the
 * staff edits it from the studio afterwards.
 *
 * Source: Bangkok project `mavecytg` (public read, no token).
 * Target: Phuket project (NEXT_PUBLIC_SANITY_PROJECT_ID) using a write token.
 *
 * Run once: node scripts/seed-menu.mjs   (or: npm run seed:menu)
 * Idempotent: skips a category/item whose title/name already exists in Phuket.
 * Images are best-effort: if a download or upload fails, the item is still
 * created without its photo (add it later in the studio).
 */
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@sanity/client';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
dotenv.config({ path: path.join(ROOT, '.env.local') });
dotenv.config({ path: path.join(ROOT, '.env') });

const token = process.env.SANITY_API_WRITE_TOKEN;
if (!token) {
  console.error('SANITY_API_WRITE_TOKEN missing in .env.local');
  process.exit(1);
}
const projectId =
  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ||
  process.env.SANITY_STUDIO_PROJECT_ID ||
  'phukettodo';
const dataset =
  process.env.NEXT_PUBLIC_SANITY_DATASET ||
  process.env.SANITY_STUDIO_DATASET ||
  'production';

if (projectId === 'phukettodo') {
  console.error('Set NEXT_PUBLIC_SANITY_PROJECT_ID to the real Phuket project id first (.env.local).');
  process.exit(1);
}

const BANGKOK = createClient({
  projectId: 'mavecytg',
  dataset: 'production',
  apiVersion: '2024-10-01',
  useCdn: true,
  perspective: 'published'
});
const PHUKET = createClient({ projectId, dataset, apiVersion: '2024-10-01', token, useCdn: false });

const MENU_QUERY = `*[_type == "menuCategory"] | order(order asc){
  title, "slug": slug.current, kind, order, description, footnote,
  "items": *[_type == "menuItem" && references(^._id)] | order(order asc){
    name, description, price, priceNote, tags, order,
    "imageUrl": image.asset->url
  }
}`;

const slugify = (s) =>
  String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

async function uploadImage(url, label) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    const asset = await PHUKET.assets.upload('image', buf, { filename: `${label}.jpg` });
    return { _type: 'image', asset: { _type: 'reference', _ref: asset._id } };
  } catch (err) {
    console.warn(`    image skipped (${err.message})`);
    return undefined;
  }
}

async function main() {
  console.log(`Seeding menu  mavecytg -> ${projectId}`);
  const cats = await BANGKOK.fetch(MENU_QUERY);
  console.log(`Fetched ${cats.length} categories from Bangkok`);

  let catCount = 0;
  let itemCount = 0;
  for (const cat of cats) {
    let catDoc = await PHUKET.fetch('*[_type=="menuCategory" && title==$t][0]{_id}', { t: cat.title });
    if (!catDoc) {
      catDoc = await PHUKET.create({
        _type: 'menuCategory',
        title: cat.title,
        slug: { _type: 'slug', current: cat.slug || slugify(cat.title) },
        kind: cat.kind,
        order: cat.order ?? 100,
        ...(cat.description ? { description: cat.description } : {}),
        ...(cat.footnote ? { footnote: cat.footnote } : {})
      });
      catCount++;
      console.log(`+ category: ${cat.title}`);
    } else {
      console.log(`= category exists: ${cat.title}`);
    }
    for (const it of cat.items || []) {
      const exists = await PHUKET.fetch('*[_type=="menuItem" && name==$n][0]{_id}', { n: it.name });
      if (exists) continue;
      const image = it.imageUrl ? await uploadImage(it.imageUrl, slugify(it.name)) : undefined;
      await PHUKET.create({
        _type: 'menuItem',
        name: it.name,
        category: { _type: 'reference', _ref: catDoc._id },
        order: it.order ?? 100,
        ...(it.description ? { description: it.description } : {}),
        ...(it.price != null ? { price: it.price } : {}),
        ...(it.priceNote ? { priceNote: it.priceNote } : {}),
        ...(Array.isArray(it.tags) && it.tags.length ? { tags: it.tags } : {}),
        ...(image ? { image } : {})
      });
      itemCount++;
    }
    console.log(`  items created so far: ${itemCount}`);
  }
  console.log(`\nDone. Created ${catCount} categories, ${itemCount} items in ${projectId}.`);
}

main().catch((err) => {
  console.error('SEED FAILED:', err.message);
  process.exit(1);
});
