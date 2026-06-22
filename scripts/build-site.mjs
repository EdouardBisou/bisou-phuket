/**
 * Bisou Phuket — site build script
 *
 * Phase 2 step 2:
 *   - Fetches site content from Sanity (project phukettodo)
 *   - Two injection mechanisms:
 *       1. <!-- BUILD:NAME --> blocks for whole-section replacements (menu, team, journal lists)
 *       2. {{VAR}} mustache placeholders for inline values (phone, email, etc.)
 *   - Copies shared assets from static/
 *   - Writes the deployable site to dist/
 *
 * Run locally:   npm run build
 * Run on Vercel: configured via vercel.json
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { marked } from 'marked';
import { fetchAll } from './sanity-fetch.mjs';
import { LOCALES, localeMeta, LOCALE_LABELS, LOCALE_NAMES, STRINGS } from './i18n.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const TEMPLATES = path.join(ROOT, 'templates');
const STATIC = path.join(ROOT, 'static');
const DIST = path.join(ROOT, 'dist');
const JOURNAL_DIR = path.join(ROOT, 'content', 'journal');

// Journal posts are authored in-repo as markdown (content/journal/*.md),
// not in Sanity. Sanity stays the editing surface for menu + team only.
marked.setOptions({ mangle: false, headerIds: false });

// ---------- helpers ----------
function escHtml(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function escAttr(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/'/g, '&#39;');
}

function fmtPrice(price, priceNote) {
  if (price == null && !priceNote) return '';
  if (price == null) return priceNote;
  const n = Number(price).toLocaleString('en-US');
  return priceNote ? `${n} THB, ${priceNote}` : `${n} THB`;
}

function capitalize(s) {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// Build a Sanity CDN URL with width/quality/format-auto. Falls through unchanged
// if the URL is not a Sanity CDN URL (e.g. legacy WordPress URLs in some fallbacks).
function sanityImg(url, { width, quality = 80, autoFormat = true } = {}) {
  if (!url) return '';
  if (!url.includes('cdn.sanity.io')) return url;
  try {
    const u = new URL(url);
    if (width) u.searchParams.set('w', String(width));
    if (quality) u.searchParams.set('q', String(quality));
    if (autoFormat) u.searchParams.set('auto', 'format');
    return u.toString();
  } catch {
    return url;
  }
}

// Build a srcset string for a Sanity image across the given widths.
function sanitySrcset(url, widths) {
  if (!url || !url.includes('cdn.sanity.io')) return '';
  return widths
    .map((w) => `${sanityImg(url, { width: w })} ${w}w`)
    .join(', ');
}

// Replace <!-- BUILD:NAME -->...<!-- /BUILD:NAME --> with rendered content.
// Leaves the original block alone when render returns null/undefined.
function applyMarker(html, name, rendered) {
  if (rendered == null) return html;
  const re = new RegExp(
    `<!--\\s*BUILD:${name}\\s*-->[\\s\\S]*?<!--\\s*/BUILD:${name}\\s*-->`,
    'g'
  );
  return html.replace(re, `<!-- BUILD:${name} -->\n${rendered}\n<!-- /BUILD:${name} -->`);
}

// Replace {{var}} mustache placeholders. Values must be pre-escaped for their context.
function applyMustache(html, vars) {
  return html.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (match, key) => {
    if (Object.prototype.hasOwnProperty.call(vars, key)) return vars[key];
    console.warn(`[build] unknown placeholder {{${key}}} — leaving as-is`);
    return match;
  });
}

// ---------- journal (markdown files) ----------
// Minimal frontmatter parser: a leading --- block of flat `key: value`
// lines, then the markdown body. No nested YAML, no deps beyond marked.
function parseFrontmatter(raw) {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!m) return { data: {}, body: raw };
  const data = {};
  for (const line of m[1].split(/\r?\n/)) {
    const idx = line.indexOf(':');
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    let val = line.slice(idx + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    data[key] = val;
  }
  return { data, body: m[2] };
}

// Build a width-descriptor srcset for a local /assets/photos/web/<name>-1920.<ext>
// hero by deriving its -960 sibling. Returns '' when the pattern doesn't match.
function localHeroSrcset(src) {
  if (!src) return '';
  const small = src.replace(/-1920\.(jpe?g|png|webp)$/i, '-960.$1');
  return small !== src ? `${small} 960w, ${src} 1920w` : '';
}

// Open external links in a new tab with safe rel attributes; lazy-load any
// inline article images. Applied to the markdown-rendered body HTML.
function enrichArticleHtml(html) {
  return html
    .replace(/<a href="(https?:\/\/[^"]+)"/g, '<a href="$1" target="_blank" rel="noopener noreferrer"')
    .replace(/<img (?![^>]*loading=)/g, '<img loading="lazy" decoding="async" ');
}

// Read every content/journal/*.md, parse frontmatter + render the markdown
// body to HTML, newest first. Posts with `draft: true` are skipped.
async function loadJournalPosts() {
  let files;
  try {
    // Skip _-prefixed files (e.g. _TEMPLATE.md) like the templates/ convention.
    files = (await fs.readdir(JOURNAL_DIR)).filter((f) => f.endsWith('.md') && !f.startsWith('_'));
  } catch {
    return [];
  }
  const posts = [];
  for (const file of files) {
    const raw = await fs.readFile(path.join(JOURNAL_DIR, file), 'utf-8');
    const { data, body } = parseFrontmatter(raw);
    if (String(data.draft).toLowerCase() === 'true') continue;
    posts.push({
      slug: data.slug || file.replace(/\.md$/, ''),
      title: data.title || 'Untitled',
      category: data.category || '',
      excerpt: data.excerpt || '',
      hero: data.hero || '',
      heroAlt: data.heroAlt || '',
      heroFit: data.heroFit || '',
      publishedAt: data.publishedAt || '',
      readMin: data.readMin ? Number(data.readMin) : null,
      seoTitle: data.seoTitle || '',
      seoDescription: data.seoDescription || '',
      author: data.author || '',
      authorRole: data.authorRole || '',
      bodyHtml: enrichArticleHtml(marked.parse(body.trim()))
    });
  }
  posts.sort((a, b) => new Date(b.publishedAt || 0) - new Date(a.publishedAt || 0));
  return posts;
}

// ---------- renderers ----------
function slugify(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Mobile photo menu (/menu): food categories only, rendered as a sticky chip
// bar + photo-grid sections. Each dish is photo + name + price; the full-res
// image goes on data-full for the tap-to-zoom lightbox. A dish without a photo
// still renders (discreet placeholder) so a category never shows a hole.
function renderPhotoMenu(categories) {
  if (!categories || categories.length === 0) return null;
  const food = categories.filter((c) => c.kind === 'food' && (c.items || []).length);
  if (!food.length) return null;

  const chips = food
    .map(
      (cat) =>
        `<a class="pm-chip" href="#cat-${slugify(cat.title)}" data-chip="cat-${slugify(cat.title)}">${escHtml(cat.title)}</a>`
    )
    .join('\n        ');

  const sections = food
    .map((cat) => {
      const cards = (cat.items || [])
        .map((it) => {
          const price = fmtPrice(it.price, it.priceNote);
          const raw = it.image && it.image.url ? it.image.url : '';
          const thumb = raw ? sanityImg(raw, { width: 640, quality: 70 }) : '';
          const full = raw ? sanityImg(raw, { width: 1400, quality: 82 }) : '';
          const media = thumb
            ? `<button class="pm-dish__media" type="button" data-pm-zoom data-full="${escAttr(full)}" aria-label="${escAttr(it.name)}">
              <img class="pm-dish__img" src="${escAttr(thumb)}" alt="${escAttr(it.name)}" loading="lazy" decoding="async" />
            </button>`
            : `<div class="pm-dish__media pm-dish__media--empty" aria-hidden="true"></div>`;
          return `
          <figure class="pm-dish">
            ${media}
            <figcaption class="pm-dish__cap">
              <span class="pm-dish__name">${escHtml(it.name)}</span>
              <span class="pm-dish__price">${escHtml(price)}</span>
            </figcaption>
          </figure>`;
        })
        .join('');
      return `
      <section class="pm-cat" id="cat-${slugify(cat.title)}" data-pm-cat>
        <h2 class="pm-cat__label">${escHtml(cat.title)}</h2>
        <div class="pm-grid">${cards}
        </div>
      </section>`;
    })
    .join('\n');

  return `<nav class="pm-chips" aria-label="Menu categories" data-pm-chips>
        ${chips}
      </nav>
      <div class="pm-sections">${sections}
      </div>`;
}

function renderMenu(categories, { kinds = ['food', 'drink', 'wine'] } = {}) {
  if (!categories || categories.length === 0) return null;

  return kinds
    .map((kind, idx) => {
      const cats = categories.filter((c) => c.kind === kind);
      const isActive = idx === 0 ? ' is-active' : '';
      const panelBody = cats
        .map((cat) => {
          const itemsHtml = (cat.items || [])
            .map((it) => {
              const price = fmtPrice(it.price, it.priceNote);
              const tag = it.tags && it.tags.length ? capitalize(it.tags[0]) : null;
              // For the hover preview the displayed size is ~240x170 desktop, ~80vw on mobile.
              // A 720w variant covers retina at the desktop size and looks crisp on phones.
              const rawImage = it.image && it.image.url ? it.image.url : '';
              const imageUrl = rawImage ? sanityImg(rawImage, { width: 720, quality: 80 }) : '';
              return `
              <li class="menu__item"
                  data-dish
                  data-dish-name="${escAttr(it.name)}"
                  data-dish-price="${escAttr(price)}"
                  data-dish-image="${escAttr(imageUrl)}">
                <div class="menu__item-name">
                  <span>${escHtml(it.name)}</span>
                  ${tag ? `<span class="menu__item-tag">${escHtml(tag)}</span>` : ''}
                </div>
                <div class="menu__item-price">${escHtml(price)}</div>
                ${it.description ? `<div class="menu__item-desc">${escHtml(it.description)}</div>` : ''}
              </li>`;
            })
            .join('');
          return `
        <div class="menu__category">
          <header class="menu__category-head">
            <h3 class="menu__category-title">${escHtml(cat.title)}</h3>
            ${cat.description ? `<p class="menu__category-desc">${escHtml(cat.description)}</p>` : ''}
          </header>
          <ul class="menu__list">${itemsHtml}
          </ul>
          ${cat.footnote ? `<p class="menu__category-footnote">${escHtml(cat.footnote)}</p>` : ''}
        </div>`;
        })
        .join('');
      return `      <div class="menu__panel${isActive}" data-panel="${kind}">${panelBody}
      </div>`;
    })
    .join('\n');
}

// Menu structured data (schema.org/Menu) for the /menu page: helps Google show
// menu rich results and lets AI answer-engines read the full menu + prices.
function renderMenuSchema(categories) {
  if (!categories || !categories.length) return null;
  const sections = categories
    .filter((c) => (c.items || []).length)
    .map((cat) => ({
      '@type': 'MenuSection',
      name: cat.title,
      hasMenuItem: (cat.items || []).map((it) => {
        const item = { '@type': 'MenuItem', name: it.name };
        if (it.description) item.description = it.description;
        if (it.price != null) {
          item.offers = { '@type': 'Offer', price: String(it.price), priceCurrency: 'THB' };
        }
        return item;
      })
    }));
  const menu = {
    '@context': 'https://schema.org',
    '@type': 'Menu',
    '@id': 'https://bisouphuket.com/menu#menu',
    name: 'Bisou Phuket menu',
    inLanguage: 'en',
    isMenuOf: { '@id': 'https://bisouphuket.com/#restaurant' },
    hasMenuSection: sections
  };
  return `<script type="application/ld+json">\n${JSON.stringify(menu, null, 2)}\n</script>`;
}

function fmtDateDisplay(iso) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return '';
  }
}

function renderJournalCard(post) {
  const heroSrc = post.hero || '';
  const srcset = localHeroSrcset(heroSrc);
  const heroSrcset = srcset ? ` srcset="${escAttr(srcset)}" sizes="(max-width: 720px) 90vw, 360px"` : '';
  const date = fmtDateDisplay(post.publishedAt);
  const readTime = post.readMin ? `<span class="dot"></span><span>${post.readMin} min read</span>` : '';
  // Portrait heroes (e.g. the award trophy) get a 4:5 card so the whole
  // image shows instead of a zoomed 16:10 crop.
  const portrait = post.heroFit === 'portrait' ? ' journal-card--portrait' : '';
  return `        <article class="journal-card${portrait}" data-reveal>
          <a href="/journal/${escAttr(post.slug)}" class="journal-card__media" aria-label="${escAttr(post.title)}">
            <img src="${escAttr(heroSrc)}" alt="${escAttr(post.heroAlt || '')}" loading="lazy"${heroSrcset} />
            <span class="journal-card__cat">${escHtml(post.category || '')}</span>
          </a>
          <div class="journal-card__body">
            <div class="journal-card__meta">
              <time datetime="${escAttr(post.publishedAt || '')}">${escHtml(date)}</time>
              ${readTime}
            </div>
            <h3 class="journal-card__title"><a href="/journal/${escAttr(post.slug)}">${escHtml(post.title)}</a></h3>
            ${post.excerpt ? `<p class="journal-card__excerpt">${escHtml(post.excerpt)}</p>` : ''}
            <a href="/journal/${escAttr(post.slug)}" class="journal-card__read">
              Read
              <svg viewBox="0 0 24 7" fill="none" aria-hidden="true"><path d="M0 3.5h20M14 0.5l6 3-6 3" stroke="currentColor"/></svg>
            </a>
          </div>
        </article>`;
}

function renderJournalList(posts, limit = 3) {
  if (!posts || posts.length === 0) return null;
  return posts.slice(0, limit).map(renderJournalCard).join('\n');
}

function renderJournalIndex(posts) {
  if (!posts) return '';
  if (posts.length === 0) {
    return `        <p class="ji-empty">No articles yet. Check back soon.</p>`;
  }
  return posts.map(renderJournalCard).join('\n');
}

function renderTeam(members) {
  if (!members || members.length === 0) return null;
  return members
    .map((m, idx) => {
      const hasPhoto = !!(m.photo && m.photo.url);
      const photoUrl = hasPhoto
        ? sanityImg(m.photo.url, { width: 480, quality: 80 })
        : '/assets/b-mark.png';
      const srcset = hasPhoto ? sanitySrcset(m.photo.url, [320, 480, 720]) : '';
      const srcsetAttr = srcset ? ` srcset="${escAttr(srcset)}" sizes="(max-width: 720px) 50vw, 220px"` : '';
      const photoClass = hasPhoto ? '' : ' team__photo--placeholder';
      const tagline = m.tagline ? `<em>${escHtml(m.tagline)}</em>` : '';
      // Stagger the team-page reveal animation (0.08s per card, like the
      // static cards on /team/ before this section was wired to Sanity).
      const delay = idx === 0 ? '' : ` data-pe-reveal-delay="${(idx * 0.08).toFixed(2)}"`;
      return `        <figure class="team__card" data-pe-reveal${delay}>
          <div class="team__photo${photoClass}">
            <img src="${escAttr(photoUrl)}" alt="${escAttr(m.name)}" loading="lazy"${srcsetAttr} />
          </div>
          <figcaption>
            <span class="eyebrow">${escHtml(m.role || '')}</span>
            <strong>${escHtml(m.name)}</strong>
            ${tagline}
          </figcaption>
        </figure>`;
    })
    .join('\n');
}

// ---------- i18n (localized homepages) ----------
const SITE_URL = 'https://bisouphuket.com';

// Per-locale webfonts: the brand display stack has no CJK/Thai glyphs, so zh/th
// load Noto and repoint the --font-* CSS variables. Russian renders via Poiret
// One (Cyrillic) + Inter already in the stack.
const FONT_HEAD = {
  zh: '  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@300;400;500;700&family=Noto+Serif+SC:wght@400;500;600&display=swap" rel="stylesheet" />\n  <style>html[lang="zh"]{--font-display:"Noto Serif SC","Champagne",serif;--font-serif:"Noto Serif SC",serif;--font-sans:"Noto Sans SC","Inter",sans-serif;}</style>',
  th: '  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Thai:wght@300;400;500;700&family=Noto+Serif+Thai:wght@400;500;600&display=swap" rel="stylesheet" />\n  <style>html[lang="th"]{--font-display:"Noto Serif Thai","Champagne",serif;--font-serif:"Noto Serif Thai",serif;--font-sans:"Noto Sans Thai","Inter",sans-serif;}</style>'
};

// hreflang cluster: English at /, each enabled locale at /<lang>, plus x-default.
function hreflangBlock() {
  const langs = ['en', ...LOCALES];
  const lines = langs.map((l) => {
    const href = l === 'en' ? `${SITE_URL}/` : `${SITE_URL}/${l}`;
    return `  <link rel="alternate" hreflang="${l}" href="${href}" />`;
  });
  lines.push(`  <link rel="alternate" hreflang="x-default" href="${SITE_URL}/" />`);
  return lines.join('\n');
}

// Discreet footer language switcher.
function langSwitcher() {
  const langs = ['en', ...LOCALES];
  const links = langs
    .map((l) => {
      const href = l === 'en' ? '/' : `/${l}`;
      const label = LOCALE_LABELS[l] || l.toUpperCase();
      return `<a href="${href}" hreflang="${l}" style="color:inherit;text-decoration:none;opacity:0.6">${label}</a>`;
    })
    .join('\n        ');
  return `<div style="display:flex;gap:1.1rem;justify-content:center;margin-top:0.9rem;font-size:0.72rem;letter-spacing:0.18em" aria-label="Language">\n        ${links}\n      </div>`;
}

// Nav language switcher, nested in .nav__locations, reusing .nav__location style.
function navSwitcher() {
  const langs = ['en', ...LOCALES];
  const parts = ['<span class="nav__sep-pipe" aria-hidden="true"></span>'];
  langs.forEach((l, i) => {
    if (i > 0) parts.push('<span class="nav__location-sep" aria-hidden="true">·</span>');
    const href = l === 'en' ? '/' : `/${l}`;
    parts.push(`<a class="nav__location nav__lang" href="${href}" hreflang="${l}">${LOCALE_LABELS[l] || l.toUpperCase()}</a>`);
  });
  return parts.join('');
}

// Mobile sheet language switcher.
function sheetSwitcher() {
  const langs = ['en', ...LOCALES];
  const links = langs
    .map((l) => {
      const href = l === 'en' ? '/' : `/${l}`;
      return `<a class="sheet__location sheet__lang" href="${href}" hreflang="${l}">${LOCALE_NAMES[l] || l}</a>`;
    })
    .join('\n      ');
  return `<div class="sheet__locations" aria-label="Language">\n      <span class="sheet__locations-label">Language</span>\n      ${links}\n    </div>`;
}

// Derive a localized homepage from the rendered English HTML (template untouched).
function localizeHomeHtml(html, lang) {
  const meta = localeMeta(lang);
  const url = `${SITE_URL}/${lang}`;
  let out = html;
  // 0. localized pages are one level deep (/<lang>): make relative asset paths root-absolute
  out = out.replace(/(href|src)="(assets\/|css\/|js\/)/g, '$1="/$2');
  // 1. visible copy + meta text
  const dict = STRINGS[lang] || {};
  for (const [en, tr] of Object.entries(dict)) out = out.split(en).join(tr);
  // 2. document language + social locale
  out = out.replace('<html lang="en">', `<html lang="${meta.lang}">`);
  out = out.replace('property="og:locale" content="en_US"', `property="og:locale" content="${meta.ogLocale}"`);
  if (FONT_HEAD[lang]) out = out.replace('</head>', `${FONT_HEAD[lang]}\n</head>`);
  // 3. self-referencing canonical + og:url
  out = out.replace('<link rel="canonical" href="https://bisouphuket.com/" />', `<link rel="canonical" href="${url}" />`);
  out = out.replace('<meta property="og:url" content="https://bisouphuket.com/" />', `<meta property="og:url" content="${url}" />`);
  // 4. drop the English FAQPage JSON-LD so structured data never contradicts the
  //    translated visible FAQ (other JSON-LD blocks are language-neutral facts).
  out = out.replace(/\s*<script type="application\/ld\+json">\s*\{\s*"@context": "https:\/\/schema\.org",\s*"@type": "FAQPage",[\s\S]*?<\/script>/, '');
  return out;
}

// Build the mustache variable bag from settings, with hardcoded fallbacks
// matching the live site's current values. Keeps the page sensible if Sanity is down.
function buildVarBag(settings) {
  const s = settings || {};
  const phone = s.phone || '+66 96 378 9668';
  const phoneTel = phone.replace(/[^\d+]/g, '');
  const email = s.email || 'contact@bisouphuket.com';
  const address = s.address || 'No.4 Bandon-Cherngtalay Rd, Choeng Thale, Thalang, Phuket 83110';
  const hours = s.openingHours || 'Dinner nightly, 6:00 PM to 1:00 AM. Last food order 11 PM.';
  const mapsUrl = s.mapsUrl || 'https://www.google.com/maps/search/Bisou+Phuket+Bandon-Cherngtalay+Rd+Choeng+Thale+Phuket+83110';
  const reservationUrl = s.reservationUrl || 'https://book.bistrochat.com/bisou-phuket';

  return {
    phone: escHtml(phone),
    phone_tel: escAttr(phoneTel),
    email: escHtml(email),
    email_href: escAttr(email),
    address: escHtml(address),
    opening_hours: escHtml(hours),
    maps_url: escAttr(mapsUrl),
    reservation_url: escAttr(reservationUrl)
  };
}

// ---------- file ops ----------
async function rmDir(p) {
  await fs.rm(p, { recursive: true, force: true });
}

async function copyDir(src, dest) {
  await fs.mkdir(dest, { recursive: true });
  const entries = await fs.readdir(src, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue;
    if (entry.name === 'README.md' || entry.name === 'README.txt') continue;
    if (entry.name === 'compress_video.py' || entry.name === 'crop_logos.py') continue;
    if (entry.name === 'hero-original.mp4') continue;
    if (entry.name === 'hero.mp4') continue;
    if (entry.name === 'b-logo-raw.png') continue;
    // Skip the photo masters archive: ~100MB of unoptimized originals that
    // shouldn't ship to production (web/ already has the optimized variants).
    if (entry.name === 'originals') continue;

    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      await copyDir(srcPath, destPath);
    } else {
      await fs.copyFile(srcPath, destPath);
    }
  }
}

async function renderTemplateFile(srcPath, destPath, markers, vars) {
  let html = await fs.readFile(srcPath, 'utf-8');
  for (const [name, rendered] of Object.entries(markers)) {
    html = applyMarker(html, name, rendered);
  }
  html = applyMustache(html, vars);
  await fs.mkdir(path.dirname(destPath), { recursive: true });
  await fs.writeFile(destPath, html, 'utf-8');
}

async function renderTemplatesDir(src, dest, markers, vars) {
  await fs.mkdir(dest, { recursive: true });
  const entries = await fs.readdir(src, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue;
    // Files prefixed with _ are internal templates used by the build (e.g. _post.html).
    // They get rendered per-post by generatePostPages, not copied as-is.
    if (entry.name.startsWith('_')) continue;
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      await renderTemplatesDir(srcPath, destPath, markers, vars);
    } else if (entry.name.endsWith('.html')) {
      await renderTemplateFile(srcPath, destPath, markers, vars);
    } else {
      await fs.copyFile(srcPath, destPath);
    }
  }
}

async function generatePostPages(posts, baseVars) {
  if (!posts || posts.length === 0) return 0;
  const tplPath = path.join(TEMPLATES, 'journal', '_post.html');
  let tpl;
  try {
    tpl = await fs.readFile(tplPath, 'utf-8');
  } catch {
    console.warn('[build] no _post.html template; skipping per-post pages');
    return 0;
  }
  let generated = 0;
  for (const post of posts) {
    if (!post.slug) continue;
    const heroUrl = post.hero || '';
    const heroSrcset = localHeroSrcset(heroUrl);
    const heroClass = post.heroFit === 'portrait' ? 'jp-heroImg jp-heroImg--portrait' : 'jp-heroImg';
    const heroImageBlock = heroUrl
      ? `<img class="${heroClass}" src="${escAttr(heroUrl)}" alt="${escAttr(post.heroAlt || '')}"${heroSrcset ? ` srcset="${escAttr(heroSrcset)}" sizes="(max-width: 760px) 100vw, 720px"` : ''} />`
      : '';
    const description = (post.seoDescription || post.excerpt || '').slice(0, 180);
    const authorBlock = post.author
      ? `<aside class="jp-author">
          <div class="jp-author__meta">
            <strong>${escHtml(post.author)}</strong>
            <em>${escHtml(post.authorRole || '')}</em>
          </div>
        </aside>`
      : '';
    const readtimeBlock = post.readMin
      ? `<span class="jp-bullet">·</span><span class="jp-readtime">${post.readMin} min read</span>`
      : '';
    const excerptBlock = post.excerpt ? `<p class="jp-excerpt">${escHtml(post.excerpt)}</p>` : '';
    // og:image and JSON-LD need an absolute URL; the on-page <img> stays relative.
    const heroAbsolute = heroUrl.startsWith('/') ? `https://bisouphuket.com${heroUrl}` : heroUrl;

    const vars = {
      ...baseVars,
      post_title: escHtml(post.title),
      post_seo_title: escHtml(post.seoTitle || post.title),
      post_title_attr: escAttr(post.seoTitle || post.title),
      post_slug: escAttr(post.slug),
      post_description: escAttr(description),
      post_hero_url: escAttr(heroAbsolute),
      post_hero_image_block: heroImageBlock,
      post_category: escHtml(post.category || ''),
      post_date_iso: escAttr(post.publishedAt || ''),
      post_date_display: escHtml(fmtDateDisplay(post.publishedAt)),
      post_readtime_block: readtimeBlock,
      post_excerpt_block: excerptBlock,
      post_body_html: post.bodyHtml || '<p class="jp-empty">This post has no body yet.</p>',
      post_author_name: escAttr(post.author || 'Bisou Phuket'),
      post_author_block: authorBlock
    };

    const html = applyMustache(tpl, vars);
    const destDir = path.join(DIST, 'journal', post.slug);
    await fs.mkdir(destDir, { recursive: true });
    await fs.writeFile(path.join(destDir, 'index.html'), html, 'utf-8');
    generated += 1;
  }
  return generated;
}

async function summarizeDir(dir) {
  let fileCount = 0;
  let totalBytes = 0;
  async function walk(d) {
    const entries = await fs.readdir(d, { withFileTypes: true });
    for (const entry of entries) {
      const p = path.join(d, entry.name);
      if (entry.isDirectory()) {
        await walk(p);
      } else {
        const stat = await fs.stat(p);
        fileCount += 1;
        totalBytes += stat.size;
      }
    }
  }
  await walk(dir);
  return { fileCount, totalBytes };
}

// ---------- sitemap ----------
// Generated at build time so every journal post (content/journal/*.md) is
// automatically listed for search engines, with lastmod. Core pages + posts.
function generateSitemap(posts, locales = []) {
  const base = 'https://bisouphuket.com';
  const today = new Date().toISOString().slice(0, 10);
  const entries = [
    { loc: '/', changefreq: 'weekly', priority: '1.0', lastmod: today },
    ...locales.map((l) => ({ loc: `/${l}`, changefreq: 'weekly', priority: '0.8', lastmod: today })),
    { loc: '/menu', changefreq: 'weekly', priority: '0.9', lastmod: today },
    { loc: '/private-events', changefreq: 'monthly', priority: '0.8', lastmod: today },
    { loc: '/team', changefreq: 'monthly', priority: '0.6', lastmod: today },
    { loc: '/journal', changefreq: 'weekly', priority: '0.7', lastmod: today }
  ];
  for (const p of posts || []) {
    if (!p.slug) continue;
    const lastmod = p.publishedAt && /^\d{4}-\d{2}-\d{2}/.test(p.publishedAt)
      ? p.publishedAt.slice(0, 10)
      : today;
    entries.push({ loc: `/journal/${p.slug}`, changefreq: 'monthly', priority: '0.7', lastmod });
  }
  const urls = entries
    .map(
      (u) => `  <url>
    <loc>${base}${u.loc}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`
    )
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

// ---------- build ----------
async function build() {
  const startedAt = Date.now();
  console.log('[build] ============================================');
  console.log('[build] START');
  console.log('[build] cwd:', process.cwd());
  console.log('[build] ROOT:', ROOT);
  console.log('[build] TEMPLATES:', TEMPLATES);
  console.log('[build] STATIC:', STATIC);
  console.log('[build] DIST:', DIST);
  console.log('[build] node version:', process.version);
  console.log('[build] ============================================');

  console.log('[build] fetching content from Sanity (menu + team + settings)');
  const data = await fetchAll();
  const dishCount = data.categories.reduce((n, c) => n + (c.items?.length || 0), 0);
  console.log(
    `[build] fetched: ${data.categories.length} categories, ${dishCount} dishes, ${data.team.length} team members`
  );

  console.log('[build] loading journal from content/journal/*.md');
  const journal = await loadJournalPosts();
  console.log(`[build] loaded ${journal.length} journal post(s)`);

  const markers = {
    MENU: renderMenu(data.categories),
    HOME_MENU: renderMenu(data.categories, { kinds: ['food'] }),
    MENU_SCHEMA: renderMenuSchema(data.categories),
    PHOTOMENU: renderPhotoMenu(data.categories),
    HOME_PHOTOMENU: renderPhotoMenu(data.categories),
    TEAM: renderTeam(data.team),
    JOURNAL_LIST: renderJournalList(journal, 3),
    JOURNAL_INDEX: renderJournalIndex(journal)
  };
  const vars = buildVarBag(data.settings);
  vars.hreflang_block = hreflangBlock();
  vars.lang_switcher = langSwitcher();
  vars.lang_nav = navSwitcher();
  vars.lang_sheet = sheetSwitcher();

  console.log('[build] cleaning dist/');
  await rmDir(DIST);
  await fs.mkdir(DIST, { recursive: true });

  console.log('[build] copying static/ -> dist/');
  await copyDir(STATIC, DIST);

  console.log('[build] rendering templates/ -> dist/');
  await renderTemplatesDir(TEMPLATES, DIST, markers, vars);

  if (LOCALES.length) {
    console.log(`[build] localizing homepage -> ${LOCALES.join(', ')}`);
    const enHome = await fs.readFile(path.join(DIST, 'index.html'), 'utf-8');
    for (const lang of LOCALES) {
      const dir = path.join(DIST, lang);
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(path.join(dir, 'index.html'), localizeHomeHtml(enHome, lang), 'utf-8');
      console.log(`[build]   wrote dist/${lang}/index.html`);
    }
  }

  console.log('[build] generating per-post pages');
  const postsGenerated = await generatePostPages(journal, vars);
  console.log(`[build] generated ${postsGenerated} post pages`);

  await fs.writeFile(path.join(DIST, 'sitemap.xml'), generateSitemap(journal, LOCALES), 'utf-8');
  console.log(`[build] generated sitemap.xml (5 core + ${LOCALES.length} locale homepages + ${journal.length} journal posts)`);

  const summary = await summarizeDir(DIST);
  console.log(
    `[build] dist/ contains ${summary.fileCount} files (${(summary.totalBytes / 1024 / 1024).toFixed(2)} MB)`
  );

  // Sanity check that dist/ actually exists and has an index.html
  try {
    await fs.access(path.join(DIST, 'index.html'));
    console.log('[build] verified: dist/index.html exists');
  } catch (err) {
    throw new Error('Build finished but dist/index.html is missing — outputDirectory will fail');
  }

  const ms = Date.now() - startedAt;
  console.log(`[build] ============================================`);
  console.log(`[build] DONE in ${ms}ms`);
  console.log(`[build] ============================================`);
}

build().catch((err) => {
  console.error('[build] ============================================');
  console.error('[build] FAILED');
  console.error('[build] ============================================');
  console.error(err);
  process.exit(1);
});
