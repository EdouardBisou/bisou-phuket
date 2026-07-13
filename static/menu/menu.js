/* =====================================================
   BISOU PHUKET · /menu
   Standalone, lightweight (no preloader / cursor / Lenis / GSAP).
   Desktop: tab switching + floating hover preview (ported from main.js).
   Mobile:  sticky category chips scroll-spy + tap-to-zoom lightbox.
   ===================================================== */
(() => {
  const qs  = (s, p = document) => p.querySelector(s);
  const qsa = (s, p = document) => Array.from(p.querySelectorAll(s));

  /* ---------- Desktop: tabs (no GSAP, CSS handles the fade) ---------- */
  function wireMenuTabs() {
    const tabs = qsa('[data-menu-tabs] button');
    const panels = qsa('.menu__panel');
    if (!tabs.length) return;
    tabs.forEach((btn) => {
      btn.addEventListener('click', () => {
        const kind = btn.dataset.tab;
        tabs.forEach((b) => b.setAttribute('aria-selected', String(b === btn)));
        panels.forEach((p) => p.classList.toggle('is-active', p.dataset.panel === kind));
      });
    });
  }

  /* ---------- Desktop: floating hover preview ---------- */
  function setDishImage(img, ph, image) {
    if (!img || !ph) return;
    const token = (img.__dishToken = (img.__dishToken || 0) + 1);
    img.classList.remove('is-loaded');
    ph.style.display = '';
    if (!image) { img.removeAttribute('src'); return; }
    if (img.getAttribute('src') === image && img.complete && img.naturalWidth) {
      img.classList.add('is-loaded');
      return;
    }
    const probe = new Image();
    probe.decoding = 'async';
    probe.src = image;
    const reveal = () => {
      if (img.__dishToken !== token) return;
      img.src = image;
      requestAnimationFrame(() => {
        if (img.__dishToken !== token) return;
        img.classList.add('is-loaded');
      });
    };
    const fail = () => {
      if (img.__dishToken !== token) return;
      img.removeAttribute('src');
      img.classList.remove('is-loaded');
    };
    if (typeof probe.decode === 'function') probe.decode().then(reveal).catch(fail);
    else { probe.onload = reveal; probe.onerror = fail; }
  }

  function wireMenuHover() {
    const card = qs('[data-menu-hover]');
    const menu = qs('.menu');
    if (!card || !menu) return;
    const cardImg = qs('.menu-hover__img', card);
    const cardPh = qs('.menu-hover__placeholder', card);
    const CARD_W = 240, CARD_H = 360, OFFSET_X = 20, OFFSET_Y = 20;
    let target = { x: 0, y: 0 }, pos = { x: -9999, y: -9999 }, active = null, raf = null;

    function pickPosition(cx, cy) {
      let x = cx + OFFSET_X, y = cy + OFFSET_Y;
      if (x + CARD_W > window.innerWidth - 8)  x = cx - CARD_W - OFFSET_X;
      if (y + CARD_H > window.innerHeight - 8) y = cy - CARD_H - OFFSET_Y;
      if (x < 8) x = 8;
      if (y < 8) y = 8;
      return { x, y };
    }
    function tick() {
      pos.x += (target.x - pos.x) * 0.20;
      pos.y += (target.y - pos.y) * 0.20;
      card.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0)`;
      raf = active ? requestAnimationFrame(tick) : null;
    }
    function onMove(e) {
      const dish = e.target.closest('[data-dish]');
      if (!dish || !menu.contains(dish)) {
        if (active) { active = null; card.classList.remove('is-visible'); card.setAttribute('aria-hidden', 'true'); }
        return;
      }
      if (dish !== active) {
        active = dish;
        setDishImage(cardImg, cardPh, dish.dataset.dishImage || '');
        const next = pickPosition(e.clientX, e.clientY);
        if (!card.classList.contains('is-visible')) {
          pos.x = next.x; pos.y = next.y;
          card.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0)`;
        }
        card.classList.add('is-visible');
        card.setAttribute('aria-hidden', 'false');
        if (!raf) raf = requestAnimationFrame(tick);
      }
      const next = pickPosition(e.clientX, e.clientY);
      target.x = next.x; target.y = next.y;
    }
    function onLeave() { active = null; card.classList.remove('is-visible'); card.setAttribute('aria-hidden', 'true'); }
    menu.addEventListener('mousemove', onMove);
    menu.addEventListener('mouseleave', onLeave);
  }

  /* ---------- Mobile: sticky chips scroll-spy + tap-to-jump ---------- */
  function wireChips() {
    const chips = qsa('[data-pm-chips] .pm-chip');
    const cats = qsa('[data-pm-cat]');
    if (!chips.length || !cats.length) return;

    const chipFor = (id) => chips.find((c) => c.dataset.chip === id);

    function setActive(id) {
      chips.forEach((c) => c.classList.toggle('is-active', c.dataset.chip === id));
      const active = chipFor(id);
      if (active && active.scrollIntoView) {
        active.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
      }
    }

    // Smooth-scroll on tap (native anchor + scroll-margin handles offset);
    // set active immediately for snappy feedback.
    chips.forEach((chip) => {
      chip.addEventListener('click', (e) => {
        e.preventDefault();
        const id = chip.dataset.chip;
        const section = document.getElementById(id);
        if (section) section.scrollIntoView({ behavior: 'smooth', block: 'start' });
        setActive(id);
      });
    });

    // Scroll-spy: the active category is the one crossing the upper third.
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(entry.target.id);
        });
      },
      { rootMargin: '-45% 0px -50% 0px', threshold: 0 }
    );
    cats.forEach((c) => io.observe(c));
  }

  /* ---------- Mobile: tap-to-zoom lightbox ---------- */
  function wireLightbox() {
    const box = qs('[data-pm-lightbox]');
    if (!box) return;
    const img = qs('.pm-lightbox__img', box);
    const closeBtn = qs('[data-pm-lightbox-close]', box);

    function open(full, alt) {
      img.src = full;
      img.alt = alt || '';
      box.classList.add('is-open');
      box.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    }
    function close() {
      box.classList.remove('is-open');
      box.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      img.removeAttribute('src');
    }

    qsa('[data-pm-zoom]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const full = btn.dataset.full;
        const inner = btn.querySelector('img');
        if (full) open(full, inner ? inner.alt : '');
      });
    });
    box.addEventListener('click', (e) => { if (e.target === box || e.target === img) close(); });
    if (closeBtn) closeBtn.addEventListener('click', close);
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && box.classList.contains('is-open')) close(); });
  }

  /* ---------- EN / РУС segmented toggle ---------- */
  // Swaps the bilingual span pairs by setting html[data-menu-lang]; the build
  // emits both languages so the switch is instant, no re-render. The choice is
  // remembered so a returning guest scanning the QR lands in their language.
  function wireLangToggle() {
    const group = qs('[data-lang-group]');
    if (!group) return;
    const KEY = 'bisou-menu-lang';
    const btns = qsa('button[data-lang]', group);
    const langs = btns.map((b) => b.getAttribute('data-lang'));
    const apply = (lang) => {
      if (lang === 'en') document.documentElement.removeAttribute('data-menu-lang');
      else document.documentElement.setAttribute('data-menu-lang', lang);
      btns.forEach((b) => b.setAttribute('aria-pressed', String(b.getAttribute('data-lang') === lang)));
    };
    let lang = 'en';
    try { const saved = localStorage.getItem(KEY); if (langs.includes(saved)) lang = saved; } catch (e) { /* private mode */ }
    apply(lang);
    btns.forEach((b) => b.addEventListener('click', () => {
      lang = b.getAttribute('data-lang');
      try { localStorage.setItem(KEY, lang); } catch (e) { /* private mode */ }
      apply(lang);
    }));
  }

  function boot() {
    wireMenuTabs();
    wireMenuHover();
    wireChips();
    wireLightbox();
    wireLangToggle();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
