/**
 * Generates a bespoke, on-brand editorial COVER image for a Bisou Phuket journal
 * article. Not AI slop, not a generic stock hero: it takes the real Bisou photo
 * most relevant to the article, smart-crops it to 16:9, layers Bisou's gradients
 * and gilt rule, and sets the article's own title in Bisou's Champagne typeface.
 * Each cover is therefore unique to its article (its photo + its title) and
 * always premium (one controlled design system).
 *
 *   node scripts/build-cover.mjs \
 *     --slug=best-french-restaurants-phuket \
 *     --title="The Best French Restaurants in Phuket" \
 *     --eyebrow="Guide" \
 *     --photo=dishes-spread-1920.jpg \
 *     [--meta="Cherngtalay, Phuket"] [--weight=400]
 *
 * --photo accepts a local file in static/assets/photos/web, a bare Sanity asset
 * id/filename, or a full https URL (dish photos live on the Sanity CDN).
 *
 * Writes static/assets/photos/web/<slug>-cover-1920.jpg and -960.jpg, plus
 * text-free -card- variants, so the article frontmatter just sets:
 *   hero: /assets/photos/web/<slug>-cover-1920.jpg
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Resvg } from '@resvg/resvg-js';
import sharp from 'sharp';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const WEB = path.join(ROOT, 'static', 'assets', 'photos', 'web');
const ASSETS = path.join(ROOT, 'static', 'assets');
const FONTS = path.join(ASSETS, 'fonts');

// Bisou Phuket Sanity project (public CDN reads): dish photos are fetched by id.
const SANITY_PROJECT = '5oq4q4y4';

const W = 1920, H = 1080;
const FONT = 'Champagne & Limousines';
const FONTX = 'Champagne &amp; Limousines'; // XML-escaped for use inside the SVG markup
const FONT_FILES = [
  'Champagne-Limousines.ttf',
  'Champagne-Limousines-Bold.ttf',
  'Champagne-Limousines-Italic.ttf',
  'Champagne-Limousines-BoldItalic.ttf'
].map((f) => path.join(FONTS, f)).filter(existsSync);

// palette
const PAPER = '#F3ECDD', GILT = '#C8A86B', MUTED = '#C9BBA1';

function arg(name, def = '') {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : def;
}
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

async function loadPhoto(ref) {
  const isSanityId = /^[a-f0-9]{20,}-\d+x\d+\.(jpg|jpeg|png|webp)$/i.test(ref);
  if (ref.startsWith('http') || ref.includes('cdn.sanity') || isSanityId) {
    const url = ref.startsWith('http')
      ? `${ref}${ref.includes('?') ? '&' : '?'}w=2200&q=85&fm=jpg&fit=max`
      : `https://cdn.sanity.io/images/${SANITY_PROJECT}/production/${ref}?w=2200&q=85&fm=jpg&fit=max`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`photo fetch ${res.status} for ${ref}`);
    return Buffer.from(await res.arrayBuffer());
  }
  const p = path.isAbsolute(ref) ? ref : path.join(WEB, ref);
  return readFileSync(p);
}

// greedy word-wrap by an estimated max chars per line for the geometric sans
function wrap(title, maxChars) {
  const words = title.split(/\s+/);
  const lines = [];
  let cur = '';
  for (const w of words) {
    const t = cur ? `${cur} ${w}` : w;
    if (t.length > maxChars && cur) { lines.push(cur); cur = w; } else cur = t;
  }
  if (cur) lines.push(cur);
  return lines;
}

async function main() {
  const slug = arg('slug');
  const title = arg('title');
  const eyebrow = (arg('eyebrow', 'Journal')).toUpperCase();
  const meta = (arg('meta', 'bisouphuket.com')).toUpperCase();
  const weight = Number(arg('weight', '400')) || 400;
  if (!slug || !title) { console.error('need --slug and --title'); process.exit(1); }

  // 1) smart-crop the source photo to 16:9, slightly darkened for legibility
  const src = await loadPhoto(arg('photo', 'exterior-night-1920.jpg'));
  const baseJpg = await sharp(src)
    .resize(W, H, { fit: 'cover', position: 'attention' })
    .modulate({ brightness: 0.92, saturation: 1.04 })
    .jpeg({ quality: 90 })
    .toBuffer();
  const baseURI = `data:image/jpeg;base64,${baseJpg.toString('base64')}`;

  const monoFile = path.join(ASSETS, 'b-mark.png');
  const monoURI = existsSync(monoFile) ? `data:image/png;base64,${readFileSync(monoFile).toString('base64')}` : '';

  // 2) type sizing + layout (stacked up from a fixed bottom margin)
  const M = 120;
  const avail = W - 2 * M;
  const len = title.length;
  const fs = len <= 18 ? 142 : len <= 28 ? 120 : len <= 40 ? 100 : len <= 54 ? 84 : 72;
  const maxChars = Math.max(8, Math.floor(avail / (fs * 0.54)));
  const lines = wrap(title, maxChars);
  const lh = Math.round(fs * 1.04);
  const lastBaseline = H - 148;
  const firstBaseline = lastBaseline - (lines.length - 1) * lh;
  const capTop = firstBaseline - fs * 0.72;            // visual top of first line
  const ruleY = Math.round(capTop - 40);
  const eyebrowBaseline = ruleY - 22;

  const titleTspans = lines
    .map((ln, i) => `<tspan x="${M}" y="${firstBaseline + i * lh}">${esc(ln)}</tspan>`)
    .join('');

  const svg = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <defs>
    <linearGradient id="fade" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#0A0908" stop-opacity="0.52"/>
      <stop offset="20%" stop-color="#0A0908" stop-opacity="0.10"/>
      <stop offset="46%" stop-color="#0A0908" stop-opacity="0.06"/>
      <stop offset="68%" stop-color="#0A0908" stop-opacity="0.50"/>
      <stop offset="100%" stop-color="#080706" stop-opacity="0.97"/>
    </linearGradient>
    <linearGradient id="scrim" x1="0" y1="0" x2="0.55" y2="1">
      <stop offset="55%" stop-color="#080706" stop-opacity="0"/>
      <stop offset="100%" stop-color="#080706" stop-opacity="0.42"/>
    </linearGradient>
    <linearGradient id="warm" x1="0" y1="1" x2="1" y2="0">
      <stop offset="0%" stop-color="#6E1A24" stop-opacity="0.42"/>
      <stop offset="42%" stop-color="#6E1A24" stop-opacity="0.0"/>
    </linearGradient>
    <radialGradient id="vig" cx="50%" cy="46%" r="75%">
      <stop offset="62%" stop-color="#000" stop-opacity="0"/>
      <stop offset="100%" stop-color="#000" stop-opacity="0.34"/>
    </radialGradient>
  </defs>

  <image x="0" y="0" width="${W}" height="${H}" preserveAspectRatio="xMidYMid slice" xlink:href="${baseURI}"/>
  <rect width="${W}" height="${H}" fill="url(#vig)"/>
  <rect width="${W}" height="${H}" fill="url(#warm)"/>
  <rect width="${W}" height="${H}" fill="url(#fade)"/>
  <rect width="${W}" height="${H}" fill="url(#scrim)"/>

  ${monoURI ? `<image x="${M}" y="92" width="58" height="58" xlink:href="${monoURI}"/>` : ''}
  <text x="${W - M}" y="128" text-anchor="end" font-family="${FONTX}" font-weight="700" font-size="22" letter-spacing="5" fill="${GILT}">${esc(meta)}</text>

  <text x="${M}" y="${eyebrowBaseline}" font-family="${FONTX}" font-weight="700" font-size="24" letter-spacing="6.5" fill="${GILT}">${esc(eyebrow)}</text>
  <rect x="${M}" y="${ruleY}" width="68" height="2" fill="${GILT}"/>

  <text font-family="${FONTX}" font-weight="${weight}" font-size="${fs}" fill="${PAPER}" letter-spacing="0.5" style="line-height:${lh}px">${titleTspans}</text>

  <rect x="${M}" y="${H - 70}" width="${avail}" height="1" fill="${PAPER}" fill-opacity="0.14"/>
</svg>`;

  // 3) render with the brand font, then encode to web JPGs
  const png = new Resvg(svg, {
    font: { fontFiles: FONT_FILES, loadSystemFonts: false, defaultFontFamily: FONT },
    fitTo: { mode: 'width', value: W }
  }).render().asPng();

  const out1920 = path.join(WEB, `${slug}-cover-1920.jpg`);
  const out960 = path.join(WEB, `${slug}-cover-960.jpg`);
  await sharp(png).jpeg({ quality: 86, mozjpeg: true }).toFile(out1920);
  await sharp(png).resize(960).jpeg({ quality: 84, mozjpeg: true }).toFile(out960);

  // Plain, text-free crop for journal cards: the designed title would be cropped in
  // the small frame and duplicate the card's own title below. Hero + og keep the cover.
  const cardJpg = await sharp(src).resize(W, H, { fit: 'cover', position: 'attention' }).jpeg({ quality: 88, mozjpeg: true }).toBuffer();
  await sharp(cardJpg).jpeg({ quality: 86, mozjpeg: true }).toFile(path.join(WEB, `${slug}-card-1920.jpg`));
  await sharp(cardJpg).resize(960).jpeg({ quality: 84, mozjpeg: true }).toFile(path.join(WEB, `${slug}-card-960.jpg`));

  const kb = (f) => Math.round(readFileSync(f).length / 1024);
  console.log(`[cover] ${path.relative(ROOT, out1920)}  (${kb(out1920)} KB)`);
  console.log(`[cover] ${path.relative(ROOT, out960)}  (${kb(out960)} KB)`);
  console.log(`[cover] title set in ${lines.length} line(s) @ ${fs}px`);
}

main().catch((e) => { console.error('[cover] FAILED:', e.message); process.exit(1); });
