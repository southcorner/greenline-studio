/* Greenline site script: scroll effects, booking sheet, and the 3D line behind the page.
   No framework. Everything is optional: the pages read fine if this file never runs. */
(function () {
  'use strict';
  var root = document.documentElement;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var store = {
    get: function (k) { try { return window.sessionStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { window.sessionStorage.setItem(k, v); } catch (e) {} }
  };
  if (store.get('gl-lite') === '1') root.classList.add('lite');

  /* ---------- reveal on scroll ---------- */
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.01 });
    $$('[data-rv],[data-io]').forEach(function (el) { io.observe(el); });
  } else {
    $$('[data-rv],[data-io]').forEach(function (el) { el.classList.add('in'); });
  }

  /* ---------- counters ---------- */
  function countUp(el) {
    var to = parseFloat(el.getAttribute('data-count')), dec = +(el.getAttribute('data-dec') || 0);
    if (isNaN(to)) return;
    var pre = el.getAttribute('data-pre') || '', suf = el.getAttribute('data-suf') || '';
    var t0 = performance.now(), dur = 1400;
    (function tick(now) {
      var k = clamp((now - t0) / dur, 0, 1), e = 1 - Math.pow(1 - k, 3);
      el.textContent = pre + (to * e).toFixed(dec) + suf;
      if (k < 1) requestAnimationFrame(tick);
    })(t0);
  }
  if ('IntersectionObserver' in window && !reduce) {
    var cio = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { countUp(e.target); cio.unobserve(e.target); } });
    }, { threshold: 0.6 });
    $$('[data-count]').forEach(function (el) { cio.observe(el); });
  }

  /* ---------- service pager (home) ---------- */
  var pager = $('#pager'), svcList = $('#svc-list');
  if (pager && svcList && 'IntersectionObserver' in window) {
    var dots = $$('[data-svc]', pager);
    var aio = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        var i = +e.target.id.replace('svc-', '');
        dots.forEach(function (d, k) {
          var on = k === i - 1;
          d.classList.toggle('on', on);
          if (on) d.setAttribute('aria-current', 'true'); else d.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-42% 0px -52% 0px' });
    $$('.svc', svcList).forEach(function (s) { aio.observe(s); });
    new IntersectionObserver(function (es) {
      es.forEach(function (e) { pager.classList.toggle('show', e.isIntersecting); });
    }, { rootMargin: '-35% 0px -35% 0px' }).observe(svcList);
  }

  /* ---------- scroll engine: one pass of reads, then one of writes, once per frame ---------- */
  var steps = $('#steps'), stepEls = steps ? $$('.step', steps) : [], scEls = $$('[data-sc]');
  var vh = window.innerHeight, target = 0, smooth = 0, dirty = true;
  if (reduce) stepEls.forEach(function (s) { s.classList.add('on'); });
  function frame() {
    var y = window.scrollY || window.pageYOffset, max = Math.max(1, root.scrollHeight - vh);
    target = clamp(y / max, 0, 1);
    var rects = reduce ? [] : scEls.map(function (el) { return el.getBoundingClientRect(); });
    var pr = steps && !reduce ? steps.getBoundingClientRect() : null;
    root.style.setProperty('--sp', target.toFixed(4));
    rects.forEach(function (r, i) {
      if (r.bottom < -vh * 0.5 || r.top > vh * 1.5) return;
      scEls[i].style.setProperty('--p', clamp((vh - r.top) / (vh * 0.7), 0, 1).toFixed(3));
    });
    if (pr) {
      var pp = window.innerWidth > 820 ? clamp((vh * 0.85 - pr.top) / (vh * 0.5), 0, 1) : clamp((vh * 0.7 - pr.top) / Math.max(1, pr.height), 0, 1);
      steps.style.setProperty('--p', pp.toFixed(3));
      stepEls.forEach(function (s, i) { s.classList.toggle('on', pp >= i / 4 + 0.03); });
    }
  }
  window.addEventListener('scroll', function () { dirty = true; }, { passive: true });
  var rz;
  window.addEventListener('resize', function () {
    clearTimeout(rz);
    rz = setTimeout(function () { vh = window.innerHeight; size3D(); dirty = true; if (reduce) { frame(); smooth = target; render3D(); } }, 120);
  });

  /* ---------- phone menu ---------- */
  var nav = $('#nav'), menuBtn = $('#nav-menu');
  if (nav && menuBtn) {
    var setMenu = function (open) { nav.classList.toggle('open', open); menuBtn.setAttribute('aria-expanded', String(open)); };
    menuBtn.addEventListener('click', function () { setMenu(!nav.classList.contains('open')); });
    $$('.nav-links a', nav).forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
    document.addEventListener('click', function (e) { if (!nav.contains(e.target)) setMenu(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });
  }

  /* ---------- copy email ---------- */
  $$('[data-copy]').forEach(function (btn) {
    var idle = btn.textContent;
    btn.addEventListener('click', function () {
      var text = btn.getAttribute('data-copy');
      var say = function (msg) { btn.textContent = msg; setTimeout(function () { btn.textContent = idle; }, 1600); };
      try { navigator.clipboard.writeText(text).then(function () { say('Copied'); }, function () { say(text); }); }
      catch (e) { say(text); }
    });
  });

  /* ---------- booking sheet ---------- */
  var bk = $('#bk');
  if (bk) {
    var panel = $('#bk-panel'), form = $('#bk-form');
    var fsteps = $$('[data-step]', form), fdots = $$('[data-dot]', form);
    var stepLabel = $('#bk-step'), back = $('#bk-back'), next = $('#bk-next');
    var errReq = $('#bk-err-req'), errSend = $('#bk-err-send');
    var REQUIRED = [[], ['brand'], ['contact', 'email']];
    var cur = 0, lastFocus = null, busy = false, closeTimer;

    var paint = function () {
      fdots.forEach(function (d, i) { d.classList.toggle('on', i <= cur); });
      stepLabel.textContent = 'STEP ' + (cur + 1) + ' OF 3';
      back.hidden = cur === 0;
      next.disabled = false;
      next.innerHTML = (cur === 2 ? 'Request call' : 'Continue') + '<span class="arr"></span>';
      fsteps.forEach(function (s, i) { s.hidden = i !== cur; });
    };
    var focusStep = function () {
      var el = $('input:not([type="hidden"])', fsteps[cur]);
      if (el && cur > 0) el.focus();
    };
    /* fields are checked by name: never rely on the required attribute */
    var valid = function () {
      var ok = true;
      if (cur === 0) {
        ok = $$('input[name="requirement"]:checked', form).length > 0;
        errReq.hidden = ok;
        return ok;
      }
      REQUIRED[cur].forEach(function (name) {
        var el = form.elements[name], v = el.value.trim();
        var bad = !v || (name === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v));
        el.classList.toggle('bad', bad);
        el.setAttribute('aria-invalid', bad ? 'true' : 'false');
        if (bad && ok) el.focus();
        if (bad) ok = false;
      });
      return ok;
    };
    var open = function (e) {
      if (e) e.preventDefault();
      clearTimeout(closeTimer);
      lastFocus = document.activeElement;
      bk.hidden = false;
      root.style.overflow = 'hidden';
      requestAnimationFrame(function () { requestAnimationFrame(function () { bk.classList.add('show'); }); });
      $('#bk-close').focus();
    };
    var close = function () {
      bk.classList.remove('show');
      root.style.overflow = '';
      closeTimer = setTimeout(function () {
        bk.hidden = true; form.reset(); cur = 0; busy = false;
        errReq.hidden = true; errSend.hidden = true;
        $$('.inp', form).forEach(function (i) { i.classList.remove('bad'); });
        paint();
      }, 280);
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    };
    $$('[data-book]').forEach(function (b) { b.addEventListener('click', open); });
    $$('[data-book-close]', bk).forEach(function (b) { b.addEventListener('click', close); });
    bk.addEventListener('mousedown', function (e) { if (e.target === bk) close(); });
    document.addEventListener('keydown', function (e) {
      if (bk.hidden) return;
      if (e.key === 'Escape') { close(); return; }
      if (e.key !== 'Tab') return;
      var f = $$('button:not([hidden]):not([disabled]), input:not([tabindex="-1"])', panel).filter(function (el) { return el.offsetParent !== null; });
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
    $$('input[name="requirement"]', form).forEach(function (c) { c.addEventListener('change', function () { errReq.hidden = true; }); });
    $$('.inp', form).forEach(function (i) { i.addEventListener('input', function () { i.classList.remove('bad'); }); });
    back.addEventListener('click', function () { if (cur > 0 && !busy) { cur--; paint(); focusStep(); } });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (busy || !valid()) return;
      if (cur < 2) { cur++; paint(); focusStep(); return; }
      busy = true; errSend.hidden = true;
      next.disabled = true; next.textContent = 'Sending…';
      var fd = new FormData(form);
      fd.append('access_key', 'a62b7648-2556-4ccb-bdbc-964816910070');
      fd.append('subject', 'New booking request, greenlinestudio.in');
      fd.append('from_name', 'greenline website');
      fetch('https://api.web3forms.com/submit', { method: 'POST', body: fd })
        .then(function (res) { return res.json(); })
        .then(function (data) {
          if (!data || !data.success) throw new Error('send failed');
          window.location.assign('/thank-you');
        })
        .catch(function () { busy = false; errSend.hidden = false; paint(); });
    });
    paint();
  }

  /* ---------- three.js: the green line rising through dust and soft light ---------- */
  var R = null, S = null, C = null, scene = null, T = null;
  var rnd = function (a, b) { return a + Math.random() * (b - a); };
  function size3D() {
    if (!R) return;
    R.setSize(window.innerWidth, window.innerHeight, false);
    C.aspect = window.innerWidth / window.innerHeight;
    C.updateProjectionMatrix();
  }
  function render3D() { if (R && scene) { scene.update(performance.now() / 1000, smooth); R.render(S, C); } }
  function cloud(n, b, color, size, opacity) {
    var a = new Float32Array(n * 3);
    for (var i = 0; i < n; i++) { a[i * 3] = rnd(b[0], b[1]); a[i * 3 + 1] = rnd(b[2], b[3]); a[i * 3 + 2] = rnd(b[4], b[5]); }
    var g = new T.BufferGeometry(); g.setAttribute('position', new T.BufferAttribute(a, 3));
    return new T.Points(g, new T.PointsMaterial({ color: color, size: size, transparent: true, opacity: opacity, depthWrite: false }));
  }
  function glowTexture() {
    var c = document.createElement('canvas'); c.width = c.height = 128;
    var g = c.getContext('2d'), gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.3, 'rgba(255,255,255,.4)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
    return new T.CanvasTexture(c);
  }
  function init3D() {
    T = window.THREE;
    var canvas = $('#bg3d');
    if (!T || !canvas) return;
    try { R = new T.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true, powerPreference: 'high-performance' }); }
    catch (e) { R = null; return; }
    var mobile = window.innerWidth < 768, lite = root.classList.contains('lite');
    R.setPixelRatio(lite ? 1 : Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 1.75));
    C = new T.PerspectiveCamera(55, 1, 0.1, 320);
    S = new T.Scene();
    S.fog = new T.FogExp2(0x0A0F0D, 0.02);
    var pts = [];
    for (var i = 0; i <= 44; i++) { var t = i / 44; pts.push(new T.Vector3(Math.sin(t * 6.4) * 5 + t * 5, -20 + t * 76, Math.cos(t * 4.2) * 6 - t * 12)); }
    var curve = new T.CatmullRomCurve3(pts);
    var line = new T.Mesh(new T.TubeGeometry(curve, mobile ? 240 : 460, 0.075, 8, false), new T.MeshBasicMaterial({ color: 0x36E08B }));
    var halo = new T.Mesh(new T.TubeGeometry(curve, mobile ? 160 : 300, 0.34, 8, false), new T.MeshBasicMaterial({ color: 0x36E08B, transparent: true, opacity: 0.11, blending: T.AdditiveBlending, depthWrite: false }));
    var box = [-34, 34, -26, 62, -44, 14];
    var dust = cloud(mobile ? 600 : 1900, box, 0xF4F3EE, 0.07, 0.5);
    var sparks = cloud(mobile ? 24 : 60, box, 0xFFB020, 0.2, 0.95);
    /* soft lights behind the glass: they give the frosted panels colour to pick up */
    var tex = glowTexture(), tints = [0x36E08B, 0xFFB020, 0x1F9D63, 0x36E08B, 0x2BB8A0], lights = [], n = mobile ? 6 : 10;
    for (var k = 0; k < n; k++) {
      var m = new T.Sprite(new T.SpriteMaterial({ map: tex, color: tints[k % 5], transparent: true, opacity: k % 5 === 1 ? 0.2 : 0.3, blending: T.AdditiveBlending, depthWrite: false }));
      var p = curve.getPointAt(0.04 + k / n * 0.92), s = rnd(14, 26);
      m.position.set(p.x + rnd(-12, 12), p.y + rnd(-4, 4), p.z - rnd(6, 16));
      m.scale.set(s, s, 1);
      m.userData = { x: m.position.x, y: m.position.y, f: rnd(0.12, 0.3), o: rnd(0, 6) };
      lights.push(m); S.add(m);
    }
    S.add(line, halo, dust, sparks);
    var total = line.geometry.index.count, side = mobile ? 0 : -4.6;
    scene = {
      update: function (t, pr) {
        var u = clamp(pr * 0.9 + 0.03, 0, 0.97), a = curve.getPointAt(u), b = curve.getPointAt(Math.min(1, u + 0.05));
        line.geometry.setDrawRange(0, Math.floor(total * Math.min(1, u + 0.16) / 3) * 3);
        C.position.set(a.x + 7 + Math.sin(t * 0.21) * 0.7, a.y + 1.1, a.z + 11.5 + Math.cos(t * 0.17) * 0.7);
        C.lookAt(b.x + side, b.y + 1.6, b.z);
        dust.rotation.y = t * 0.012; sparks.rotation.y = -t * 0.02; sparks.position.y = Math.sin(t * 0.5) * 0.6;
        for (var j = 0; j < lights.length; j++) { var l = lights[j], d = l.userData; l.position.x = d.x + Math.sin(t * d.f + d.o) * 2.2; l.position.y = d.y + Math.cos(t * d.f * 0.8 + d.o) * 1.6; }
      }
    };
    size3D();
    smooth = target;
    render3D();
    root.classList.add('has3d');
  }
  /* three.js is fetched after the page is interactive, so it never delays first paint */
  function load3D() {
    if (!$('#bg3d')) return;
    var s = document.createElement('script');
    s.src = '/vendor/three.min.js';
    s.async = true;
    s.onload = init3D;
    document.head.appendChild(s);
  }

  /* ---------- frame loop with a quality governor ----------
     If frames run slow, first drop the 3D resolution, then switch glass to solid fills. */
  var last = 0, settle = 0, samples = [], tier = root.classList.contains('lite') ? 2 : 0, checks = 0;
  function govern(now) {
    var dt = now - last; last = now;
    if (tier >= 2 || checks > 5 || !R || dt > 250) return;
    if (++settle < 45) return;
    samples.push(dt);
    if (samples.length < 60) return;
    samples.sort(function (a, b) { return a - b; });
    var median = samples[30]; samples = []; checks++;
    if (median < 23) return;
    tier++; settle = 0;
    if (tier === 1) { R.setPixelRatio(1); size3D(); }
    else { root.classList.add('lite'); store.set('gl-lite', '1'); }
  }

  /* ---------- boot ---------- */
  frame(); smooth = target;
  window.addEventListener('load', function () { vh = window.innerHeight; dirty = true; });
  if ('requestIdleCallback' in window) window.requestIdleCallback(load3D, { timeout: 1500 });
  else setTimeout(load3D, 400);
  if (reduce) {
    window.addEventListener('scroll', function () { frame(); smooth = target; render3D(); }, { passive: true });
  } else {
    (function loop(now) {
      requestAnimationFrame(loop);
      if (document.hidden) return;
      if (dirty) { dirty = false; frame(); }
      smooth += (target - smooth) * 0.07;
      render3D();
      govern(now || 0);
    })(0);
  }

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () { navigator.serviceWorker.register('/sw.js').catch(function () {}); });
  }
})();
