const fs   = require('fs');
const path = require('path');

const TEMPLATE_OPEN = '<script type="__bundler/template">';

function extract(src) {
  const tStart = src.indexOf(TEMPLATE_OPEN) + TEMPLATE_OPEN.length;
  const tEnd   = src.indexOf('</script>', tStart);
  return { tStart, tEnd, html: JSON.parse(src.substring(tStart, tEnd).trim()) };
}

function reencode(html) {
  return JSON.stringify(html).replace(/<\//g, '<\\u002F');
}

function logoImg(slug, alt) {
  return (
    `<img src="https://cdn.simpleicons.org/${slug}" alt="${alt}" ` +
    `style="height:26px;opacity:.45;filter:brightness(0) invert(1);` +
    `transition:opacity .2s;" ` +
    `onmouseover="this.style.opacity='.78'" ` +
    `onmouseout="this.style.opacity='.45'">`
  );
}

const LOGOS =
  logoImg('shopify',     'Shopify')     +
  logoImg('meta',        'Meta')        +
  logoImg('googleads',   'Google Ads')  +
  logoImg('amazon',      'Amazon')      +
  logoImg('walmart',     'Walmart')     +
  logoImg('woocommerce', 'WooCommerce') +
  logoImg('cloudflare',  'Cloudflare')  +
  `<span style="font-family:'IBM Plex Mono',monospace;font-size:12px;` +
  `color:rgba(255,255,255,0.3);letter-spacing:.06em;">& more</span>`;

// ── index.html ──────────────────────────────────────────────────────────────
// Insert a platform strip before the services section
function injectIndex() {
  const filePath = path.join(__dirname, '..', 'src', 'index.html');
  const src = fs.readFileSync(filePath, 'utf8');
  const { tStart, tEnd, html } = extract(src);

  if (html.includes('cdn.simpleicons.org')) {
    console.log('index.html: logos already present, skipping');
    return;
  }

  const anchor = 'id="services"';
  const idx = html.indexOf(anchor);
  if (idx === -1) throw new Error('Anchor id="services" not found in index.html');

  const tagStart = html.lastIndexOf('<', idx);

  const STRIP =
    `<section style="background:#0C1210;padding:36px 32px 60px;">` +
      `<div style="max-width:1200px;margin:0 auto;">` +
        `<p style="font-family:'IBM Plex Mono',monospace;font-size:10.5px;` +
           `letter-spacing:.22em;color:#4A7060;text-align:center;` +
           `margin:0 0 28px;text-transform:uppercase;">` +
          `Platforms we build on` +
        `</p>` +
        `<div style="display:flex;align-items:center;justify-content:center;` +
             `gap:44px;flex-wrap:wrap;">` +
          LOGOS +
        `</div>` +
      `</div>` +
    `</section>`;

  const newHtml = html.substring(0, tagStart) + STRIP + html.substring(tagStart);
  const newSrc  = src.substring(0, tStart) + '\n' + reencode(newHtml) + '\n' + src.substring(tEnd);
  fs.writeFileSync(filePath, newSrc, 'utf8');
  console.log('✓ index.html: platform strip injected before services section');
}

// ── services.html ───────────────────────────────────────────────────────────
// Populate the existing (empty) gl-pixelband div
function injectServices() {
  const filePath = path.join(__dirname, '..', 'src', 'services.html');
  const src = fs.readFileSync(filePath, 'utf8');
  const { tStart, tEnd, html } = extract(src);

  if (html.includes('cdn.simpleicons.org')) {
    console.log('services.html: logos already present, skipping');
    return;
  }

  const anchor = 'id="gl-pixelband"';
  const idx    = html.indexOf(anchor);
  if (idx === -1) throw new Error('Anchor id="gl-pixelband" not found in services.html');

  const tagStart   = html.lastIndexOf('<', idx);
  const closingGt  = html.indexOf('>', idx);
  if (closingGt === -1) throw new Error('Could not find > after gl-pixelband');

  const divEnd = html.indexOf('</div>', closingGt);
  if (divEnd === -1) throw new Error('Could not find </div> for gl-pixelband');

  // Rebuild the opening tag with updated gap/justify/padding for logos
  const openTag = html.substring(tagStart, closingGt + 1)
    .replace(/gap:\s*6px/, 'gap:44px')
    .replace(/justify-content:\s*flex-start/, 'justify-content:center')
    .replace(/padding:\s*0 32px/, 'padding:28px 32px 40px');

  const newHtml =
    html.substring(0, tagStart) +
    openTag +
    LOGOS +
    html.substring(divEnd); // includes </div> and everything after

  const newSrc = src.substring(0, tStart) + '\n' + reencode(newHtml) + '\n' + src.substring(tEnd);
  fs.writeFileSync(filePath, newSrc, 'utf8');
  console.log('✓ services.html: logos injected into gl-pixelband');
}

injectIndex();
injectServices();
