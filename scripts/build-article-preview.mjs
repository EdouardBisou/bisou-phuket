/**
 * Produces a single, self-contained HTML preview of a built journal article, so
 * it can be opened by double-click (no dev server, no Vercel) and looks exactly
 * like the live page: the site CSS is inlined, the cover and wordmark are
 * embedded as base64. Google Fonts still load over the network for exact type.
 *
 *   node scripts/build-article-preview.mjs --slug=best-french-restaurants-phuket
 *   -> press-kit/apercu-<slug>.html
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const slug = (process.argv.find((a) => a.startsWith('--slug=')) || '').slice(7) || 'best-french-restaurants-phuket';

let html = readFileSync(path.join(ROOT, 'dist', 'journal', slug, 'index.html'), 'utf8');

function inlineCss(hrefStart, file) {
  const css = readFileSync(path.join(ROOT, file), 'utf8');
  const re = new RegExp(`<link[^>]*href="${hrefStart.replace(/[/.]/g, '\\$&')}[^"]*"[^>]*>`, 'g');
  html = html.replace(re, `<style>\n${css}\n</style>`);
}
inlineCss('/css/main.css', 'static/css/main.css');
inlineCss('/journal/post.css', 'static/journal/post.css');

function dataUri(assetRelPath) {
  const p = path.join(ROOT, 'static', assetRelPath.replace(/^\//, ''));
  const buf = readFileSync(p);
  const ext = assetRelPath.endsWith('.png') ? 'image/png' : assetRelPath.endsWith('.svg') ? 'image/svg+xml' : 'image/jpeg';
  return `data:${ext};base64,${buf.toString('base64')}`;
}

for (const a of [
  `/assets/photos/web/${slug}-cover-1920.jpg`,
  `/assets/photos/web/${slug}-cover-960.jpg`,
  '/assets/bisou-wordmark.png'
]) {
  try { html = html.split(a).join(dataUri(a)); } catch (e) { console.warn('  ! skip', a, e.message); }
}

// drop analytics in the throwaway preview
html = html.replace(/<script async src="https:\/\/www\.googletagmanager\.com[^<]*<\/script>/g, '');

mkdirSync(path.join(ROOT, 'press-kit'), { recursive: true });
const out = path.join(ROOT, 'press-kit', `apercu-${slug}.html`);
writeFileSync(out, html, 'utf8');
console.log(`[preview] ${path.relative(ROOT, out)}  (${Math.round(html.length / 1024)} KB), double-click to open`);
