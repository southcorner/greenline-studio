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

// Shared hover handlers and opacity
const HOVER = `onmouseover="this.style.opacity='.78'" onmouseout="this.style.opacity='.45'"`;
const BASE  = `opacity:.45;transition:opacity .2s;`;

function imgLogo(slug, alt, height = 36) {
  return (
    `<img src="https://cdn.simpleicons.org/${slug}" alt="${alt}" ` +
    `style="height:${height}px;${BASE}filter:brightness(0) invert(1);" ${HOVER}>`
  );
}

// Amazon — plain text wordmark (user requested)
const AMAZON_TEXT =
  `<span style="font-family:'Outfit',system-ui,sans-serif;font-size:24px;font-weight:700;` +
  `color:white;${BASE}display:inline-block;letter-spacing:-0.5px;" ${HOVER}>Amazon</span>`;

// Walmart — inline SVG, scaled up (height 36, viewBox proportionally adjusted)
const WALMART_SVG =
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 108 26" height="36" ` +
  `style="${BASE}" ${HOVER} aria-label="Walmart">` +
    `<g fill="white" transform="translate(13,13)">` +
      `<ellipse cx="0" cy="-6.5" rx="2.2" ry="4.5"/>` +
      `<ellipse cx="0" cy="-6.5" rx="2.2" ry="4.5" transform="rotate(60)"/>` +
      `<ellipse cx="0" cy="-6.5" rx="2.2" ry="4.5" transform="rotate(120)"/>` +
      `<ellipse cx="0" cy="-6.5" rx="2.2" ry="4.5" transform="rotate(180)"/>` +
      `<ellipse cx="0" cy="-6.5" rx="2.2" ry="4.5" transform="rotate(240)"/>` +
      `<ellipse cx="0" cy="-6.5" rx="2.2" ry="4.5" transform="rotate(300)"/>` +
    `</g>` +
    `<text x="32" y="18" fill="white" font-family="Arial,Helvetica,sans-serif" ` +
          `font-size="15" font-weight="bold" letter-spacing="0.3">walmart</text>` +
  `</svg>`;

// New logo row — all at 36px, WooCommerce slightly taller for visual parity
const NEW_LOGOS =
  imgLogo('shopify',     'Shopify',    36) +
  imgLogo('meta',        'Meta',       36) +
  imgLogo('googleads',   'Google Ads', 36) +
  AMAZON_TEXT +
  WALMART_SVG +
  imgLogo('woocommerce', 'WooCommerce', 40) + // slightly taller; the icon is compact
  imgLogo('cloudflare',  'Cloudflare',  36) +
  `<span style="font-family:'IBM Plex Mono',monospace;font-size:12px;` +
  `color:rgba(255,255,255,0.3);letter-spacing:.06em;">& more</span>`;

// Old logo row open tag (same in both files)
const OLD_ROW_OPEN = `<div style="display:flex;align-items:center;justify-content:center;gap:44px;flex-wrap:wrap;">`;
const OLD_ROW_CLOSE_AFTER = `& more</span></div>`;
const NEW_ROW_OPEN = `<div style="display:flex;align-items:center;justify-content:center;gap:48px;flex-wrap:wrap;row-gap:24px;">`;

// index.html: logos are inside a nested flex div
function fixIndex() {
  const filePath = path.join(__dirname, '..', 'src', 'index.html');
  const src = fs.readFileSync(filePath, 'utf8');
  const { tStart, tEnd, html } = extract(src);

  const rowStart = html.indexOf(OLD_ROW_OPEN);
  if (rowStart === -1) { console.log('index.html: logo row not found'); return; }

  const markerEnd = html.indexOf(OLD_ROW_CLOSE_AFTER, rowStart);
  if (markerEnd === -1) { console.log('index.html: closing marker not found'); return; }
  const afterRow = markerEnd + OLD_ROW_CLOSE_AFTER.length;

  const newHtml =
    html.substring(0, rowStart) +
    NEW_ROW_OPEN + NEW_LOGOS + `</div>` +
    html.substring(afterRow);

  const newSrc = src.substring(0, tStart) + '\n' + reencode(newHtml) + '\n' + src.substring(tEnd);
  fs.writeFileSync(filePath, newSrc, 'utf8');
  console.log('✓ index.html: logos updated');
}

// services.html: logos live directly inside #gl-pixelband (no nested div)
function fixServices() {
  const filePath = path.join(__dirname, '..', 'src', 'services.html');
  const src = fs.readFileSync(filePath, 'utf8');
  const { tStart, tEnd, html } = extract(src);

  const anchor = 'id="gl-pixelband"';
  const idx = html.indexOf(anchor);
  if (idx === -1) { console.log('services.html: gl-pixelband not found'); return; }

  const openTagEnd = html.indexOf('>', idx);
  const divClose   = html.indexOf('</div>', openTagEnd);
  if (divClose === -1) { console.log('services.html: closing </div> not found'); return; }

  // Replace contents of the pixelband div with new logos
  // Also update the div's own gap to match
  const oldOpenTag = html.substring(html.lastIndexOf('<', idx), openTagEnd + 1);
  const newOpenTag = oldOpenTag
    .replace(/gap:\s*\d+px/, 'gap:48px')
    .replace(/overflow:hidden/, 'overflow:visible');

  const newHtml =
    html.substring(0, html.lastIndexOf('<', idx)) +
    newOpenTag +
    NEW_LOGOS +
    html.substring(divClose);

  const newSrc = src.substring(0, tStart) + '\n' + reencode(newHtml) + '\n' + src.substring(tEnd);
  fs.writeFileSync(filePath, newSrc, 'utf8');
  console.log('✓ services.html: logos updated');
}

fixIndex();
fixServices();
