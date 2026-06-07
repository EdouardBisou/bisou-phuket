/* =====================================================
   BISOU BANGKOK   /private-events/   page motion
   GSAP + ScrollTrigger powered. Cinematic reveals,
   hero parallax + scale, chapter image reveals,
   feature image parallax, counters. Gracefully
   degrades to static if JS or GSAP fail.
   ===================================================== */
(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasGsap = typeof window.gsap !== 'undefined';
  const hasScrollTrigger = typeof window.ScrollTrigger !== 'undefined';

  // Mark <html> so CSS can hide reveal targets only when JS is on.
  // If reduced motion or GSAP failed, leave it off so content stays visible.
  if (!reduced && hasGsap && hasScrollTrigger) {
    document.documentElement.classList.add('js-on');
  }

  if (reduced || !hasGsap || !hasScrollTrigger) {
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  // ============================================
  // SCROLL REVEALS   fade + rise
  // ============================================
  document.querySelectorAll('[data-pe-reveal]').forEach((el) => {
    const delay = parseFloat(el.getAttribute('data-pe-reveal-delay') || '0');
    gsap.to(el, {
      opacity: 1,
      y: 0,
      duration: 1.1,
      ease: 'power3.out',
      delay,
      scrollTrigger: {
        trigger: el,
        start: 'top 88%',
        toggleActions: 'play none none none'
      }
    });
  });

  // ============================================
  // HERO   parallax background + fade out as user scrolls past
  // ============================================
  const heroBg = document.querySelector('[data-pe-hero-bg]');
  if (heroBg) {
    gsap.to(heroBg, {
      yPercent: 22,
      ease: 'none',
      scrollTrigger: {
        trigger: '[data-pe-hero]',
        start: 'top top',
        end: 'bottom top',
        scrub: true
      }
    });
    // Fade the entire hero content slightly as it scrolls away (Apple-like)
    gsap.to('.pe-hero__inner', {
      opacity: 0.15,
      y: -40,
      ease: 'none',
      scrollTrigger: {
        trigger: '[data-pe-hero]',
        start: 'top top',
        end: 'bottom 60%',
        scrub: true
      }
    });
  }

  // ============================================
  // ANIMATED COUNTERS
  // ============================================
  document.querySelectorAll('[data-pe-count]').forEach((el) => {
    const target = parseInt(el.getAttribute('data-pe-count'), 10);
    if (!Number.isFinite(target)) return;
    const original = el.textContent;
    const obj = { v: 0 };
    ScrollTrigger.create({
      trigger: el,
      start: 'top 92%',
      once: true,
      onEnter: () => {
        gsap.to(obj, {
          v: target,
          duration: 1.6,
          ease: 'power2.out',
          onUpdate: () => {
            el.textContent = original.replace(/^\d[\d,]*/, Math.round(obj.v).toLocaleString('en-US'));
          }
        });
      }
    });
  });

  // ============================================
  // CHAPTER IMAGES   reveal with scale-down + slow drift
  // Image starts at scale(1.08) then settles to scale(1)
  // as the chapter scrolls into view, then drifts slightly
  // on continued scroll for a cinematic ken-burns feel.
  // ============================================
  document.querySelectorAll('[data-pe-chapter-media]').forEach((media) => {
    const img = media.querySelector('img');
    if (!img) return;

    // Settle: scale 1.08 -> 1.0 as media enters viewport
    gsap.fromTo(
      img,
      { scale: 1.12 },
      {
        scale: 1.0,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: media,
          start: 'top 90%',
          end: 'top 30%',
          scrub: 1
        }
      }
    );

    // Continued slow parallax drift on the image itself
    gsap.to(img, {
      yPercent: -6,
      ease: 'none',
      scrollTrigger: {
        trigger: media,
        start: 'top bottom',
        end: 'bottom top',
        scrub: true
      }
    });
  });

  // ============================================
  // FEATURE IMAGE   slow parallax (bathtub-wine)
  // ============================================
  const featureMedia = document.querySelector('[data-pe-feature-media]');
  if (featureMedia) {
    gsap.to(featureMedia, {
      yPercent: 18,
      ease: 'none',
      scrollTrigger: {
        trigger: featureMedia.closest('.pe-feature'),
        start: 'top bottom',
        end: 'bottom top',
        scrub: true
      }
    });
  }

  // ============================================
  // ARRIVE IMAGE   slow parallax (exterior at night)
  // ============================================
  const arriveMedia = document.querySelector('[data-pe-arrive-media]');
  if (arriveMedia) {
    gsap.to(arriveMedia, {
      yPercent: 12,
      ease: 'none',
      scrollTrigger: {
        trigger: arriveMedia.closest('.pe-arrive'),
        start: 'top bottom',
        end: 'bottom top',
        scrub: true
      }
    });
  }
})();
