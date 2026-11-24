'use strict';
/* Static build for greenlinestudio.in.
   Pages are plain HTML generated from src/pages + src/partials, with copy pulled from
   content.json (the file the /admin CMS edits) and SEO settings from seo.json.
   No client-side framework: the output is HTML, one stylesheet and one script. */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = __dirname;
const DIST = path.join(ROOT, 'dist');
const read = p => fs.readFileSync(path.join(ROOT, p), 'utf8');

const content = JSON.parse(read('content.json'));
const SERVICES = require('./src/data/services.js');

/* SEO config lives in seo.json, not content.json: the CMS only edits copy.
   Defaults keep a build alive if the file is missing. */
const SEO_DEFAULTS = {
  site: {
    name: 'Greenline Commerce Studio', short_name: 'Greenline',
    base_url: 'https://greenlinestudio.in', locale: 'en',
    email: 'hello@greenlinestudio.in', twitter: '', theme_color: '#FFFFFF', gtag_id: '',
    og_image: '/og-image.png', founding_year: '2026', area_served: 'Worldwide', service_list: [],
  },
  seo: {
    home:     { title: 'Greenline Commerce Studio', description: '', path: '/',         keywords: '' },
    services: { title: 'Services — Greenline',       description: '', path: '/services', keywords: '' },
    about:    { title: 'About — Greenline',          description: '', path: '/about',    keywords: '' },
    contact:  { title: 'Contact — Greenline',        description: '', path: '/contact',  keywords: '' },
  },
};
let seoConfig = SEO_DEFAULTS;
try {
  const loaded = JSON.parse(read('seo.json'));
  seoConfig = {
    site: Object.assign({}, SEO_DEFAULTS.site, loaded.site),
    seo:  Object.assign({}, SEO_DEFAULTS.seo,  loaded.seo),
  };
} catch (e) {
  console.warn('  WARNING: seo.json missing or invalid — using SEO defaults:', e.message);
}
const site = seoConfig.site;

/* ── helpers ─────────────────────────────────────────────────────────────── */
const esc = s => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
const absUrl = p => /^https?:\/\//i.test(p) ? p : site.base_url.replace(/\/$/, '') + (p.startsWith('/') ? p : '/' + p);
const pad = n => String(n).padStart(2, '0');
const lookup = (ctx, p) => p.split('.').reduce((o, k) => (o == null ? undefined : o[k]), ctx);

/* {{> partial}} includes, {{{path}}} raw, {{path}} escaped */
function render(tpl, ctx) {
  let out = tpl.replace(/\{\{>\s*([\w-]+)\s*\}\}/g, (m, name) => render(read('src/partials/' + name + '.html'), ctx));
  const val = (p, where) => {
    const v = lookup(ctx, p);
    if (v === undefined) { console.warn('  WARNING: no value for {{' + p + '}} in ' + where); return ''; }
    return v;
  };
  out = out.replace(/\{\{\{\s*([\w.]+)\s*\}\}\}/g, (m, p) => String(val(p, ctx.page)));
  out = out.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (m, p) => esc(val(p, ctx.page)));
  return out;
}

/* ── generated blocks ────────────────────────────────────────────────────── */
const H = content.home, S = content.services, A = content.about;
const TOTAL = SERVICES.length;

/* client names for the strip under the hero form; printed twice so the CSS loop is seamless */
function clientMarks() {
  const names = [1, 2, 3, 4, 5, 6].map(i => H['tb_c' + i]).filter(Boolean);
  /* the list is doubled inside each half so one half is always wider than the strip */
  const set = names.concat(names).map(n => `<span>${esc(n)}</span>`).join('');
  return set + '<div class="mq-dup" aria-hidden="true">' + set + '</div>';
}

/* home: one short card per service, swiped sideways */
const homeCards = () => SERVICES.map((s, i) => {
  const n = i + 1;
  return `<a class="card rv x" href="/services#s${n}"><span class="n">${pad(n)}</span><h3>${esc(H['svc' + n + '_title'])}</h3><p>${esc(H['svc' + n + '_desc'])}</p></a>`;
}).join('\n        ');

/* "120+", "+38%", "9 yrs" → the parts the count-up animation needs */
function numCell(i) {
  const raw = String(H['num' + i + '_value'] || ''), m = raw.match(/^(\D*)(\d+)(.*)$/);
  const attrs = m ? ` data-count="${esc(m[2])}" data-pre="${esc(m[1])}" data-suf="${esc(m[3])}"` : '';
  return `<div class="rv"><b${attrs}>${esc(raw)}</b><span>${esc(H['num' + i + '_label'])}</span></div>`;
}
const nums = () => [1, 2, 3, 4].map(numCell).join('\n          ');

const aboutPoints = short => [1, 2, 3, 4, 5].map(i =>
  short
    ? `<li class="rv">${esc(A['pt' + i + '_title'])}</li>`
    : `<li class="rv"><h3>${esc(A['pt' + i + '_title'])}</h3><p>${esc(A['pt' + i + '_desc'])}</p></li>`).join('\n          ');

const processSteps = () => [1, 2, 3, 4].map(i =>
  `<li class="rv"><span class="n">${pad(i)}</span><h3>${esc(A['proc' + i + '_title'])}</h3><p>${esc(A['proc' + i + '_desc'])}</p></li>`).join('\n          ');

/* services page: the index on the first screen, then one screen per service */
const serviceIndex = () => SERVICES.map((s, i) =>
  `<li><a href="#s${i + 1}"><span>${pad(i + 1)}</span>${esc(H['svc' + (i + 1) + '_title'])}</a></li>`).join('');

function serviceScreens() {
  return SERVICES.map((s, i) => {
    const n = i + 1, title = H['svc' + n + '_title'];
    return `<section class="sc svc" id="s${n}" aria-labelledby="s${n}-h">
    <div class="wrap split">
      <div class="stack">
        <p class="eye rv">${pad(n)} / ${pad(TOTAL)}</p>
        <h2 class="rv" id="s${n}-h">${esc(title)}</h2>
        <p class="tagline rv">${esc(S['s' + n + '_h2'])}</p>
      </div>
      <div class="stack">
        <p class="lede rv">${esc(S['s' + n + '_body'])}</p>
        <ul class="ticks">${s.bullets.map(b => `<li class="rv">${esc(b)}</li>`).join('')}</ul>
        <a class="link rv" href="/contact?service=${encodeURIComponent(title)}">Ask about this service</a>
      </div>
    </div>
  </section>`;
  }).join('\n\n  ');
}

const tiers = () => [1, 2, 3].map(i =>
  `<li class="rv"><span class="n">${pad(i)}</span><h3>${esc(S['tier' + i + '_name'])}</h3><p>${esc(S['tier' + i + '_desc'])}</p></li>`).join('\n          ');

/* ── head ────────────────────────────────────────────────────────────────── */
function jsonLd(seoKey) {
  const org = {
    '@type': 'Organization', '@id': absUrl('/#organization'), name: site.name, url: absUrl('/'),
    email: site.email, logo: absUrl('/favicon.svg'), image: absUrl(site.og_image),
    foundingDate: site.founding_year, areaServed: site.area_served,
    contactPoint: { '@type': 'ContactPoint', email: site.email, contactType: 'sales', areaServed: site.area_served },
  };
  const website = {
    '@type': 'WebSite', '@id': absUrl('/#website'), name: site.name, url: absUrl('/'),
    publisher: { '@id': absUrl('/#organization') }, inLanguage: site.locale,
  };
  const graph = [org, website];
  if (seoKey === 'services') {
    graph.push({
      '@type': 'OfferCatalog', '@id': absUrl('/services#catalog'), name: 'Commerce services',
      provider: { '@id': absUrl('/#organization') },
      itemListElement: site.service_list.map((name, i) => ({
        '@type': 'Offer', position: i + 1,
        itemOffered: { '@type': 'Service', name, provider: { '@id': absUrl('/#organization') } },
      })),
    });
  }
  if (seoKey === 'about') graph.push({ '@type': 'AboutPage', '@id': absUrl('/about#page'), url: absUrl('/about'), about: { '@id': absUrl('/#organization') } });
  if (seoKey === 'contact') graph.push({ '@type': 'ContactPage', '@id': absUrl('/contact#page'), url: absUrl('/contact'), about: { '@id': absUrl('/#organization') } });
  return '<script type="application/ld+json">' +
    JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }).replace(/</g, '\\u003C') + '</script>';
}

function head(meta, v) {
  const canonical = absUrl(meta.path);
  const ogImg = absUrl(site.og_image);
  const lines = [
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">',
    `<title>${esc(meta.title)}</title>`,
    `<meta name="description" content="${esc(meta.description)}">`,
    meta.keywords ? `<meta name="keywords" content="${esc(meta.keywords)}">` : '',
    `<meta name="robots" content="${meta.noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large'}">`,
    `<meta name="theme-color" content="${esc(site.theme_color)}">`,
    meta.noindex ? '' : `<link rel="canonical" href="${esc(canonical)}">`,
    '<link rel="icon" type="image/svg+xml" href="/favicon.svg">',
    '<link rel="apple-touch-icon" href="/apple-touch-icon.png">',
  ];
  if (!meta.noindex) lines.push(
    '<meta property="og:type" content="website">',
    `<meta property="og:site_name" content="${esc(site.name)}">`,
    `<meta property="og:title" content="${esc(meta.title)}">`,
    `<meta property="og:description" content="${esc(meta.description)}">`,
    `<meta property="og:url" content="${esc(canonical)}">`,
    `<meta property="og:image" content="${esc(ogImg)}">`,
    '<meta property="og:image:width" content="1200">',
    '<meta property="og:image:height" content="630">',
    `<meta property="og:locale" content="${esc(site.locale)}">`,
    '<meta name="twitter:card" content="summary_large_image">',
    site.twitter ? `<meta name="twitter:site" content="${esc(site.twitter)}">` : '',
    `<meta name="twitter:title" content="${esc(meta.title)}">`,
    `<meta name="twitter:description" content="${esc(meta.description)}">`,
    `<meta name="twitter:image" content="${esc(ogImg)}">`,
    jsonLd(meta.key)
  );
  lines.push(
    '<link rel="preconnect" href="https://fonts.googleapis.com">',
    '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>',
    '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Outfit:wght@400;500;600&display=swap">',
    `<link rel="stylesheet" href="/assets/site.css?v=${v}">`,
    /* marks that scripts run, before first paint, so arrival animations never flash */
    "<script>document.documentElement.className+=' js'</script>"
  );
  if (site.gtag_id) {
    const id = String(site.gtag_id).replace(/[^A-Za-z0-9_-]/g, '');
    lines.push(`<script async src="https://www.googletagmanager.com/gtag/js?id=${id}"></script>`,
      `<script src="/assets/gtag.js?v=${v}"></script>`);
  }
  if (meta.prefetch) lines.push(`<link rel="prefetch" href="${esc(meta.prefetch)}">`);
  return lines.filter(Boolean).join('\n  ');
}

function page(name, meta, v) {
  const cur = { home: '', services: '', about: '', contact: '' };
  if (meta.key in cur) cur[meta.key] = ' aria-current="page"';
  const ctx = {
    page: name, home: H, services: S, about: A, site, v, cur,
    gen: {
      clients: clientMarks(), cards: homeCards(), nums: nums(), total: pad(TOTAL),
      points_short: aboutPoints(true), points: aboutPoints(false), steps: processSteps(),
      svc_index: serviceIndex(), svc_screens: serviceScreens(), tiers: tiers(),
    },
  };
  const body = render(read('src/pages/' + name + '.html'), ctx);
  return `<!DOCTYPE html>
<html lang="${esc(site.locale)}" data-tone="light">
<head>
  ${head(meta, v)}
</head>
<body class="p-${name}">
${body}
<script src="/assets/site.js?v=${v}" defer></script>
</body>
</html>
`;
}

/* ── files ───────────────────────────────────────────────────────────────── */
function copyDir(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  for (const e of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, e.name), d = path.join(dest, e.name);
    if (e.isDirectory()) copyDir(s, d); else fs.copyFileSync(s, d);
  }
}
/* static assets; binary files stored as "<name>.b64" text are decoded on the way out */
function copyStatic(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  for (const e of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, e.name);
    if (e.isDirectory()) copyStatic(s, path.join(dest, e.name));
    else if (e.name.endsWith('.b64')) fs.writeFileSync(path.join(dest, e.name.slice(0, -4)), Buffer.from(fs.readFileSync(s, 'utf8'), 'base64'));
    else fs.copyFileSync(s, path.join(dest, e.name));
  }
}
const robots = () => ['User-agent: *', 'Allow: /', 'Disallow: /admin/', 'Disallow: /admin', '', `Sitemap: ${absUrl('/sitemap.xml')}`, ''].join('\n');
function sitemap() {
  const today = new Date().toISOString().slice(0, 10);
  const urls = Object.values(seoConfig.seo).map(s =>
    `  <url>\n    <loc>${esc(absUrl(s.path))}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>${s.path === '/' ? '1.0' : '0.8'}</priority>\n  </url>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

/* ── build ───────────────────────────────────────────────────────────────── */
fs.rmSync(DIST, { recursive: true, force: true });
fs.mkdirSync(path.join(DIST, 'assets'), { recursive: true });

const css = read('src/assets/site.css');
const js = read('src/assets/site.js');
const gtagJs = site.gtag_id
  ? `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${String(site.gtag_id).replace(/[^A-Za-z0-9_-]/g, '')}');\n`
  : '';
/* one version stamp for every asset URL, so assets can be cached for a year */
const v = crypto.createHash('sha1').update(css + js + gtagJs).digest('hex').slice(0, 10);
fs.writeFileSync(path.join(DIST, 'assets', 'site.css'), css);
fs.writeFileSync(path.join(DIST, 'assets', 'site.js'), js);
if (gtagJs) fs.writeFileSync(path.join(DIST, 'assets', 'gtag.js'), gtagJs);

const seo = seoConfig.seo;
const pages = [
  ['home', 'index.html', Object.assign({ key: 'home', prefetch: '/services' }, seo.home)],
  ['services', 'services.html', Object.assign({ key: 'services', prefetch: '/contact' }, seo.services)],
  ['about', 'about.html', Object.assign({ key: 'about', prefetch: '/contact' }, seo.about)],
  ['contact', 'contact.html', Object.assign({ key: 'contact' }, seo.contact)],
  ['thank-you', 'thank-you.html', { key: 'thank-you', noindex: true, path: '/thank-you',
    title: 'Thank you — ' + site.name, description: 'Your message has reached Greenline. We reply within one business day.' }],
  /* Cloudflare Pages serves 404.html for unknown URLs instead of falling back to the home page */
  ['404', '404.html', { key: '404', noindex: true, path: '/404',
    title: 'Page not found — ' + site.name, description: 'That page does not exist.' }],
];
for (const [name, file, meta] of pages) {
  console.log('Building ' + file + '...');
  fs.writeFileSync(path.join(DIST, file), page(name, meta, v), 'utf8');
}

console.log('Writing robots.txt and sitemap.xml...');
fs.writeFileSync(path.join(DIST, 'robots.txt'), robots(), 'utf8');
fs.writeFileSync(path.join(DIST, 'sitemap.xml'), sitemap(), 'utf8');

fs.copyFileSync(path.join(ROOT, 'sw.js'), path.join(DIST, 'sw.js'));
fs.copyFileSync(path.join(ROOT, '_headers'), path.join(DIST, '_headers'));
copyDir(path.join(ROOT, 'admin'), path.join(DIST, 'admin'));
copyStatic(path.join(ROOT, 'static'), DIST);

console.log('Build complete → dist/  (assets v=' + v + ')');
