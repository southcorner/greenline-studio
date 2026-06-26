'use strict';
const fs   = require('fs');
const path = require('path');
const zlib = require('zlib');

const content = JSON.parse(fs.readFileSync(path.join(__dirname, 'content.json'), 'utf8'));
const TEMPLATE_OPEN = '<script type="__bundler/template">';

// SEO config lives in its own file (seo.json), NOT content.json: the in-repo
// CMS rewrites content.json from only its known home/services fields, so any
// extra keys there get wiped on the next save. Reading SEO separately keeps it
// CMS-proof. Fall back to safe defaults so a build never crashes on it.
const SEO_DEFAULTS = {
  site: {
    name: 'Greenline Commerce Studio', short_name: 'Greenline',
    base_url: 'https://greenline.studio', locale: 'en',
    email: 'hello@greenlinestudio.in', twitter: '', theme_color: '#0C1210',
    og_image: '/og-image.png', founding_year: '2026', area_served: 'Worldwide',
    service_list: [],
  },
  seo: {
    home:     { title: 'Greenline Commerce Studio', description: '', path: '/',         keywords: '' },
    services: { title: 'Services — Greenline',       description: '', path: '/services', keywords: '' },
  },
};

let seoConfig = SEO_DEFAULTS;
try {
  const loaded = JSON.parse(fs.readFileSync(path.join(__dirname, 'seo.json'), 'utf8'));
  seoConfig = {
    site: Object.assign({}, SEO_DEFAULTS.site, loaded.site),
    seo:  Object.assign({}, SEO_DEFAULTS.seo,  loaded.seo),
  };
} catch (e) {
  console.warn('  WARNING: seo.json missing or invalid — using SEO defaults:', e.message);
}

// Marker → content value maps for each page
const HOME_MARKERS = {
  '__GL_HERO_EYEBROW__':     content.home.hero_eyebrow,
  '__GL_METRIC_LABEL__':    content.home.metric_label,
  '__GL_METRIC_NUM__':      content.home.metric_num,
  '__GL_METRIC_SUB__':      content.home.metric_sub,
  '__GL_CARD_EYEBROW__':    content.home.card_eyebrow,
  '__GL_CARD_TITLE__':      content.home.card_title,
  '__GL_CARD_TAG1__':       content.home.card_tag1,
  '__GL_CARD_TAG2__':       content.home.card_tag2,
  '__GL_TB_LABEL__':        content.home.tb_label,
  '__GL_TB_C1__':           content.home.tb_c1,
  '__GL_TB_C2__':           content.home.tb_c2,
  '__GL_TB_C3__':           content.home.tb_c3,
  '__GL_TB_C4__':           content.home.tb_c4,
  '__GL_TB_C5__':           content.home.tb_c5,
  '__GL_TB_C6__':           content.home.tb_c6,
  '__GL_HERO_H1_BEFORE__':   content.home.hero_h1_before,
  '__GL_HERO_H1_HIGHLIGHT__': content.home.hero_h1_highlight,
  '__GL_HERO_SUB__':          content.home.hero_sub,
  '__GL_SERVICES_H2__':       content.home.services_h2,
  '__GL_SERVICES_SUBLINE__':  content.home.services_subline,
  '__GL_SVC1_TITLE__':        content.home.svc1_title,
  '__GL_SVC1_DESC__':         content.home.svc1_desc,
  '__GL_SVC2_TITLE__':        content.home.svc2_title,
  '__GL_SVC2_DESC__':         content.home.svc2_desc,
  '__GL_SVC3_TITLE__':        content.home.svc3_title,
  '__GL_SVC3_DESC__':         content.home.svc3_desc,
  '__GL_SVC4_TITLE__':        content.home.svc4_title,
  '__GL_SVC4_DESC__':         content.home.svc4_desc,
  '__GL_SVC5_TITLE__':        content.home.svc5_title,
  '__GL_SVC5_DESC__':         content.home.svc5_desc,
  '__GL_SVC6_TITLE__':        content.home.svc6_title,
  '__GL_SVC6_DESC__':         content.home.svc6_desc,
  '__GL_SVC7_TITLE__':        content.home.svc7_title,
  '__GL_SVC7_DESC__':         content.home.svc7_desc,
  '__GL_WORK_H2__':           content.home.work_h2,
  '__GL_CASE1_CLIENT__':      content.home.case1_client,
  '__GL_CASE1_DESC__':        content.home.case1_desc,
  '__GL_CASE2_CLIENT__':      content.home.case2_client,
  '__GL_CASE2_DESC__':        content.home.case2_desc,
  '__GL_CASE3_CLIENT__':      content.home.case3_client,
  '__GL_CASE3_DESC__':        content.home.case3_desc,
  '__GL_PROCESS_H2__':        content.home.process_h2,
  '__GL_PROC1_TITLE__':       content.home.proc1_title,
  '__GL_PROC1_DESC__':        content.home.proc1_desc,
  '__GL_PROC2_TITLE__':       content.home.proc2_title,
  '__GL_PROC2_DESC__':        content.home.proc2_desc,
  '__GL_PROC3_TITLE__':       content.home.proc3_title,
  '__GL_PROC3_DESC__':        content.home.proc3_desc,
  '__GL_PROC4_TITLE__':       content.home.proc4_title,
  '__GL_PROC4_DESC__':        content.home.proc4_desc,
  '__GL_CTA_H2__':            content.home.cta_h2,
  '__GL_CTA_SUB__':           content.home.cta_sub,
};

const SERVICES_MARKERS = {
  '__GL_SINT_H1_BEFORE__':    content.services.sint_h1_before,
  '__GL_SINT_H1_HIGHLIGHT__': content.services.sint_h1_highlight,
  '__GL_SINT_DESC__':         content.services.sint_desc,
  '__GL_S1_H2__':             content.services.s1_h2,
  '__GL_S1_BODY__':           content.services.s1_body,
  '__GL_S2_H2__':             content.services.s2_h2,
  '__GL_S2_BODY__':           content.services.s2_body,
  '__GL_S3_H2__':             content.services.s3_h2,
  '__GL_S3_BODY__':           content.services.s3_body,
  '__GL_S4_H2__':             content.services.s4_h2,
  '__GL_S4_BODY__':           content.services.s4_body,
  '__GL_S5_H2__':             content.services.s5_h2,
  '__GL_S5_BODY__':           content.services.s5_body,
  '__GL_S6_H2__':             content.services.s6_h2,
  '__GL_S6_BODY__':           content.services.s6_body,
  '__GL_S7_H2__':             content.services.s7_h2,
  '__GL_S7_BODY__':           content.services.s7_body,
  '__GL_PRICING_H2__':        content.services.pricing_h2,
  '__GL_TIER1_NAME__':        content.services.tier1_name,
  '__GL_TIER1_DESC__':        content.services.tier1_desc,
  '__GL_TIER2_NAME__':        content.services.tier2_name,
  '__GL_TIER2_DESC__':        content.services.tier2_desc,
  '__GL_TIER3_NAME__':        content.services.tier3_name,
  '__GL_TIER3_DESC__':        content.services.tier3_desc,
  '__GL_SCTA_H2__':           content.services.cta_h2,
  '__GL_SCTA_SUB__':          content.services.cta_sub,
};

const site = seoConfig.site;

// ── SEO helpers ───────────────────────────────────────────────────────────
function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function absUrl(p) {
  if (/^https?:\/\//i.test(p)) return p;
  return site.base_url.replace(/\/$/, '') + (p.startsWith('/') ? p : '/' + p);
}

// Google tag (gtag.js) — emitted when site.gtag_id is set. Loaded as high in
// the head as possible so Google Ads conversions and analytics fire on load.
function gtagHead() {
  const id = site.gtag_id;
  if (!id) return '';
  const safeId = String(id).replace(/[^A-Za-z0-9_-]/g, '');
  // Inject gtag.js dynamically from a single inline script (no <script src>):
  // the bundler boot awaits every src script in order, so a static gtag tag
  // would block app init until it loads. Creating it at runtime keeps it async.
  return '<!-- Google tag (gtag.js) --><script>' +
    'window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}' +
    'gtag("js",new Date());gtag("config","' + safeId + '");' +
    '(function(){var g=document.createElement("script");g.async=true;' +
    'g.src="https://www.googletagmanager.com/gtag/js?id=' + safeId + '";' +
    'document.head.appendChild(g);})();</script>';
}

// JSON-LD graph: Organization + WebSite on every page, plus a Service catalogue
// on the services page. Inlined as a <script type="application/ld+json">.
function jsonLd(seoKey) {
  const org = {
    '@type': 'Organization',
    '@id': absUrl('/#organization'),
    name: site.name,
    url: absUrl('/'),
    email: site.email,
    logo: absUrl('/favicon.svg'),
    image: absUrl(site.og_image),
    foundingDate: site.founding_year,
    areaServed: site.area_served,
    sameAs: [],
    contactPoint: {
      '@type': 'ContactPoint',
      email: site.email,
      contactType: 'sales',
      areaServed: site.area_served,
    },
  };
  const website = {
    '@type': 'WebSite',
    '@id': absUrl('/#website'),
    name: site.name,
    url: absUrl('/'),
    publisher: { '@id': absUrl('/#organization') },
    inLanguage: site.locale,
  };
  const graph = [org, website];

  if (seoKey === 'services') {
    graph.push({
      '@type': 'OfferCatalog',
      '@id': absUrl('/services#catalog'),
      name: 'Commerce services',
      provider: { '@id': absUrl('/#organization') },
      itemListElement: site.service_list.map((name, i) => ({
        '@type': 'Offer',
        position: i + 1,
        itemOffered: { '@type': 'Service', name, provider: { '@id': absUrl('/#organization') } },
      })),
    });
  }

  const data = { '@context': 'https://schema.org', '@graph': graph };
  // Escape closing tags so the JSON can't break out of the <script> element.
  return '<script type="application/ld+json">' +
    JSON.stringify(data).replace(/</g, '\\u003C') +
    '</script>';
}

// Document-level click delegate for copy-to-clipboard buttons (keyed off
// data-copy-email). Delegation is used instead of an inline onclick because the
// design-tool React layer rejects string event handlers (React error #231);
// a document listener is framework-agnostic and survives re-renders.
function copyDelegateScript() {
  return '<script>(function(){if(window.__glCopy)return;window.__glCopy=1;' +
    'document.addEventListener("click",function(e){' +
    'var b=e.target&&e.target.closest&&e.target.closest("[data-copy-email]");if(!b)return;' +
    'e.preventDefault();var email=b.getAttribute("data-copy-email");' +
    'var t=b.querySelector("[data-ct]")||b;var o=t.textContent;' +
    'function f(s){t.textContent=s?"Copied!":"Press Ctrl+C";' +
    'b.style.borderColor=s?"#36E08B":"#C0492F";' +
    'setTimeout(function(){t.textContent=o;b.style.borderColor="#2A3431";},1600);}' +
    'try{navigator.clipboard.writeText(email).then(function(){f(1);},function(){f(0);});}' +
    'catch(x){f(0);}});})();</script>';
}

// Full <head> SEO block injected into the served wrapper (visible without JS).
function seoHead(seoKey) {
  const seo = seoConfig.seo[seoKey];
  const canonical = absUrl(seo.path);
  const ogImg = absUrl(site.og_image);
  const lines = [
    `<title>${esc(seo.title)}</title>`,
    `<meta name="viewport" content="width=device-width, initial-scale=1">`,
    `<meta name="description" content="${esc(seo.description)}">`,
    seo.keywords ? `<meta name="keywords" content="${esc(seo.keywords)}">` : '',
    `<meta name="robots" content="index, follow, max-image-preview:large">`,
    `<meta name="theme-color" content="${esc(site.theme_color)}">`,
    `<link rel="canonical" href="${esc(canonical)}">`,
    `<link rel="icon" type="image/svg+xml" href="/favicon.svg">`,
    `<link rel="apple-touch-icon" href="/apple-touch-icon.png">`,
    // Open Graph
    `<meta property="og:type" content="website">`,
    `<meta property="og:site_name" content="${esc(site.name)}">`,
    `<meta property="og:title" content="${esc(seo.title)}">`,
    `<meta property="og:description" content="${esc(seo.description)}">`,
    `<meta property="og:url" content="${esc(canonical)}">`,
    `<meta property="og:image" content="${esc(ogImg)}">`,
    `<meta property="og:image:width" content="600">`,
    `<meta property="og:image:height" content="315">`,
    `<meta property="og:locale" content="${esc(site.locale)}">`,
    // Twitter
    `<meta name="twitter:card" content="summary_large_image">`,
    site.twitter ? `<meta name="twitter:site" content="${esc(site.twitter)}">` : '',
    `<meta name="twitter:title" content="${esc(seo.title)}">`,
    `<meta name="twitter:description" content="${esc(seo.description)}">`,
    `<meta name="twitter:image" content="${esc(ogImg)}">`,
    jsonLd(seoKey),
  ].filter(Boolean);
  return lines.join('\n  ');
}

// Strip the rendered template down to clean, crawlable HTML for a <noscript>
// fallback, so non-JS crawlers still receive the real page copy.
function readableFallback(decodedHtml) {
  let h = decodedHtml;
  const bOpen = h.indexOf('<body');
  if (bOpen >= 0) h = h.slice(h.indexOf('>', bOpen) + 1);
  const bClose = h.lastIndexOf('</body>');
  if (bClose >= 0) h = h.slice(0, bClose);

  h = h
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<svg[\s\S]*?<\/svg>/gi, '')
    .replace(/<helmet[\s\S]*?<\/helmet>/gi, '')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<link[^>]*>/gi, '');

  // Fill known template expressions, drop the rest.
  h = h.replace(/\{\{\s*email\s*\}\}/g, site.email).replace(/\{\{[^}]*\}\}/g, '');

  const keep = new Set(['h1','h2','h3','h4','h5','h6','p','ul','ol','li','a','nav','footer','header','section','article','strong','em','br']);
  h = h.replace(/<(\/?)([a-zA-Z0-9-]+)([^>]*)>/g, (m, slash, tag, attrs) => {
    tag = tag.toLowerCase();
    if (!keep.has(tag)) return '';
    if (tag === 'a' && !slash) {
      const hm = attrs.match(/href="([^"]*)"/i);
      return hm ? `<a href="${esc(hm[1])}">` : '<a>';
    }
    return '<' + slash + tag + '>';
  });

  h = h.replace(/[ \t]+/g, ' ').replace(/(\s*\n\s*){2,}/g, '\n').trim();
  return '<noscript>\n<div id="seo-content">\n' + h + '\n</div>\n</noscript>';
}

// Rewrite third-party CDN script URLs baked into the bundler's app asset to
// self-hosted /vendor copies — removes the unpkg supply-chain dependency (and
// the boot stall when that CDN is slow/blocked). The app bundle is a gzipped,
// base64 asset in the manifest, so we decode, swap URLs, and re-encode.
const VENDOR_MAP = {
  'https://unpkg.com/@babel/standalone@7.26.4/babel.min.js': '/vendor/babel.min.js',
  'https://unpkg.com/react@18.3.1/umd/react.production.min.js': '/vendor/react.production.min.js',
  'https://unpkg.com/react-dom@18.3.1/umd/react-dom.production.min.js': '/vendor/react-dom.production.min.js',
};
function selfHostBundle(out) {
  const open = '<script type="__bundler/manifest">';
  const i = out.indexOf(open);
  if (i < 0) return out;
  const s = i + open.length;
  const e = out.indexOf('</script>', s);
  const manifest = JSON.parse(out.substring(s, e).trim());
  let changed = false;
  for (const key of Object.keys(manifest)) {
    const a = manifest[key];
    if (!a || a.mime !== 'text/javascript' || !a.data) continue;
    const buf = Buffer.from(a.data, 'base64');
    let js = a.compressed ? zlib.gunzipSync(buf).toString('utf8') : buf.toString('utf8');
    let next = js;
    for (const [url, local] of Object.entries(VENDOR_MAP)) next = next.split(url).join(local);
    if (next !== js) {
      const outBuf = a.compressed ? zlib.gzipSync(Buffer.from(next, 'utf8')) : Buffer.from(next, 'utf8');
      a.data = outBuf.toString('base64');
      changed = true;
    }
  }
  if (!changed) return out;
  return out.substring(0, s) + '\n' + JSON.stringify(manifest) + '\n' + out.substring(e);
}

function buildPage(srcFile, seoKey, markers) {
  const src    = fs.readFileSync(path.join(__dirname, 'src', srcFile), 'utf8');
  const tStart = src.indexOf(TEMPLATE_OPEN) + TEMPLATE_OPEN.length;
  const tEnd   = src.indexOf('</script>', tStart);
  let html     = JSON.parse(src.substring(tStart, tEnd).trim());

  for (const [marker, value] of Object.entries(markers)) {
    html = html.split(marker).join(value);
  }

  // Verify no markers remain
  const remaining = [...html.matchAll(/__GL_[A-Z0-9_]+__/g)].map(m => m[0]);
  if (remaining.length > 0) {
    console.warn(`  WARNING: unresolved markers in ${srcFile}:`, [...new Set(remaining)]);
  }

  // Build crawlable fallback from the resolved template before re-encoding.
  const fallback = readableFallback(html);

  // ── Inject SEO + analytics into the TEMPLATE head ──
  // The bundler boot does documentElement.replaceWith(template), which discards
  // the outer wrapper <head>. So tags that must survive into the live DOM (and
  // run, e.g. gtag) have to live in the template head. We inject them before the
  // template's </head>; the outer-head copy below is purely for non-JS crawlers
  // that read the raw HTML and never execute the bundler.
  // Delegate first so it registers even if a later script stalls; then SEO, then gtag.
  const templateHeadInject = '\n' + copyDelegateScript() + '\n  ' + seoHead(seoKey) + '\n  ' + gtagHead() + '\n';
  html = html.replace('</head>', templateHeadInject + '</head>');
  // Also set lang on the TEMPLATE <html> — the bundler swaps documentElement to
  // it, so without this the rendered DOM has no lang (only the wiped outer head).
  html = html.replace('<html>', `<html lang="${esc(site.locale)}">`);

  // Re-encode: JSON.stringify then escape closing tags to prevent </script> in output
  const reEncoded = JSON.stringify(html).replace(/<\//g, '<\\u002F');
  let out = src.substring(0, tStart) + '\n' + reEncoded + '\n' + src.substring(tEnd);

  // ── Inject SEO into the served wrapper (what non-JS crawlers read) ──
  // (This copy is wiped when the bundler swaps in the template; the template
  // head injection above is what persists for JS clients and gtag.)
  out = out.replace('<html>', `<html lang="${esc(site.locale)}">`);
  out = out.replace('<title>Bundled Page</title>', seoHead(seoKey));
  out = out.replace('</body>\n</html>', fallback + '\n</body>\n</html>');

  // Point the bundled app at self-hosted React/Babel instead of unpkg.
  out = selfHostBundle(out);

  return out;
}

function copyFile(src, dest) {
  if (fs.existsSync(src)) fs.copyFileSync(src, dest);
}

function copyDir(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

// Copy static assets into dist. Binary assets are stored base64-encoded as
// "<name>.b64" text files (so the repo stays text-only and pushable); they are
// decoded back to their real binary form on build.
function copyStatic(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    if (entry.isDirectory()) {
      copyStatic(s, path.join(dest, entry.name));   // recurse (e.g. static/vendor)
    } else if (entry.name.endsWith('.b64')) {
      fs.writeFileSync(path.join(dest, entry.name.slice(0, -4)), Buffer.from(fs.readFileSync(s, 'utf8'), 'base64'));
    } else {
      fs.copyFileSync(s, path.join(dest, entry.name));
    }
  }
}

// robots.txt — allow everything except the CMS admin, point at the sitemap.
function buildRobots() {
  return [
    'User-agent: *',
    'Allow: /',
    'Disallow: /admin/',
    'Disallow: /admin',
    '',
    `Sitemap: ${absUrl('/sitemap.xml')}`,
    '',
  ].join('\n');
}

// sitemap.xml — one entry per public page, derived from the SEO config.
function buildSitemap() {
  const today = new Date().toISOString().slice(0, 10);
  const urls = Object.values(seoConfig.seo).map(seo => (
    '  <url>\n' +
    `    <loc>${esc(absUrl(seo.path))}</loc>\n` +
    `    <lastmod>${today}</lastmod>\n` +
    `    <changefreq>monthly</changefreq>\n` +
    `    <priority>${seo.path === '/' ? '1.0' : '0.8'}</priority>\n` +
    '  </url>'
  )).join('\n');
  return '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    urls + '\n</urlset>\n';
}

// Build
fs.mkdirSync(path.join(__dirname, 'dist'), { recursive: true });

console.log('Building index.html...');
fs.writeFileSync(path.join(__dirname, 'dist', 'index.html'),    buildPage('index.html',    'home',     HOME_MARKERS),     'utf8');

console.log('Building services.html...');
fs.writeFileSync(path.join(__dirname, 'dist', 'services.html'), buildPage('services.html', 'services', SERVICES_MARKERS), 'utf8');

console.log('Writing robots.txt and sitemap.xml...');
fs.writeFileSync(path.join(__dirname, 'dist', 'robots.txt'),  buildRobots(),  'utf8');
fs.writeFileSync(path.join(__dirname, 'dist', 'sitemap.xml'), buildSitemap(), 'utf8');

copyFile(path.join(__dirname, 'sw.js'),    path.join(__dirname, 'dist', 'sw.js'));
copyFile(path.join(__dirname, '_headers'), path.join(__dirname, 'dist', '_headers'));
copyDir( path.join(__dirname, 'admin'),    path.join(__dirname, 'dist', 'admin'));
copyStatic(path.join(__dirname, 'static'), path.join(__dirname, 'dist'));

console.log('Build complete → dist/');
