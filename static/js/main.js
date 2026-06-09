/* =====================================================
   BISOU PHUKET  ·  main.js
   preloader · lenis · cursor · GSAP timelines
   hero B animation · particles · menu tabs · reveals
   ===================================================== */

(() => {
  const qs  = (s, p = document) => p.querySelector(s);
  const qsa = (s, p = document) => Array.from(p.querySelectorAll(s));
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
                  || new URLSearchParams(location.search).has('static');

  gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

  // -------- footer year
  const yr = qs('[data-year]'); if (yr) yr.textContent = String(new Date().getFullYear());

  // ============================================
  // MENU DATA  (scraped from bisouphuket.com)
  // ============================================
  const MENU = []; // Phuket menu comes from Sanity at build time; no bundled fallback.

  const fmt = (price, note) => {
    if (price == null && !note) return '';
    if (price == null) return note;
    const n = price.toLocaleString('en-US');
    return note ? `${n} THB, ${note}` : `${n} THB`;
  };

  const escAttr = (s) => String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/'/g, '&#39;');

  // ============================================
  // MENU RENDER
  // ============================================
  // Build-time fallback only: if the deploy didn't pre-render the panels (e.g. Sanity
  // was unreachable when Vercel built), render from the bundled MENU constant so the
  // page still works. Normally the HTML already contains the panels.
  function renderMenu() {
    const root = qs('[data-menu-panels]'); if (!root) return;
    if (root.querySelector('.menu__panel')) return; // already pre-rendered at build time
    const kinds = ['food', 'drink', 'wine'];
    kinds.forEach((kind, idx) => {
      const panel = document.createElement('div');
      panel.className = 'menu__panel' + (idx === 0 ? ' is-active' : '');
      panel.dataset.panel = kind;
      MENU.filter(c => c.kind === kind).forEach(cat => {
        const block = document.createElement('div');
        block.className = 'menu__category';
        block.innerHTML = `
          <header class="menu__category-head">
            <h3 class="menu__category-title">${cat.title}</h3>
            ${cat.desc ? `<p class="menu__category-desc">${cat.desc}</p>` : ''}
          </header>
          <ul class="menu__list">
            ${cat.items.map(it => `
              <li class="menu__item"
                  data-dish
                  data-dish-name="${escAttr(it.name)}"
                  data-dish-price="${escAttr(fmt(it.price, it.note))}"
                  data-dish-image="${escAttr(it.image || '')}">
                <div class="menu__item-name">
                  <span>${it.name}</span>
                  ${it.tag ? `<span class="menu__item-tag">${it.tag}</span>` : ''}
                </div>
                <div class="menu__item-price">${fmt(it.price, it.note)}</div>
                ${it.desc ? `<div class="menu__item-desc">${it.desc}</div>` : ''}
              </li>
            `).join('')}
          </ul>
          ${cat.footnote ? `<p class="menu__category-footnote">${cat.footnote}</p>` : ''}
        `;
        panel.appendChild(block);
      });
      root.appendChild(panel);
    });
  }

  // ============================================
  // MENU TABS
  // ============================================
  function wireMenuTabs() {
    const tabs = qsa('[data-menu-tabs] button');
    const panels = qsa('.menu__panel');
    tabs.forEach(btn => {
      btn.addEventListener('click', () => {
        const kind = btn.dataset.tab;
        tabs.forEach(b => b.setAttribute('aria-selected', String(b === btn)));
        panels.forEach(p => p.classList.toggle('is-active', p.dataset.panel === kind));
        gsap.from(`.menu__panel[data-panel="${kind}"] .menu__item`, {
          y: 14, opacity: 0, duration: .8, stagger: 0.018, ease: 'power3.out'
        });
      });
    });
  }

  // ============================================
  // MENU DISH PREVIEW (desktop hover / mobile sheet)
  // ============================================
  function isTouchMode() {
    return matchMedia('(pointer: coarse)').matches;
  }

  // Swap a dish image without ever flashing the previously shown one.
  // Strategy:
  //   - removing the .is-loaded class flips opacity to 0 with NO transition,
  //     so the previous dish disappears the same frame the user clicks.
  //   - the new image is decoded off-DOM (probe.decode) and only assigned
  //     to the visible <img> once paintable, then .is-loaded triggers the
  //     fade-in transition.
  //   - a token guards a fast switch from revealing a stale, superseded
  //     image when the user clicks several dishes in quick succession.
  function setDishImage(img, ph, image) {
    if (!img || !ph) return;
    const token = (img.__dishToken = (img.__dishToken || 0) + 1);

    // Hide the current frame instantly (no transition while .is-loaded
    // is absent) so the previous dish never lingers
    img.classList.remove('is-loaded');
    ph.style.display = '';

    if (!image) {
      img.removeAttribute('src');
      return;
    }

    // Same image, already decoded — reveal without re-loading
    if (img.getAttribute('src') === image && img.complete && img.naturalWidth) {
      img.classList.add('is-loaded');
      return;
    }

    // Preload + decode off-DOM, then atomically swap src once paintable
    const probe = new Image();
    probe.decoding = 'async';
    probe.src = image;
    const reveal = () => {
      if (img.__dishToken !== token) return;
      img.src = image;
      // Force the browser to commit the new src as opacity:0, then on the
      // next frame add .is-loaded so the transition fires from 0 -> 1.
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
    if (typeof probe.decode === 'function') {
      probe.decode().then(reveal).catch(fail);
    } else {
      probe.onload = reveal;
      probe.onerror = fail;
    }
  }

  function setHoverContent(card, image) {
    setDishImage(qs('.menu-hover__img', card), qs('.menu-hover__placeholder', card), image);
  }

  function wireMenuHover() {
    const card = qs('[data-menu-hover]');
    const menu = qs('.menu');
    if (!card || !menu) return;

    const CARD_W = 240, CARD_H = 360, OFFSET_X = 20, OFFSET_Y = 20;
    let target = { x: 0, y: 0 };
    let pos    = { x: -9999, y: -9999 };
    let active = null;
    let raf = null;

    function pickPosition(cx, cy) {
      let x = cx + OFFSET_X;
      let y = cy + OFFSET_Y;
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
        if (active) {
          active = null;
          card.classList.remove('is-visible');
          card.setAttribute('aria-hidden', 'true');
        }
        return;
      }

      if (dish !== active) {
        active = dish;
        setHoverContent(card, dish.dataset.dishImage || '');
        const next = pickPosition(e.clientX, e.clientY);
        // Snap on first activation so card doesn't fly across the screen
        if (!card.classList.contains('is-visible')) {
          pos.x = next.x; pos.y = next.y;
          card.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0)`;
        }
        card.classList.add('is-visible');
        card.setAttribute('aria-hidden', 'false');
        if (!raf) raf = requestAnimationFrame(tick);
      }
      const next = pickPosition(e.clientX, e.clientY);
      target.x = next.x;
      target.y = next.y;
    }

    function onLeave() {
      active = null;
      card.classList.remove('is-visible');
      card.setAttribute('aria-hidden', 'true');
    }

    menu.addEventListener('mousemove', onMove);
    menu.addEventListener('mouseleave', onLeave);
  }

  function wireMenuSheet() {
    const sheet = qs('[data-menu-sheet]');
    const menu  = qs('.menu');
    if (!sheet || !menu) return;

    const img       = qs('.menu-sheet__img', sheet);
    const ph        = qs('.menu-sheet__placeholder', sheet);
    const nameEl    = qs('[data-menu-sheet-name]', sheet);
    const priceEl   = qs('[data-menu-sheet-price]', sheet);
    const backdrop  = qs('[data-menu-sheet-backdrop]', sheet);
    const closeBtn  = qs('[data-menu-sheet-close]', sheet);
    const panel     = qs('.menu-sheet__panel', sheet);

    let lastActive = null;
    let dragStartY = null;

    function open(dish) {
      const image = dish.dataset.dishImage || '';
      const name  = dish.dataset.dishName  || '';
      const price = dish.dataset.dishPrice || '';
      setDishImage(img, ph, image);
      nameEl.textContent  = name;
      priceEl.textContent = price;
      sheet.classList.add('is-open');
      sheet.setAttribute('aria-hidden', 'false');
      if (lastActive && lastActive !== dish) lastActive.classList.remove('is-active');
      dish.classList.add('is-active');
      lastActive = dish;
    }

    function close() {
      sheet.classList.remove('is-open');
      sheet.setAttribute('aria-hidden', 'true');
      if (lastActive) { lastActive.classList.remove('is-active'); lastActive = null; }
      panel.style.transform = '';
    }

    menu.addEventListener('click', (e) => {
      const dish = e.target.closest('[data-dish]');
      if (dish && menu.contains(dish)) open(dish);
    });

    backdrop.addEventListener('click', close);
    if (closeBtn) closeBtn.addEventListener('click', close);

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && sheet.classList.contains('is-open')) close();
    });

    // Drag-down to dismiss
    panel.addEventListener('touchstart', (e) => {
      if (!sheet.classList.contains('is-open')) return;
      dragStartY = e.touches[0].clientY;
    }, { passive: true });
    panel.addEventListener('touchmove', (e) => {
      if (dragStartY == null) return;
      const dy = e.touches[0].clientY - dragStartY;
      if (dy > 0) panel.style.transform = `translateY(${dy}px)`;
    }, { passive: true });
    panel.addEventListener('touchend', (e) => {
      if (dragStartY == null) return;
      const dy = (e.changedTouches[0]?.clientY ?? dragStartY) - dragStartY;
      dragStartY = null;
      if (dy > 80) close();
      else        panel.style.transform = '';
    });
  }

  function wireMenuPreview() {
    if (isTouchMode()) wireMenuSheet();
    else               wireMenuHover();
  }

  // ============================================
  // JOURNAL / BLOG  (seed posts; in production these come from MD files or Sanity)
  // ============================================
  const POSTS = []; // Journal comes from content/journal/*.md at build time; no bundled fallback.

  function renderJournal() {
    const grid = qs('[data-journal-grid]'); if (!grid) return;
    if (grid.querySelector('.journal-card')) return; // already pre-rendered at build time
    const fmtDate = (iso) => new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    grid.innerHTML = POSTS.map(p => `
      <article class="journal-card">
        <a href="#journal-${p.slug}" class="journal-card__media" aria-label="${p.title}">
          <img src="${p.image}" alt="" loading="lazy" />
          <span class="journal-card__cat">${p.cat}</span>
        </a>
        <div class="journal-card__body">
          <div class="journal-card__meta">
            <time datetime="${p.date}">${fmtDate(p.date)}</time>
            <span class="dot"></span>
            <span>${p.readMin} min read</span>
          </div>
          <h3 class="journal-card__title"><a href="#journal-${p.slug}">${p.title}</a></h3>
          <p class="journal-card__excerpt">${p.excerpt}</p>
          <a href="#journal-${p.slug}" class="journal-card__read">
            Read
            <svg viewBox="0 0 24 7" fill="none" aria-hidden="true"><path d="M0 3.5h20M14 0.5l6 3-6 3" stroke="currentColor"/></svg>
          </a>
        </div>
      </article>
    `).join('');
  }

  // ============================================
  // PRELOADER
  // ============================================
  function runPreloader(done) {
    const el = qs('[data-preloader]');
    if (!el || reduced) { if (el) el.classList.add('is-done'); done && done(); return; }
    const logo = qs('[data-preloader-logo]', el);
    const count = qs('[data-preloader-count]', el);
    const counter = { v: 0 };

    const tl = gsap.timeline({
      onComplete() {
        el.classList.add('is-done');
        setTimeout(() => el.remove(), 1200);
        done && done();
      }
    });

    // Fade and scale the real brand B mark in
    tl.fromTo(logo,
      { opacity: 0, scale: 0.92 },
      { opacity: 1, scale: 1, duration: 1.4, ease: 'power3.out' },
    0);
    // Counter ticks while logo settles
    tl.to(counter, {
      v: 100, duration: 1.8, ease: 'power2.inOut',
      onUpdate() { if (count) count.textContent = String(Math.round(counter.v)).padStart(2, '0'); }
    }, 0);
    tl.to(el, { opacity: 0, duration: 0.9, ease: 'power2.out' }, '+=0.2');

    return tl;
  }

  // ============================================
  // LENIS  (smooth scroll)
  // ============================================
  function startLenis() {
    if (reduced || typeof Lenis === 'undefined') return null;
    const lenis = new Lenis({
      duration: 1.25,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 1.4
    });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
    // anchor links
    qsa('a[href^="#"]').forEach(a => {
      a.addEventListener('click', (e) => {
        const id = a.getAttribute('href');
        if (id && id.length > 1) {
          const target = qs(id);
          if (target) { e.preventDefault(); lenis.scrollTo(target, { offset: -60, duration: 1.4 }); }
        }
      });
    });
    return lenis;
  }

  // ============================================
  // NAVIGATION SCROLL STATE + MOBILE SHEET
  // ============================================
  function wireNav() {
    const nav = qs('[data-nav]');
    const toggle = qs('[data-menu-toggle]');
    const sheet = qs('[data-sheet]');
    const close = qs('[data-menu-close]');
    const onScroll = () => { nav && nav.classList.toggle('is-scrolled', window.scrollY > 40); };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    if (toggle && sheet) {
      toggle.addEventListener('click', () => { sheet.removeAttribute('hidden'); sheet.dataset.open = 'true'; });
    }
    if (close && sheet) {
      close.addEventListener('click', () => { sheet.dataset.open = 'false'; setTimeout(() => sheet.setAttribute('hidden',''), 300); });
    }
    qsa('a', sheet).forEach(a => a.addEventListener('click', () => {
      sheet.dataset.open = 'false'; setTimeout(() => sheet.setAttribute('hidden',''), 300);
    }));
  }

  // ============================================
  // CUSTOM CURSOR (magnet-aware)
  // ============================================
  function wireCursor() {
    const cursor = qs('[data-cursor]');
    if (!cursor || matchMedia('(pointer: coarse)').matches) return;
    const target = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const pos = { x: target.x, y: target.y };
    window.addEventListener('mousemove', (e) => { target.x = e.clientX; target.y = e.clientY; });
    const render = () => {
      pos.x += (target.x - pos.x) * 0.18;
      pos.y += (target.y - pos.y) * 0.18;
      cursor.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0)`;
      requestAnimationFrame(render);
    };
    requestAnimationFrame(render);

    // magnet on hover
    const magnets = qsa('a, button, [data-magnet]');
    magnets.forEach(el => {
      el.addEventListener('mouseenter', () => cursor.classList.add('is-hover'));
      el.addEventListener('mouseleave', () => cursor.classList.remove('is-hover'));
    });

    // magnet motion on designated .btn elements
    qsa('[data-magnet]').forEach(el => {
      const strength = 0.28;
      el.addEventListener('mousemove', (e) => {
        const r = el.getBoundingClientRect();
        const x = e.clientX - (r.left + r.width / 2);
        const y = e.clientY - (r.top + r.height / 2);
        el.style.transform = `translate(${x * strength}px, ${y * strength}px)`;
      });
      el.addEventListener('mouseleave', () => { el.style.transform = ''; });
    });
  }

  // ============================================
  // GOLD DUST PARTICLES (canvas)
  // ============================================
  function wireDust() {
    const canvas = qs('[data-dust]');
    if (!canvas || reduced) return { setIntensity(){} };
    const ctx = canvas.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = 0, h = 0;
    let intensity = 1;
    const floating = [];
    const burst = [];

    const resize = () => {
      const r = canvas.getBoundingClientRect();
      w = r.width; h = r.height;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    // ambient drifters (reset to edges when they die) — minimal, quiet
    const AMBIENT = 22;
    for (let i = 0; i < AMBIENT; i++) {
      floating.push({
        x: Math.random() * w,
        y: Math.random() * h,
        r: 0.6 + Math.random() * 2.2,
        vy: -0.08 - Math.random() * 0.16,
        vx: (Math.random() - 0.5) * 0.12,
        a: 0.2 + Math.random() * 0.7,
        t: Math.random() * Math.PI * 2
      });
    }

    const spawnBurst = (count) => {
      for (let i = 0; i < count; i++) {
        const ang = Math.random() * Math.PI * 2;
        const sp = 0.6 + Math.random() * 3.2;
        burst.push({
          x: w / 2 + (Math.random() - 0.5) * 140,
          y: h / 2 + (Math.random() - 0.5) * 260,
          vx: Math.cos(ang) * sp,
          vy: Math.sin(ang) * sp - 0.4,
          life: 0,
          ttl: 120 + Math.random() * 160,
          r: 0.7 + Math.random() * 2.2
        });
      }
    };

    const tick = () => {
      ctx.clearRect(0, 0, w, h);
      // ambient
      for (const p of floating) {
        p.x += p.vx;
        p.y += p.vy;
        p.t += 0.02;
        if (p.y < -10) { p.y = h + 10; p.x = Math.random() * w; }
        if (p.x < -10) p.x = w + 10; if (p.x > w + 10) p.x = -10;
        const twinkle = 0.7 + Math.sin(p.t) * 0.3;
        ctx.beginPath();
        ctx.fillStyle = `rgba(227,203,149,${p.a * twinkle * intensity})`;
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      // burst (disabled: no shatter in minimal version)
      // if (burst.length < 700 && intensity > 0.4) spawnBurst(Math.min(3, Math.floor(intensity * 3)));
      for (let i = burst.length - 1; i >= 0; i--) {
        const d = burst[i];
        d.life++;
        d.x += d.vx; d.y += d.vy;
        d.vy += 0.006;
        const alpha = Math.max(0, 1 - d.life / d.ttl) * intensity;
        ctx.beginPath();
        ctx.fillStyle = `rgba(227,203,149,${alpha * 0.85})`;
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fill();
        if (d.life >= d.ttl || d.y > h + 40 || d.x < -40 || d.x > w + 40) burst.splice(i, 1);
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);

    return { setIntensity(v) { intensity = v; } };
  }

  // ============================================
  // TEXT REVEALS (characters + words + generic)
  // ============================================
  function splitText() {
    qsa('[data-split]').forEach(el => {
      const lines = el.innerHTML.split('<br>');
      const frag = document.createDocumentFragment();
      lines.forEach((line, li) => {
        const lineEl = document.createElement('span');
        lineEl.className = 'split-line';
        lineEl.style.display = 'block';
        // inject raw HTML so nested <em> keeps its class
        const wrap = document.createElement('span');
        wrap.innerHTML = line;
        // wrap each word
        const walk = (node) => {
          const kids = Array.from(node.childNodes);
          kids.forEach(k => {
            if (k.nodeType === 3) {
              const text = k.textContent;
              if (!text) return;
              const parts = text.split(/(\s+)/).filter(p => p.length > 0);
              parts.forEach(p => {
                const s = document.createElement('span');
                s.className = 'split-word';
                s.style.display = 'inline-block';
                s.style.whiteSpace = 'pre';
                s.textContent = p;
                node.insertBefore(s, k);
              });
              node.removeChild(k);
            } else if (k.nodeType === 1) {
              walk(k);
            }
          });
        };
        walk(wrap);
        lineEl.appendChild(wrap);
        frag.appendChild(lineEl);
      });
      el.innerHTML = '';
      el.appendChild(frag);
    });
  }

  function wireReveals() {
    // simple data-reveal
    qsa('[data-reveal]').forEach(el => {
      gsap.to(el, {
        y: 0, opacity: 1, duration: 1, ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 85%' }
      });
    });
    // split word reveals
    qsa('[data-split]').forEach(el => {
      const words = qsa('.split-word', el);
      gsap.to(words, {
        y: 0, opacity: 1, duration: 0.9, ease: 'power3.out', stagger: 0.02,
        scrollTrigger: { trigger: el, start: 'top 80%' }
      });
    });

    // home private-events CTA: arm the accent underline, draw it on enter
    const privCta = qs('.home-private-cta');
    if (privCta) {
      privCta.classList.add('is-anim');
      if (reduced) {
        privCta.classList.add('is-in');
      } else {
        ScrollTrigger.create({
          trigger: privCta, start: 'top 80%', once: true,
          onEnter: () => privCta.classList.add('is-in')
        });
      }
    }
  }

  // ============================================
  // MARQUEE
  // ============================================
  function wireMarquee() {
    const track = qs('[data-marquee]'); if (!track) return;
    const tw = gsap.to(track, {
      xPercent: -50, duration: 10, ease: 'none', repeat: -1
    });
    ScrollTrigger.create({
      trigger: '.marquee', start: 'top bottom', end: 'bottom top',
      onUpdate(self) {
        const dir = self.getVelocity() < 0 ? -1 : 1;
        gsap.to(tw, { timeScale: dir * 1, duration: 0.4, overwrite: true });
      }
    });
  }

  // ============================================
  // GALLERY PARALLAX
  // ============================================
  function wireGalleryParallax() {
    if (reduced) return;
    qsa('[data-parallax]').forEach(el => {
      const speed = parseFloat(el.dataset.parallax) || 0.08;
      gsap.fromTo(el,
        { y: 60 * Math.sign(speed) * -1 },
        { y: 60 * Math.sign(speed), ease: 'none',
          scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true }
        }
      );
    });
  }

  // ============================================
  // THE SIGNATURE HERO B TIMELINE
  // ============================================
  function wireHero(dust) {
    const stage = qs('[data-b-stage]');
    const hero = qs('[data-hero]');
    if (!stage || !hero) return;

    const full = qs('[data-b-full]');
    const top  = qs('[data-b-top]');
    const bot  = qs('[data-b-bot]');
    const line = qs('[data-b-line]');
    const word = qs('[data-hero-word]');
    const after = qs('[data-hero-after]');
    const scroll = qs('[data-hero-scroll]');
    const glow = qs('.hero__glow');
    const molten = qs('[data-molten]');
    const halo = qs('[data-hero-halo]');
    const rays = qs('[data-hero-rays]');
    const shards = qsa('[data-b-shards] .bstage__shard');
    const sticky = qs('[data-hero-sticky]');
    const turbulence = qs('filter#molten feTurbulence');

    const titleSpans = qsa('.hero__title span');
    const tagline = qs('.hero__tagline');

    // ---- HERO ANIMATION: "B" alone -> full "Bisou" wordmark on scroll
    // Wordmark image is the horizontal "Bisou" logo (ratio 2.49:1).
    // The B occupies roughly the leftmost 23% of the image.
    // - Initial: only the B visible (clip the right 77%), shifted right so B is at center.
    // - On scroll: clip opens rightward AND image slides back to center,
    //   producing the effect of "isou" growing out of the fixed B.
    const B_FRACTION = 0.23;          // B occupies left 23% of the wordmark
    const B_CENTER = B_FRACTION / 2;  // 11.5%
    const INIT_X = -B_CENTER * 100;   // -11.5 (xPercent so B center sits on viewport center)
    const FINAL_X = -50;              // full wordmark centered
    const INIT_CLIP = `inset(0 ${(1 - B_FRACTION) * 100}% 0 0)`;
    const FULL_CLIP = `inset(0 0 0 0)`;

    if (!reduced) {
      gsap.set(full, {
        opacity: 0,
        xPercent: INIT_X,
        yPercent: -50,
        clipPath: INIT_CLIP,
        webkitClipPath: INIT_CLIP
      });
      gsap.set([top, bot], { opacity: 0 });
      gsap.set([word], { opacity: 1 });
      gsap.set(tagline, { opacity: 0, y: 10 });
      gsap.set(after, { opacity: 0, y: 24 });
      gsap.set(titleSpans, { y: '110%', opacity: 0 });

      const intro = gsap.timeline({ delay: 0.25 });
      // Soft fade-in of the B
      intro.to(full, { opacity: 1, duration: 1.4, ease: 'power2.out' }, 0);
      // Subtle scale settle on the B
      intro.from(full, { scale: 0.96, duration: 1.4, ease: 'power3.out' }, 0);
      // Tagline emerges
      intro.to(tagline, { opacity: 1, y: 0, duration: 1, ease: 'power2.out' }, 0.7);
      // titleSpans hidden — we use the image, not rendered "Bisou" text
    } else {
      gsap.set(full, {
        opacity: 1, xPercent: FINAL_X, yPercent: -50,
        clipPath: FULL_CLIP, webkitClipPath: FULL_CLIP
      });
      gsap.set(titleSpans, { y: 0, opacity: 1 });
      gsap.set(tagline, { opacity: 1, y: 0 });
    }

    // ---- BREATHING: very subtle, starts after entry wipe completes (delay 3.5s)
    if (!reduced) {
      gsap.to(full, {
        scale: 1.015, duration: 4.5, ease: 'sine.inOut',
        yoyo: true, repeat: -1, delay: 3.5
      });
    }

    // ---- CURSOR PARALLAX (3D tilt via direct CSS custom props, no GSAP writes)
    if (!reduced && !matchMedia('(pointer: coarse)').matches) {
      let tx = 0, ty = 0, cx = 0, cy = 0;
      window.addEventListener('mousemove', (e) => {
        const r = hero.getBoundingClientRect();
        if (e.clientY < r.top || e.clientY > r.bottom) return;
        tx = (e.clientX / window.innerWidth - 0.5) * 8;
        ty = (e.clientY / window.innerHeight - 0.5) * -6;
      });
      const tiltLoop = () => {
        cx += (tx - cx) * 0.08;
        cy += (ty - cy) * 0.08;
        stage.style.setProperty('--rx', cy.toFixed(2) + 'deg');
        stage.style.setProperty('--ry', cx.toFixed(2) + 'deg');
        requestAnimationFrame(tiltLoop);
      };
      stage.style.transform = 'rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg))';
      requestAnimationFrame(tiltLoop);
    }

    // ---- SCROLL CHOREOGRAPHY
    // 0 to 0.55 : the clip opens downward, revealing "i", "s", "o", "u" in sequence
    // 0.55 to 0.80: the full monogram slides up and fades
    // 0.80 to 1.00: a gilded rule settles + subtitle + transition to next section
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: hero,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 0.8,
        onUpdate(self) {
          const p = self.progress;
          // Dust calms during reveal, rises near the transition
          const i = p < 0.5 ? 0.3 + p * 0.4 : Math.max(0, 0.7 - (p - 0.5) * 1.4);
          dust && dust.setIntensity(i);
        }
      }
    });

    // Act 1 (0 to 0.55): clip reveals the rest of the monogram top-to-bottom
    // Interpolate the inset-bottom from 74% (only B visible) to 0% (full monogram)
    tl.to(full, {
      clipPath: 'inset(0 0 0% 0)',
      webkitClipPath: 'inset(0 0 0% 0)',
      duration: 0.55,
      ease: 'none'
    }, 0);

    // As it reveals, the whole stage lifts slightly so the B stays near the top of the screen
    tl.to(stage, { y: -40, duration: 0.55, ease: 'none' }, 0);

    // Tagline fades as user starts scrolling
    tl.to(tagline, { opacity: 0, y: -20, duration: 0.25 }, 0.15);

    // Act 2 (0.55 to 0.80): the revealed monogram lifts and fades out
    tl.to(full, { y: -160, opacity: 0, duration: 0.25, ease: 'power2.in' }, 0.55);
    tl.to(titleSpans, { opacity: 0, y: -40, stagger: 0.02, duration: 0.2, ease: 'power2.in' }, 0.55);
    tl.to(word, { y: -60, opacity: 0, duration: 0.25 }, 0.55);
    tl.to(glow, { opacity: 0, duration: 0.3 }, 0.55);

    // Act 3 (0.7 to 1.0): gilded rule + subtitle + hand off to next section
    tl.fromTo(line, { scaleX: 0, opacity: 0 }, { scaleX: 1, opacity: 1, duration: 0.2, ease: 'power3.out' }, 0.75);
    tl.to(line, { y: 60, duration: 0.2 }, 0.85);
    tl.fromTo(after, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.2 }, 0.82);
    tl.to(after, { opacity: 0, duration: 0.15 }, 0.95);
    tl.to(line, { opacity: 0.3, duration: 0.15 }, 0.95);

    // Hide scroll hint immediately on scroll
    tl.to(scroll, { opacity: 0, duration: 0.1 }, 0.03);
  }

  // Molten filter deferred for performance; CSS drop-shadow only.
  function applyMoltenFilter() { /* no-op */ }

  // ============================================
  // BOOT
  // ============================================
  // ============================================
  // HERO SOUND TOGGLE  (click to unmute the cinematic video)
  // ============================================
  function wireSound() {
    const btn = qs('[data-sound-toggle]');
    const video = qs('[data-hero-video]');
    const bg = qs('.hero__video-bg');
    const label = qs('[data-sound-label]', btn);
    if (!btn || !video) return;

    function setUiOn() {
      btn.classList.add('is-on');
      if (label) label.textContent = 'SOUND ON';
    }
    function setUiOff() {
      btn.classList.remove('is-on');
      if (label) label.textContent = 'SOUND';
    }

    // Sound toggle. iOS Safari is picky about ordering: call play() FIRST inside
    // the user gesture (this anchors the audio session), THEN unmute. Reversing
    // this order causes some iOS versions to silently refuse audio.
    btn.addEventListener('click', () => {
      const willUnmute = video.muted;
      if (willUnmute) {
        if (bg) bg.muted = true; // bg copy stays silent
        // 1. Re-trigger play() inside the user gesture
        const p = video.play();
        // 2. Unmute (iOS prefers this order)
        video.muted = false;

        setUiOn();

        if (p && typeof p.catch === 'function') {
          p.catch((err) => {
            console.warn('[Bisou] Could not enable sound:', err);
            video.muted = true;
            setUiOff();
          });
        }
      } else {
        video.muted = true;
        setUiOff();
      }

      // Keep background copy in sync so the silent loop stays aligned
      if (bg && Math.abs(bg.currentTime - video.currentTime) > 0.2) {
        bg.currentTime = video.currentTime;
      }
    });
  }

  function boot() {
    renderMenu();
    renderJournal();
    wireMenuTabs();
    wireMenuPreview();
    splitText();
    wireNav();
    wireCursor();
    wireSound();
    const lenis = startLenis();
    const dust = wireDust();

    const kick = () => {
      wireMarquee();
      wireGalleryParallax();
      wireReveals();
      wireHero(dust);
      ScrollTrigger.refresh();
    };

    runPreloader(kick);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
