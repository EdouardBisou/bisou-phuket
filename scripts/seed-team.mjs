/**
 * One-shot seeder: create the Bisou Phuket crew as teamMember docs in Sanity.
 * Photos are optional: a member without a photoFile (or whose file is missing)
 * is created without one, and the site renders the B-mark placeholder until a
 * real photo is added in the studio.
 *
 * Run once: node scripts/seed-team.mjs
 * Safe to run again: it skips creation if a teamMember with the same name exists.
 */

import dotenv from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@sanity/client';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

// .env.local first (Next.js convention), then .env as fallback
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

const client = createClient({
  projectId,
  dataset,
  apiVersion: '2024-10-01',
  token,
  useCdn: false
});

// Phuket crew. Add `photoFile: 'static/assets/photos/web/<name>.jpg'` once real
// photos exist; until then each seeds without a photo (B-mark placeholder shows).
const MEMBERS = [
  { name: 'Louis Chartier', role: 'Co-Owner & General Manager', order: 10 },
  { name: 'Manon Bares', role: 'Co-Owner & Head Chef', order: 20 }
];

async function ensureMember(m) {
  console.log(`\n— ${m.name}`);

  const existing = await client.fetch(
    '*[_type == "teamMember" && name == $name][0]{_id, name}',
    { name: m.name }
  );
  if (existing) {
    console.log(`  already exists (id ${existing._id}), skipping`);
    return existing._id;
  }

  let photo;
  if (m.photoFile) {
    const photoPath = path.join(ROOT, m.photoFile);
    if (fs.existsSync(photoPath)) {
      console.log(`  uploading photo: ${path.basename(photoPath)}`);
      const buf = fs.readFileSync(photoPath);
      const ext = path.extname(photoPath).slice(1).toLowerCase();
      const contentType =
        ext === 'avif' ? 'image/avif' : ext === 'png' ? 'image/png' : 'image/jpeg';
      const asset = await client.assets.upload('image', buf, {
        filename: path.basename(photoPath),
        contentType
      });
      console.log(`  asset uploaded: ${asset._id}`);
      photo = { _type: 'image', asset: { _type: 'reference', _ref: asset._id } };
    } else {
      console.log(`  photo file not found, creating without photo: ${m.photoFile}`);
    }
  } else {
    console.log('  no photo set, creating without one');
  }

  const doc = await client.create({
    _type: 'teamMember',
    name: m.name,
    role: m.role,
    order: m.order,
    ...(photo ? { photo } : {})
  });
  console.log(`  created teamMember: ${doc._id}`);
  return doc._id;
}

async function main() {
  console.log(`Seeding teamMember docs into Sanity (project ${projectId})`);
  for (const m of MEMBERS) {
    await ensureMember(m);
  }

  console.log('\nVerifying...');
  const all = await client.fetch(
    '*[_type == "teamMember"] | order(order asc){_id, name, role, order, "hasPhoto": defined(photo.asset)}'
  );
  console.log(JSON.stringify(all, null, 2));
  console.log(`\nDone. ${all.length} team member(s) in Sanity.`);
}

main().catch((err) => {
  console.error('SEED FAILED:', err.message);
  process.exit(1);
});
