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

/* SEO config lives in seo.json, not content.json: the CMS rewrites content.json from its
   own fields, so anything extra there is wiped on the next save. Defaults keep a build alive. */
const SEO_DEFAULTS = {
  site: {
    name: 'Greenline Commerce Studio', short_name: 'Greenline',
    base_url: 'https://greenlinestudio.in', locale: 'en',
    email: 'hello@greenlinestudio.in', twitter: '', theme_color: '#0A0F0D', gtag_id: '',
    og_image: '/og-image.png', founding_year: '2026', area_served: 'Worldwide', service_list: [],
  },
  seo: {
    home:     { title: 'Greenline Commerce Studio', description: '', path: '/',         keywords: '' },
    services: { title: 'Services — Greenline',       description: '', path: '/services', keywords: '' },
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
const GLYPHS = [
  '<path d="M4 20 20 4M13 4h7v7"></path>',
  '<circle cx="12" cy="12" r="3.6"></circle><ellipse cx="12" cy="12" rx="10" ry="4.4" transform="rotate(-24 12 12)"></ellipse>',
  '<path d="M4 11l8-6 8 6M4 18l8-6 8 6"></path>',
  '<rect x="3" y="3" width="18" height="18" rx="2"></rect><path d="M8 16V8l4 5 4-5v8"></path>',
  '<circle cx="12" cy="12" r="9"></circle><path d="M8.5 10h.01M15.5 10h.01M8 16c2.5-2 5.5-2 8 0"></path>',
  '<path d="M12 3l9 5v8l-9 5-9-5V8z"></path>',
];
const PLATFORMS = ['Shopify', 'WooCommerce', 'Amazon', 'Flipkart', 'Meta', 'Google Ads', 'X'];
/* each marquee set is printed twice so the CSS loop is seamless; the copy is hidden from assistive tech */
const twice = html => html + '<span class="mq-dup" aria-hidden="true">' + html + '</span>';

function clientMarks() {
  const names = [1, 2, 3, 4, 5, 6].map(i => content.home['tb_c' + i]).filter(Boolean);
  return twice(names.map((n, i) =>
    `<span class="wm wm-${i % 5}"><svg viewBox="0 0 24 24" aria-hidden="true">${GLYPHS[i % GLYPHS.length]}</svg>${esc(n)}</span>`).join(''));
}
const platformMarks = () => twice(PLATFORMS.map(p => `<span class="pm">${esc(p)}</span>`).join(''));

const visual = (s, i) =>
  `<div class="vis glass" data-sc data-io role="img" aria-label="Illustration: ${esc(s.alt)}"><div class="vis-in">${s.visual()}</div></div>`;

function homeServices() {
  return SERVICES.map((s, i) => {
    const n = i + 1;
    return `<article class="svc" id="svc-${n}">
        <div class="svc-media">${visual(s, i)}</div>
        <div class="svc-body">
          <span class="svc-n" aria-hidden="true">${pad(n)}</span>
          <p class="kicker" data-rv>${esc(content.services['s' + n + '_h2'])}</p>
          <h3 data-rv style="--d:1">${esc(content.home['svc' + n + '_title'])}</h3>
          <p class="d" data-rv style="--d:2">${esc(content.home['svc' + n + '_desc'])}</p>
          <a class="xlink" href="/services#s${n}">Explore<span class="arr"></span></a>
        </div>
      </article>`;
  }).join('\n      ');
}
const pager = () => SERVICES.map((s, i) =>
  `<a href="#svc-${i + 1}" data-svc="${i + 1}" aria-label="${esc(content.home['svc' + (i + 1) + '_title'])}" title="${esc(content.home['svc' + (i + 1) + '_title'])}"></a>`).join('');

const serviceChips = () => SERVICES.map((s, i) =>
  `<a class="chipl glass" href="#s${i + 1}"><i>${pad(i + 1)}</i>${esc(s.short)}</a>`).join('');

function serviceRows() {
  return SERVICES.map((s, i) => {
    const n = i + 1;
    return `<section class="srow" id="s${n}">
      <div class="wrap srow-grid">
        <div class="srow-media">${visual(s, i)}</div>
        <div class="srow-body">
          <p class="label">${pad(n)} / ${esc(s.label)}</p>
          <h2 data-rv>${esc(content.services['s' + n + '_h2'])}</h2>
          <p class="sub" data-rv style="--d:1">${esc(content.services['s' + n + '_body'])}</p>
          <ul class="bul">${s.bullets.map(b => `<li>${esc(b)}</li>`).join('')}</ul>
          <div class="tags">${s.tags.map(t => `<span class="tag">${esc(t)}</span>`).join('')}</div>
        </div>
      </div>
    </section>`;
  }).join('\n    ');
}
const formOptions = () => SERVICES.map((s, i) =>
  `<label class="chk"><input type="checkbox" name="requirement" id="bk-req-${i + 1}" value="${esc(s.short)}"><span>${esc(s.short)}</span></label>`).join('');

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
    `<link rel="canonical" href="${esc(canonical)}">`,
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
    '<meta property="og:image:width" content="600">',
    '<meta property="og:image:height" content="315">',
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
    '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=Outfit:wght@300;400;500;600&display=swap">',
    `<link rel="stylesheet" href="/assets/site.css?v=${v}">`,
    /* marks that scripts run, before first paint, so scroll reveals never flash */
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
  const ctx = {
    page: name, home: content.home, services: content.services, site, v,
    gen: {
      clients: clientMarks(), platforms: platformMarks(), home_services: homeServices(), pager: pager(),
      chips: serviceChips(), rows: serviceRows(), form_options: formOptions(),
    },
  };
  const body = render(read('src/pages/' + name + '.html'), ctx);
  return `<!DOCTYPE html>
<html lang="${esc(site.locale)}">
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

const pages = [
  ['home', 'index.html', Object.assign({ key: 'home', prefetch: '/services' }, seoConfig.seo.home)],
  ['services', 'services.html', Object.assign({ key: 'services', prefetch: '/' }, seoConfig.seo.services)],
  ['thank-you', 'thank-you.html', { key: 'thank-you', noindex: true, path: '/thank-you',
    title: 'Thank you — ' + site.name, description: 'Your request has reached Greenline. We reply within one business day.' }],
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
