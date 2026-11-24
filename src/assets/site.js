/* Greenline site script: snap screens, header tone, menu, card rows and the lead form.
   No framework. The pages read fine if this file never runs. */
(function () {
  'use strict';
  var root = document.documentElement;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
  var pad = function (n) { return (n < 10 ? '0' : '') + n; };
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var smooth = reduce ? 'auto' : 'smooth';
  var main = $('#main');
  var screens = main ? $$('.sc', main).filter(function (s) { return s.parentNode === main; }) : [];

  /* ---------- arrival: a screen's content rises in the first time it lands ---------- */
  function countUp(el) {
    var to = parseFloat(el.getAttribute('data-count'));
    if (isNaN(to)) return;
    var pre = el.getAttribute('data-pre') || '', suf = el.getAttribute('data-suf') || '', t0 = 0, dur = 1000;
    el.textContent = pre + '0' + suf;
    var tick = function (now) {
      if (!t0) t0 = now;
      var k = clamp((now - t0) / dur, 0, 1), e = 1 - Math.pow(1 - k, 3);
      el.textContent = pre + Math.round(to * e) + suf;
      if (k < 1) requestAnimationFrame(tick);
    };
    setTimeout(function () { requestAnimationFrame(tick); }, 250);
  }
  function land(s) {
    if (!s || s.classList.contains('in')) return;
    s.classList.add('in');
    setTimeout(function () { s.classList.add('done'); }, 1500);
    if (!reduce) $$('[data-count]', s).forEach(countUp);
  }
  screens.forEach(function (s) {
    $$('.rv', s).forEach(function (el, i) { el.style.setProperty('--i', Math.min(i, 10)); });
  });
  if (reduce || !('IntersectionObserver' in window)) screens.forEach(land);
  else {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { io.unobserve(e.target); land(e.target); } });
    }, { root: main, threshold: 0.3 });
    screens.forEach(function (s) { io.observe(s); });
  }

  /* ---------- header tone and the progress line follow the scroll ---------- */
  var fill = $('.prog i'), theme = $('meta[name="theme-color"]');
  var tops = [], vh = 1, cur = -1, raf = 0;
  function measure() {
    if (!main) return;
    vh = Math.max(1, main.clientHeight);
    tops = screens.map(function (s) { return s.offsetTop; });
  }
  function sync() {
    raf = 0;
    if (!main) return;
    var y = main.scrollTop, probe = y + vh * 0.4, i = 0;
    for (var k = 0; k < tops.length; k++) if (tops[k] <= probe) i = k;
    if (fill) fill.style.transform = 'scaleX(' + Math.min(1, (y + vh) / Math.max(vh, main.scrollHeight)).toFixed(4) + ')';
    if (i === cur) return;
    cur = i;
    var tone = i % 2 ? 'dark' : 'light';
    root.setAttribute('data-tone', tone);
    if (theme) theme.setAttribute('content', tone === 'dark' ? '#0A0A0A' : '#FFFFFF');
    land(screens[i]);
  }
  var queue = function () { if (!raf) raf = requestAnimationFrame(sync); };
  if (main) main.addEventListener('scroll', queue, { passive: true });

  /* ---------- keys: page through the screens when nothing else has focus ---------- */
  function page(dir) {
    if (!screens.length) return;
    var y = main.scrollTop, top = tops[cur], bottom = top + screens[cur].offsetHeight;
    if (dir > 0) {
      if (bottom - (y + vh) > 8) main.scrollBy({ top: vh * 0.85, behavior: smooth });
      else if (cur < screens.length - 1) main.scrollTo({ top: tops[cur + 1], behavior: smooth });
    } else if (y - top > 8) main.scrollBy({ top: -vh * 0.85, behavior: smooth });
    else if (cur > 0) main.scrollTo({ top: tops[cur - 1], behavior: smooth });
  }
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { setMenu(false); return; }
    if (!main || e.altKey || e.ctrlKey || e.metaKey || root.classList.contains('menu-open')) return;
    var t = e.target;
    if (t !== document.body && t !== main && t !== root) return;
    var k = e.key;
    if (k === 'PageDown' || k === 'ArrowDown' || (k === ' ' && !e.shiftKey)) { e.preventDefault(); page(1); }
    else if (k === 'PageUp' || k === 'ArrowUp' || (k === ' ' && e.shiftKey)) { e.preventDefault(); page(-1); }
    else if (k === 'Home') { e.preventDefault(); main.scrollTo({ top: 0, behavior: smooth }); }
    else if (k === 'End') { e.preventDefault(); main.scrollTo({ top: main.scrollHeight, behavior: smooth }); }
  });

  /* ---------- mouse wheel: one notch turns one screen ----------
     Trackpads scroll smoothly and the browser's own snapping handles them. A wheel mouse moves in
     coarse notches that snap straight back, so a burst that starts with a big step is turned
     into a page move here. */
  if (main) {
    var lastWheel = 0, wheelMode = '', lockUntil = 0;
    main.addEventListener('wheel', function (e) {
      var now = e.timeStamp, quiet = now - lastWheel > 200;
      lastWheel = now;
      if (e.ctrlKey || e.shiftKey || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
      if (quiet) wheelMode = (e.deltaMode === 1 || Math.abs(e.deltaY) >= 50) ? 'wheel' : 'pad';
      if (wheelMode !== 'wheel') return;
      e.preventDefault();
      if (now < lockUntil) return;
      lockUntil = now + 650;
      page(e.deltaY > 0 ? 1 : -1);
    }, { passive: false });
  }

  /* ---------- menu: a curtain in the opposite tone of the screen behind it ---------- */
  var burger = $('#burger'), menu = $('#menu');
  function setMenu(open) {
    if (!burger || !menu || open === root.classList.contains('menu-open')) return;
    if (open) root.setAttribute('data-mtone', root.getAttribute('data-tone') === 'dark' ? 'light' : 'dark');
    root.classList.toggle('menu-open', open);
    menu.inert = !open;
    if (main) main.inert = open;
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  }
  if (burger && menu) {
    menu.inert = true;
    burger.addEventListener('click', function () { setMenu(!root.classList.contains('menu-open')); });
    $$('a', menu).forEach(function (a) {
      a.addEventListener('click', function (e) {
        /* the page you are already on: lift the curtain and go back to the top */
        if (a.pathname !== window.location.pathname) return;
        e.preventDefault();
        if (main) main.scrollTo({ top: 0, behavior: 'auto' });
        setMenu(false);
      });
    });
    window.matchMedia('(min-width: 900px)').addEventListener('change', function (m) { if (m.matches) setMenu(false); });
  }

  /* ---------- card rows: active card, progress, arrows ---------- */
  var rows = $$('.row').map(function (row) {
    var cards = $$('.card', row), sec = row.parentNode, meter = $('.meter', sec);
    var bar = meter && $('.track i', meter), cnt = meter && $('.count', meter);
    var prev = meter && $('[data-prev]', meter), next = meter && $('[data-next]', meter), r = 0;
    var stepW = function () { return cards.length > 1 ? cards[1].offsetLeft - cards[0].offsetLeft : row.clientWidth; };
    var upd = function () {
      r = 0;
      var max = row.scrollWidth - row.clientWidth, x = row.scrollLeft, fit = max <= 2;
      var i = Math.round(x / Math.max(1, stepW()));
      if (!fit && x >= max - 2) i = cards.length - 1;
      i = clamp(i, 0, cards.length - 1);
      row.classList.toggle('fit', fit);
      cards.forEach(function (c, n) { c.classList.toggle('on', n === i); });
      if (!meter) return;
      meter.hidden = fit;
      bar.style.setProperty('--w', Math.min(1, (x + row.clientWidth) / Math.max(1, row.scrollWidth)).toFixed(3));
      cnt.textContent = pad(i + 1) + ' / ' + pad(cards.length);
      if (prev) prev.disabled = x <= 2;
      if (next) next.disabled = x >= max - 2;
    };
    var move = function (dir) {
      var n = Math.max(1, Math.floor(row.clientWidth / Math.max(1, stepW())) - 1);
      row.scrollBy({ left: dir * n * stepW(), behavior: smooth });
    };
    row.addEventListener('scroll', function () { if (!r) r = requestAnimationFrame(upd); }, { passive: true });
    if (prev) prev.addEventListener('click', function () { move(-1); });
    if (next) next.addEventListener('click', function () { move(1); });
    upd();
    return upd;
  });

  /* ---------- lead form ---------- */
  var form = $('#lead');
  if (form) {
    var note = $('#lead-note'), send = $('#lead-send'), about = $('#lead-about'), busy = false;
    var say = function (msg, bad) { note.textContent = msg; note.classList.toggle('bad', !!bad); };
    form.setAttribute('novalidate', '');
    /* /contact?service=… arrives from a service screen */
    var asked = '';
    try { asked = (new URLSearchParams(window.location.search).get('service') || '').slice(0, 80); } catch (e) {}
    if (asked) { $('#lead-service').value = asked; about.textContent = 'Enquiry about: ' + asked; about.hidden = false; }
    /* fields are checked by name, not by the required attribute */
    var checks = [['name', function (v) { return v; }], ['email', function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v); }], ['message', function (v) { return v; }]];
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (busy) return;
      var ok = true;
      checks.forEach(function (c) {
        var el = form.elements[c[0]], good = !!c[1](el.value.trim());
        el.parentNode.classList.toggle('bad', !good);
        el.setAttribute('aria-invalid', good ? 'false' : 'true');
        if (!good && ok) el.focus();
        if (!good) ok = false;
      });
      if (!ok) { say('Name, a valid email and a message are needed.', true); return; }
      busy = true; send.disabled = true; send.textContent = 'Sending…';
      say(note.getAttribute('data-idle'));
      var fd = new FormData(form);
      fd.delete('redirect');
      fd.append('page', window.location.pathname);
      fetch(form.action, { method: 'POST', body: fd, headers: { Accept: 'application/json' } })
        .then(function (res) { return res.json(); })
        .then(function (data) {
          if (!data || !data.success) throw new Error('send failed');
          window.location.assign('/thank-you');
        })
        .catch(function () {
          busy = false; send.disabled = false; send.textContent = 'Send message';
          say(note.getAttribute('data-fail'), true);
        });
    });
    form.addEventListener('input', function (e) {
      var f = e.target.parentNode;
      if (f && f.classList.contains('bad')) { f.classList.remove('bad'); e.target.setAttribute('aria-invalid', 'false'); }
    });
    /* while someone types, let the page move freely so the keyboard never fights the snap */
    if (main) {
      form.addEventListener('focusin', function () { main.classList.add('typing'); });
      form.addEventListener('focusout', function () {
        setTimeout(function () { if (!form.contains(document.activeElement)) main.classList.remove('typing'); }, 60);
      });
    }
    /* "Send a message" on the same page goes back up to the form */
    $$('[data-lead]').forEach(function (b) {
      b.addEventListener('click', function (e) {
        e.preventDefault();
        main.scrollTo({ top: 0, behavior: smooth });
        setTimeout(function () { form.elements.name.focus({ preventScroll: true }); }, reduce ? 0 : 750);
      });
    });
  }

  /* ---------- copy email ---------- */
  $$('[data-copy]').forEach(function (btn) {
    var tag = $('span', btn), idle = tag ? tag.textContent : '';
    btn.addEventListener('click', function () {
      var done = function (msg) { if (!tag) return; tag.textContent = msg; setTimeout(function () { tag.textContent = idle; }, 1600); };
      try { navigator.clipboard.writeText(btn.getAttribute('data-copy')).then(function () { done('Copied'); }, function () { done('Select to copy'); }); }
      catch (e) { done('Select to copy'); }
    });
  });

  /* ---------- boot ---------- */
  var settle = function () { measure(); cur = -1; sync(); rows.forEach(function (u) { u(); }); };
  settle();
  var rz;
  window.addEventListener('resize', function () { clearTimeout(rz); rz = setTimeout(settle, 120); });
  window.addEventListener('load', settle);
  window.addEventListener('pageshow', settle);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(settle);

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () { navigator.serviceWorker.register('/sw.js').catch(function () {}); });
  }
})();
