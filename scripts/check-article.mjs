// Mechanical QA of a built guide article page (spec section 7).
// usage: node check-guide.mjs <repoRoot> <siteUrl> <slug> [lang]
import fs from 'node:fs';
import path from 'node:path';

const [repo, site, slug, lang = 'en'] = process.argv.slice(2);
const dist = path.join(repo, 'dist');
const page = lang === 'en'
  ? path.join(dist, 'journal', slug, 'index.html')
  : path.join(dist, lang, 'journal', slug, 'index.html');
const html = fs.readFileSync(page, 'utf8');
const fail = [];
const warn = [];

// 1. JSON-LD blocks parse
const lds = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => m[1]);
let faqLd = null, articleLd = null, breadcrumb = null;
for (const [i, raw] of lds.entries()) {
  try {
    const obj = JSON.parse(raw);
    const t = obj['@type'];
    if (t === 'Article') articleLd = obj;
    if (t === 'FAQPage') faqLd = obj;
    if (t === 'BreadcrumbList') breadcrumb = obj;
  } catch (e) {
    fail.push(`JSON-LD block ${i} does not parse: ${e.message}`);
  }
}
if (!articleLd) fail.push('no Article JSON-LD');
else {
  // entity guide only: `about: restaurant` marks the single canonical article
  // ABOUT Bisou, and the build uses it to pick the llms.txt "About Bisou" link.
  // A listicle must not claim it, so only assert it on the entity guide slug.
  if (/-guide$/.test(slug)) {
    if (!articleLd.about || articleLd.about['@id'] !== `${site}/#restaurant`) fail.push('Article.about @id missing/wrong');
  } else if (articleLd.about) {
    fail.push('Article.about set on a non-entity article (it would hijack the llms.txt About link)');
  }
  if (articleLd.inLanguage !== lang) fail.push(`Article.inLanguage = ${articleLd.inLanguage}, expected ${lang}`);
  if (!articleLd.speakable) fail.push('no speakable');
}
if (!faqLd) fail.push('no FAQPage JSON-LD');
else if (faqLd.mainEntity.length !== 8) warn.push(`FAQPage has ${faqLd.mainEntity.length} questions (expected 8)`);
if (!breadcrumb) fail.push('no BreadcrumbList');

// 2. no em/en dashes anywhere in the page
for (const [ch, name] of [['—', 'em dash'], ['–', 'en dash']]) {
  let idx = html.indexOf(ch);
  while (idx !== -1) {
    fail.push(`${name} at ...${html.slice(Math.max(0, idx - 60), idx + 20).replace(/\s+/g, ' ')}...`);
    idx = html.indexOf(ch, idx + 1);
  }
}

// 3. banned words in visible text (rough: strip tags first)
const text = html.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<[^>]+>/g, ' ');
const banned = ['nestled', 'hidden gem', 'culinary journey', 'melt-in-your-mouth', 'foodie', 'must-visit', 'feast for the senses', 'gastronomic', 'reimagined', 'curated experience', 'world-class', 'iconic'];
for (const w of banned) {
  const re = new RegExp(`\\b${w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i');
  if (re.test(text)) fail.push(`banned word: ${w}`);
}
if (/fine dining/i.test(text)) warn.push('the phrase "fine dining" appears in visible text (check it is not describing Bisou)');

// 4. internal links resolve to files in dist
const hrefs = [...html.matchAll(/href="(\/[^"#]*)(?:#[^"]*)?"/g)].map((m) => m[1]);
for (const h of new Set(hrefs)) {
  if (h.startsWith('/assets') || h.startsWith('/css') || h.startsWith('/js') || h.startsWith('/journal/post.css')) {
    const f = path.join(dist, h.split('?')[0]);
    if (!fs.existsSync(f)) fail.push(`asset 404: ${h}`);
    continue;
  }
  const clean = h.split('?')[0].replace(/\/$/, '');
  const cand = [path.join(dist, clean, 'index.html'), path.join(dist, clean + '.html'), path.join(dist, clean)];
  if (!cand.some((c) => fs.existsSync(c))) fail.push(`internal link 404: ${h}`);
}

// 5. chips anchors match real ids
const chip = [...html.matchAll(/class="jp-chips"[\s\S]*?<\/nav>/g)][0];
if (!chip) fail.push('no jp-chips block');
else {
  const anchors = [...chip[0].matchAll(/href="#([^"]+)"/g)].map((m) => m[1]);
  for (const a of anchors) if (!html.includes(`id="${a}"`)) fail.push(`chip anchor #${a} has no matching id`);
}

// 6. guide layer present
for (const marker of ['jp-guide', 'jp-card__lead', 'jp-actbar', 'jp-dishes__t']) {
  if (!html.includes(marker)) fail.push(`guide marker missing: ${marker}`);
}
// cards count
const cards = (html.match(/<section class="jp-card"/g) || []).length;
if (cards < 8) fail.push(`only ${cards} jp-card sections`);

// 7. hero image exists
const hero = html.match(/class="jp-heroImg[^"]*" src="([^"]+)"/);
if (hero && hero[1].startsWith('/') && !fs.existsSync(path.join(dist, hero[1]))) fail.push(`hero 404: ${hero[1]}`);

// 8. accents survived (spot checks, EN only)
if (lang === 'en') {
  // Only flag an accent that got stripped, not one the article never used:
  // compare against the markdown source rather than a fixed list.
  const mdPath = path.join(repo, 'content', 'journal', `${slug}.md`);
  const md = fs.existsSync(mdPath) ? fs.readFileSync(mdPath, 'utf8') : '';
  for (const a of ['Théo', 'soufflé', 'flambé', 'Côte', 'à la carte']) {
    if (md.includes(a) && !html.includes(a)) warn.push(`accented string lost in build: ${a}`);
  }
}

console.log(`[check] ${site} ${slug} [${lang}] cards=${cards} lds=${lds.length}`);
if (warn.length) console.log('WARN:\n- ' + warn.join('\n- '));
if (fail.length) { console.log('FAIL:\n- ' + fail.join('\n- ')); process.exit(1); }
console.log('PASS');
