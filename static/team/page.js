/* =====================================================
   BISOU BANGKOK   /team/   premium UX layer
   Loaded AFTER /private-events/page.js (which already
   handles the base [data-pe-reveal] fades and the
   hero parallax). This file adds team-specific moves.

   Lenis smooth scroll was removed: combined with the
   existing scrub-driven hero parallax it was causing
   stuttery scroll on touch devices. Native scroll is
   the reliable default; the visual moves below still
   give the page its premium feel.
   ===================================================== */
(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (typeof window.gsap === 'undefined') return;
  if (reduced || !window.ScrollTrigger) return;

  // ---------- Antoine diptych: entrance slide + rotation from opposite sides ----------
  const photos = document.querySelectorAll('.founder__photos img');
  photos.forEach((img, i) => {
    const sign = i === 0 ? -1 : 1;
    gsap.fromTo(
      img,
      { x: sign * 50, opacity: 0, rotation: sign * 2.5 },
      {
        x: 0, opacity: 1, rotation: 0,
        duration: 1.3,
        ease: 'power3.out',
        delay: i * 0.14,
        scrollTrigger: { trigger: img, start: 'top 88%', once: true }
      }
    );
  });

  // ---------- Théo single photo: gentle fade + scale-in ----------
  document.querySelectorAll('.founder__media > img').forEach((img) => {
    gsap.fromTo(
      img,
      { scale: 1.06, opacity: 0 },
      {
        scale: 1, opacity: 1,
        duration: 1.4,
        ease: 'power3.out',
        scrollTrigger: { trigger: img, start: 'top 88%', once: true }
      }
    );
  });

  // ---------- Crew card 3D tilt on hover (non-touch) ----------
  const isTouch = matchMedia('(pointer: coarse)').matches;
  const tiltCards = [];
  if (!isTouch) {
    document.querySelectorAll('.team__card').forEach((card) => {
      card.style.transformStyle = 'preserve-3d';
      tiltCards.push(card);
      card.addEventListener('mouseenter', () => {
        gsap.to(card, { y: -8, duration: 0.5, ease: 'power3.out' });
      });
      card.addEventListener('mousemove', (e) => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        gsap.to(card, {
          rotationY: x * 7,
          rotationX: -y * 7,
          transformPerspective: 800,
          duration: 0.5,
          ease: 'power2.out'
        });
      });
      card.addEventListener('mouseleave', () => {
        gsap.to(card, {
          y: 0, rotationY: 0, rotationX: 0,
          duration: 0.8, ease: 'power3.out'
        });
      });
    });

    // Reset any hovered-then-scrolled-past card so it never stays
    // stuck in a tilted state after the cursor "lifts" via scroll.
    let resetTimer;
    window.addEventListener('scroll', () => {
      clearTimeout(resetTimer);
      resetTimer = setTimeout(() => {
        tiltCards.forEach((card) => {
          if (!card.matches(':hover')) {
            gsap.to(card, {
              y: 0, rotationY: 0, rotationX: 0,
              duration: 0.5, ease: 'power3.out'
            });
          }
        });
      }, 120);
    }, { passive: true });
  }

  // ---------- Magnetic CTA buttons (non-touch) ----------
  if (!isTouch) {
    document.querySelectorAll('.pe-cta .btn').forEach((btn) => {
      btn.addEventListener('mousemove', (e) => {
        const r = btn.getBoundingClientRect();
        const x = (e.clientX - r.left - r.width / 2) * 0.3;
        const y = (e.clientY - r.top - r.height / 2) * 0.3;
        gsap.to(btn, { x, y, duration: 0.5, ease: 'power3.out' });
      });
      btn.addEventListener('mouseleave', () => {
        gsap.to(btn, { x: 0, y: 0, duration: 0.7, ease: 'elastic.out(1, 0.5)' });
      });
    });
  }

  // ---------- Scroll progress bar ----------
  // Driven by ScrollTrigger.onUpdate (no scrub tween) — lighter than
  // a scrubbed gsap.to that animates the width on every frame.
  const bar = document.createElement('div');
  bar.className = 'scroll-progress';
  document.body.prepend(bar);
  ScrollTrigger.create({
    start: 0,
    end: 'max',
    onUpdate: (self) => {
      bar.style.width = (self.progress * 100) + '%';
    }
  });

  // ---------- Founder name letter-by-letter reveal ----------
  // Wrap each text-node character in a .split-letter span, preserving
  // any inline children (e.g. the <em> family-name wrapper) so its
  // italic styling stays, then stagger-fade the letters in.
  const splitText = (node) => {
    [...node.childNodes].forEach((child) => {
      if (child.nodeType === 3) {
        const frag = document.createDocumentFragment();
        for (const ch of child.textContent) {
          if (ch === ' ') {
            frag.appendChild(document.createTextNode(' '));
          } else {
            const span = document.createElement('span');
            span.className = 'split-letter';
            span.textContent = ch;
            frag.appendChild(span);
          }
        }
        child.parentNode.replaceChild(frag, child);
      } else if (child.nodeType === 1) {
        splitText(child);
      }
    });
  };
  document.querySelectorAll('.founder__name').forEach((name) => {
    splitText(name);
    const letters = name.querySelectorAll('.split-letter');
    gsap.to(letters, {
      opacity: 1,
      y: 0,
      duration: 0.75,
      ease: 'power3.out',
      stagger: 0.028,
      scrollTrigger: { trigger: name, start: 'top 85%', once: true }
    });
  });
})();
