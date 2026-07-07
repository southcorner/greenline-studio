/**
 * Injects the 3D enhancement layer into src/index.html's OUTER body (after the
 * bundler scripts, before </body>). The layer adds, on the home page only:
 *   - flip cards for the 9 service cards (description on the back)
 *   - 3D perspective tilt on work cards / the capabilities banner
 *   - an ambient Three.js scene behind the hero (growth line + wireframes)
 *
 * Three.js is self-hosted at /vendor/three.min.js (static/vendor/) because the
 * production CSP does not allow cdnjs. Idempotent: re-running replaces the
 * existing block between the GL-ENHANCE markers.
 */
const fs = require('fs');
const path = require('path');

const OPEN_MARK = '<!-- GL-ENHANCE:start -->';
const CLOSE_MARK = '<!-- GL-ENHANCE:end -->';

const ENHANCE = OPEN_MARK + `
<script>
/* Greenline 3D enhancement layer.
   The bundler swaps documentElement and the dc runtime re-renders once after
   first paint, so: poll for the app, never hold node references across calls,
   keep listeners on document and the canvas on <body>. */
(function () {
  function ready(fn) {
    var tries = 0;
    var iv = setInterval(function () {
      var root = document.getElementById('gl-home');
      if (root && root.querySelector('.gl-hero-cards')) { clearInterval(iv); fn(); }
      if (++tries > 150) clearInterval(iv);
    }, 120);
  }

  ready(function () {
    initTilt();
    // settle delay: the dc runtime replaces the subtree shortly after first paint
    setTimeout(function () { try { initFlipCards(); } catch (e) {} }, 700);
    if (window.innerWidth > 880 && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
      var s = document.createElement('script');
      s.src = '/vendor/three.min.js';
      s.onload = function () { try { initHeroScene(); } catch (e) {} };
      document.head.appendChild(s);
    }
  });

  /* Flip cards: service cards rotate to show the description on the back */
  function initFlipCards() {
    var cards = document.querySelectorAll('#services .gl-card.gl-glass');
    if (!cards.length) return;

    var css = document.createElement('style');
    css.textContent =
      '.gfl-card{background:transparent!important;border:none!important;box-shadow:none!important;' +
        'padding:0!important;perspective:1200px;-webkit-backdrop-filter:none!important;backdrop-filter:none!important;}' +
      '.gfl-inner{position:relative;width:100%;height:100%;transform-style:preserve-3d;' +
        'transition:transform .65s cubic-bezier(.4,.1,.2,1);}' +
      '.gfl-card:hover .gfl-inner,.gfl-card.gfl-flipped .gfl-inner{transform:rotateY(180deg);}' +
      '.gfl-face{position:absolute;inset:0;padding:30px 32px;border-radius:18px;' +
        'backface-visibility:hidden;-webkit-backface-visibility:hidden;overflow:hidden;}' +
      '.gfl-front{background:#fff;border:1px solid #E4E2DA;display:flex;flex-direction:column;' +
        'box-shadow:0 12px 36px -22px rgba(15,59,44,.45);}' +
      '.gfl-bar{margin:-30px -32px 0;padding:15px 24px;display:flex;align-items:center;justify-content:space-between;' +
        'background:linear-gradient(90deg,#E9F2EC 0%,#F6FAF7 100%);border-bottom:1px solid #E4E2DA;}' +
      '.gfl-bar svg{width:27px;height:27px;display:block;}' +
      '.gfl-bar b{font-family:\\'IBM Plex Mono\\',monospace;font-weight:400;font-size:11px;letter-spacing:.1em;color:#9AA69E;}' +
      '.gfl-mid{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;}' +
      '.gfl-mid h3{margin:0!important;text-align:center;font-size:23px!important;}' +
      '.gfl-mid i{width:34px;height:3px;border-radius:2px;background:#36E08B;display:block;}' +
      '.gfl-cta{display:flex;align-items:center;justify-content:center;gap:9px;' +
        'font-family:\\'IBM Plex Mono\\',monospace;font-size:10px;letter-spacing:.2em;color:#1F9D63;}' +
      '.gfl-cta i{width:24px;height:24px;border-radius:50%;border:1.5px solid #36E08B;flex:none;' +
        'display:flex;align-items:center;justify-content:center;font-style:normal;}' +
      '.gfl-cta svg{width:12px;height:12px;stroke:#1F9D63;fill:none;stroke-width:2;stroke-linecap:round;}' +
      '.gfl-back{background:linear-gradient(135deg,#0F3B2C 0%,#0C2E22 100%);color:#F4F3EE;' +
        'transform:rotateY(180deg);display:flex;flex-direction:column;' +
        'box-shadow:0 20px 44px -24px rgba(15,59,44,.6);}' +
      '.gfl-back .gfl-num{font-family:\\'IBM Plex Mono\\',monospace;font-size:11px;letter-spacing:.16em;color:#36E08B;}' +
      '.gfl-back h4{font-family:Outfit,sans-serif;font-weight:500;font-size:20px;letter-spacing:-.02em;margin-top:12px;}' +
      '.gfl-back p{font-family:Outfit,sans-serif;font-weight:300;font-size:14px;line-height:1.6;color:#C9D6CE;margin-top:10px;}' +
      '.gfl-back a{display:flex;align-items:center;gap:8px;margin-top:auto;font-family:Outfit,sans-serif;' +
        'font-weight:500;font-size:14px;color:#36E08B;}' +
      '.gfl-back a span{width:18px;height:2px;background:#36E08B;display:inline-block;}';
    document.head.appendChild(css);

    var CTA_TEXT = matchMedia('(hover: none)').matches ? 'TAP FOR DETAILS' : 'HOVER FOR DETAILS';
    var CTA = '<div class="gfl-cta"><i><svg viewBox="0 0 24 24"><path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 2v4h4"/></svg></i>' + CTA_TEXT + '</div>';

    var IC = 'fill="none" stroke="#0F3B2C" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"';
    var ACC = 'stroke="#1F9D63"';
    var ICONS = [
      '<svg viewBox="0 0 24 24" ' + IC + '><rect x="2.5" y="4" width="19" height="16" rx="2.5"/><path d="M2.5 8.5h19"/><path d="M9.5 12.5l-2 2 2 2M14.5 12.5l2 2-2 2" ' + ACC + '/></svg>',
      '<svg viewBox="0 0 24 24" ' + IC + '><path d="M5.8 8h12.4l1.1 10.9a1.9 1.9 0 0 1-1.9 2.1H6.6a1.9 1.9 0 0 1-1.9-2.1L5.8 8z"/><path d="M9 10.5V7a3 3 0 0 1 6 0v3.5" ' + ACC + '/></svg>',
      '<svg viewBox="0 0 24 24" ' + IC + '><path d="M4.5 9.5L6 4h12l1.5 5.5"/><path d="M3.5 9.5h17"/><path d="M5.5 9.5V20h13V9.5"/><path d="M13.5 20v-5.5h3.5V20" ' + ACC + '/></svg>',
      '<svg viewBox="0 0 24 24" ' + IC + '><path d="M4 10v4l2.5.4V9.6L4 10z"/><path d="M6.5 9.6L18.5 4.5v15L6.5 14.4z"/><path d="M9 15l1 4.5"/><path d="M20.8 9.8a3.6 3.6 0 0 1 0 4.4" ' + ACC + '/></svg>',
      '<svg viewBox="0 0 24 24" ' + IC + '><path d="M21 11.3a8.4 8.4 0 0 1-12.3 7.5L3.5 20.5l1.7-5A8.4 8.4 0 1 1 21 11.3z"/><path d="M12.2 14l-2.4-2.5a1.5 1.5 0 0 1 2.1-2.1l.3.4.3-.4a1.5 1.5 0 0 1 2.1 2.1L12.2 14z" ' + ACC + '/></svg>',
      '<svg viewBox="0 0 24 24" ' + IC + '><path d="M16.5 3.5l4 4L7.5 20.5l-5 1 1-5L16.5 3.5z"/><path d="M13.5 6.5l4 4" ' + ACC + '/></svg>',
      '<svg viewBox="0 0 24 24" ' + IC + '><path d="M7 4h10l4 5.2L12 20.5 3 9.2 7 4z"/><path d="M3 9.2h18M12 20.5L8.7 9.2 10.8 4M12 20.5l3.3-11.3L13.2 4" ' + ACC + ' stroke-width="1.2"/></svg>',
      '<svg viewBox="0 0 24 24" ' + IC + '><circle cx="12" cy="12" r="5"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M18.7 5.3l-2.1 2.1M7.4 16.6l-2.1 2.1"/><circle cx="12" cy="12" r="1.8" ' + ACC + '/></svg>',
      '<svg viewBox="0 0 24 24" ' + IC + '><circle cx="9" cy="8.5" r="3.5"/><path d="M3.5 20a5.5 5.5 0 0 1 11 0"/><circle cx="17.2" cy="10" r="2.6" ' + ACC + '/><path d="M15 20a4.6 4.6 0 0 1 5.6-4.3" ' + ACC + '/></svg>',
    ];

    cards.forEach(function (card, i) {
      if (card.classList.contains('gfl-card')) return;
      var h = card.offsetHeight;
      var title = card.querySelector('h3');
      var desc = card.querySelector('p');
      var link = card.querySelector('a');
      if (!title || !desc) return;

      card.classList.add('gfl-card');
      card.style.height = Math.max(h, 230) + 'px';

      var inner = document.createElement('div');
      inner.className = 'gfl-inner';
      var front = document.createElement('div');
      front.className = 'gfl-face gfl-front';
      var back = document.createElement('div');
      back.className = 'gfl-face gfl-back';

      while (card.firstChild) front.appendChild(card.firstChild);
      var descText = desc.textContent;
      desc.remove();
      var oldRow = front.firstElementChild;
      if (oldRow && oldRow.tagName === 'DIV' && oldRow !== title) oldRow.remove();

      var bar = document.createElement('div');
      bar.className = 'gfl-bar';
      bar.innerHTML = (ICONS[i] || ICONS[0]) + '<b>0' + (i + 1) + '</b>';
      front.insertBefore(bar, front.firstChild);

      var mid = document.createElement('div');
      mid.className = 'gfl-mid';
      mid.appendChild(title);
      mid.insertAdjacentHTML('beforeend', '<i></i>');
      front.appendChild(mid);
      front.insertAdjacentHTML('beforeend', CTA);

      var href = link ? link.getAttribute('href') : '/services';
      if (link) link.remove();
      back.innerHTML =
        '<div class="gfl-num">0' + (i + 1) + ' / SERVICE</div>' +
        '<h4>' + title.textContent + '</h4>' +
        '<p>' + descText + '</p>' +
        '<a href="' + href + '">Explore <span></span></a>';

      inner.appendChild(front);
      inner.appendChild(back);
      card.appendChild(inner);
    });

    if (matchMedia('(hover: none)').matches) {
      document.addEventListener('click', function (e) {
        if (e.target.closest('a')) return;
        var card = e.target.closest('.gfl-card');
        if (card) card.classList.toggle('gfl-flipped');
      }, true);
    }
  }

  /* 3D tilt via event delegation (survives dc re-renders).
     Skips parallax hero cards and the flip cards. */
  function initTilt() {
    if (matchMedia('(hover: none)').matches) return;
    var SEL = '.gl-card:not([data-parallax]):not(.gfl-card), .gl-work';
    var current = null, rect = null;
    function reset(card) {
      card.style.transition = 'transform .55s cubic-bezier(.22,.61,.36,1), box-shadow .55s';
      card.style.transform = 'none';
    }
    document.addEventListener('mousemove', function (e) {
      var card = e.target && e.target.closest ? e.target.closest(SEL) : null;
      if (card !== current) {
        if (current) reset(current);
        current = card;
        if (card) {
          rect = card.getBoundingClientRect();
          card.style.transition = 'transform .12s ease-out, box-shadow .35s';
        }
      }
      if (!current) return;
      var px = (e.clientX - rect.left) / rect.width - 0.5;
      var py = (e.clientY - rect.top) / rect.height - 0.5;
      current.style.transform = 'perspective(900px) rotateX(' + (-py * 6).toFixed(2) +
        'deg) rotateY(' + (px * 8).toFixed(2) + 'deg) translateY(-4px) scale(1.012)';
    }, true);
    document.addEventListener('mouseleave', function () {
      if (current) { reset(current); current = null; }
    });
    window.addEventListener('scroll', function () {
      if (current) rect = current.getBoundingClientRect();
    }, { passive: true });
  }

  /* Ambient 3D scene behind the hero. Canvas on <body> at z-index:-1 —
     outside the React tree so reconciliation can't remove it. */
  function initHeroScene() {
    var grid = document.querySelector('.gl-hero-grid');
    var hero = grid ? (grid.closest('header') || grid.parentElement) : null;
    if (!hero || !window.THREE) return;
    function heroHeight() {
      var r = hero.getBoundingClientRect();
      return Math.max(400, r.bottom + window.scrollY);
    }

    var W = window.innerWidth, H = heroHeight();
    var renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(W, H);
    renderer.setClearColor(0x000000, 0);
    var cv = renderer.domElement;
    cv.style.cssText = 'position:absolute;top:0;left:0;z-index:-1;pointer-events:none;';
    document.body.appendChild(cv);

    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(50, W / H, 0.1, 100);
    camera.position.set(0, 0, 16);
    scene.add(new THREE.AmbientLight(0xffffff, 0.9));
    var dl = new THREE.DirectionalLight(0xffffff, 0.6);
    dl.position.set(-4, 6, 8);
    scene.add(dl);

    var GREEN = 0x36E08B, DEEP = 0x0F3B2C;

    var curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-11, -5.2, -6),
      new THREE.Vector3(-4, -3.6, -4),
      new THREE.Vector3(2, -2.6, -3),
      new THREE.Vector3(7, -0.4, -2),
      new THREE.Vector3(12, 2.8, -1)
    ]);
    var tube = new THREE.Mesh(
      new THREE.TubeGeometry(curve, 90, 0.045, 8, false),
      new THREE.MeshBasicMaterial({ color: GREEN, transparent: true, opacity: 0.85 })
    );
    scene.add(tube);
    var endDot = new THREE.Mesh(
      new THREE.SphereGeometry(0.16, 14, 14),
      new THREE.MeshBasicMaterial({ color: GREEN })
    );
    endDot.position.copy(curve.getPointAt(1));
    scene.add(endDot);

    var floaters = [];
    function addFloater(geo, x, y, z, speed, rot) {
      var m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({
        color: DEEP, wireframe: true, transparent: true, opacity: 0.34
      }));
      m.position.set(x, y, z);
      scene.add(m);
      floaters.push({ m: m, base: y, speed: speed, rot: rot });
    }
    addFloater(new THREE.BoxGeometry(1.5, 1.5, 1.5), 8.5, 3.4, -3, 0.5, 0.0028);
    addFloater(new THREE.IcosahedronGeometry(0.95, 0), 4.2, 4.6, -5, 0.7, 0.0022);
    addFloater(new THREE.TorusGeometry(0.9, 0.28, 8, 22), 10.5, -1.6, -2, 0.6, 0.0034);
    addFloater(new THREE.OctahedronGeometry(0.7, 0), 1.5, 1.9, -6, 0.85, 0.0026);

    var N = 260;
    var pos = new Float32Array(N * 3);
    for (var i = 0; i < N; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 30;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 16;
      pos[i * 3 + 2] = -2 - Math.random() * 8;
    }
    var pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    var dust = new THREE.Points(pGeo, new THREE.PointsMaterial({
      color: 0x1F9D63, size: 0.07, transparent: true, opacity: 0.4, depthWrite: false
    }));
    scene.add(dust);

    var mouse = { x: 0, y: 0 }, sx = 0, sy = 0;
    document.addEventListener('mousemove', function (e) {
      mouse.x = (e.clientX / window.innerWidth - 0.5) * 2;
      mouse.y = (e.clientY / window.innerHeight - 0.5) * 2;
    });

    var clock = new THREE.Clock();
    var visible = true;
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) { visible = en[0].isIntersecting; }).observe(cv);
    }
    (function tick() {
      requestAnimationFrame(tick);
      if (!visible) return;
      var t = clock.getElapsedTime();
      floaters.forEach(function (f) {
        f.m.position.y = f.base + Math.sin(t * f.speed) * 0.45;
        f.m.rotation.x += f.rot; f.m.rotation.y += f.rot * 1.4;
      });
      endDot.scale.setScalar(1 + Math.sin(t * 2.2) * 0.06 + 0.12 * Math.abs(Math.sin(t * 2.2)));
      dust.rotation.y = t * 0.008;
      sx += (mouse.x - sx) * 0.05; sy += (mouse.y - sy) * 0.05;
      camera.position.x = sx * 0.9;
      camera.position.y = -sy * 0.55;
      camera.lookAt(0, 0, -3);
      renderer.render(scene, camera);
    })();

    window.addEventListener('resize', function () {
      W = window.innerWidth; H = heroHeight();
      camera.aspect = W / H;
      camera.updateProjectionMatrix();
      renderer.setSize(W, H);
    });
  }
})();
</script>
` + CLOSE_MARK;

const filePath = path.join(__dirname, '..', 'src', 'index.html');
let src = fs.readFileSync(filePath, 'utf8');

// idempotent: replace an existing block, else insert before the outer </body>
const oldStart = src.indexOf(OPEN_MARK);
if (oldStart !== -1) {
  const oldEnd = src.indexOf(CLOSE_MARK, oldStart);
  if (oldEnd === -1) throw new Error('GL-ENHANCE start marker without end marker');
  src = src.substring(0, oldStart) + ENHANCE + src.substring(oldEnd + CLOSE_MARK.length);
  console.log('✓ src/index.html: enhancement block replaced');
} else {
  const idx = src.lastIndexOf('</body>');
  if (idx === -1) throw new Error('</body> not found');
  src = src.substring(0, idx) + ENHANCE + '\n' + src.substring(idx);
  console.log('✓ src/index.html: enhancement block injected');
}
fs.writeFileSync(filePath, src, 'utf8');
