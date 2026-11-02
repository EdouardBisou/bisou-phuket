/* Bisou click tracking for GA4. One delegated listener, no personal data, no dependencies.
   Sends events through the page's gtag(), so they reach every configured property. */
(function () {
  'use strict';
  if (typeof window.gtag !== 'function') return;

  function send(name, params) {
    params = params || {};
    params.page_path = location.pathname;
    params.transport_type = 'beacon';
    try { window.gtag('event', name, params); } catch (e) {}
  }

  function placement(a) {
    if (a.closest('[class*="sticky"]')) return 'sticky_bar';
    if (a.closest('header, nav')) return 'header';
    if (a.closest('footer')) return 'footer';
    var s = a.closest('section[id], [id]');
    return s && s.id ? 'section_' + s.id : 'page_body';
  }

  function classify(a) {
    var raw = a.getAttribute('href') || '';
    if (!raw || raw.charAt(0) === '#') return null;
    var label = (a.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 60);
    if (/^tel:/i.test(raw)) return ['phone_click', { link_url: 'tel', link_text: label }];
    if (/^mailto:/i.test(raw)) {
      var subj = /subject=([^&]*)/i.exec(raw);
      var enquiry = subj && /private/i.test(decodeURIComponent(subj[1]));
      return [enquiry ? 'private_event_enquiry' : 'email_click', { link_url: 'mailto', link_text: label }];
    }
    var u;
    try { u = new URL(raw, location.href); } catch (e) { return null; }
    var host = u.hostname.replace(/^www\./, '');
    var clean = u.origin + u.pathname;
    var here = location.hostname.replace(/^www\./, '');
    if (/bistrochat\.com$/.test(host)) return ['reserve_click', { link_url: clean, placement: placement(a), link_text: label }];
    if (/(^|\.)wa\.me$|whatsapp\.com$/.test(host)) return ['whatsapp_click', { link_url: clean }];
    if (/(^|\.)line\.me$/.test(host)) return ['line_click', { link_url: clean }];
    if (/maps\.app\.goo\.gl$|share\.google$|maps\.apple\.com$/.test(host) || (/google\./.test(host) && /^\/maps/.test(u.pathname)))
      return ['directions_click', { link_url: clean, placement: placement(a) }];
    if (/instagram\.com$/.test(host)) return ['social_click', { network: 'instagram', link_url: clean }];
    if (/facebook\.com$/.test(host)) return ['social_click', { network: 'facebook', link_url: clean }];
    if (/tiktok\.com$/.test(host)) return ['social_click', { network: 'tiktok', link_url: clean }];
    if (host === here) {
      var p = u.pathname.replace(/\/+$/, '') || '/';
      if (p === '/menu') return ['menu_click', { link_url: clean, placement: placement(a) }];
      if (p === '/gift-vouchers') return ['voucher_click', { link_url: clean, placement: placement(a) }];
      if (p === '/private-events') return ['private_events_click', { link_url: clean, placement: placement(a) }];
      if (p.indexOf('/journal/') === 0) return ['journal_click', { link_url: clean }];
      return null;
    }
    if (/novotize\.com$|mise\.systems$/.test(host)) return ['credit_click', { link_url: clean }];
    return ['outbound_click', { link_url: clean, link_host: host }];
  }

  document.addEventListener('click', function (e) {
    var t = e.target;
    if (!t || !t.closest) return;
    var copy = t.closest('.jp-copy');
    if (copy) { send('contact_copy', { kind: /@/.test(copy.textContent) ? 'email' : copy.textContent.replace(/\D/g, '').length >= 8 ? 'phone' : 'address' }); return; }
    var a = t.closest('a[href]');
    if (!a) return;
    var hit = classify(a);
    if (hit) send(hit[0], hit[1]);
  }, true);

  // Gift voucher: form submit and the thank-you page.
  document.addEventListener('submit', function (e) {
    var f = e.target;
    if (f && f.matches && f.matches('[data-gift-form]')) send('begin_checkout', { item_name: 'gift_voucher' });
  }, true);
  if (/^\/gift-vouchers\/thank-you/.test(location.pathname)) send('voucher_purchase_complete', {});

  // Journal articles: count a read once the visitor reaches 75 percent of the page.
  if (/^\/journal\/[^/]+/.test(location.pathname)) {
    var done = false;
    window.addEventListener('scroll', function () {
      if (done) return;
      var h = document.documentElement;
      var seen = (window.scrollY + window.innerHeight) / h.scrollHeight;
      if (seen >= 0.75) { done = true; send('article_read', { article: location.pathname }); }
    }, { passive: true });
  }
})();
