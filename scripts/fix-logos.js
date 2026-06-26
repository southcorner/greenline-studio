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

// Inline SVG replacements for logos not on Simple Icons CDN
const AMAZON_SVG =
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 92 28" height="26" ` +
  `style="opacity:.45;transition:opacity .2s;" ` +
  `onmouseover="this.style.opacity='.78'" onmouseout="this.style.opacity='.45'" ` +
  `aria-label="Amazon">` +
    `<text x="1" y="18" fill="white" font-family="Arial,Helvetica,sans-serif" ` +
          `font-size="18" font-weight="900" font-style="italic" letter-spacing="-0.5">amazon</text>` +
    `<path d="M5,24 Q46,34 83,24" stroke="white" stroke-width="2.2" fill="none" stroke-linecap="round"/>` +
    `<polygon points="80,21.5 85,24 80,26.5" fill="white"/>` +
  `</svg>`;

const WALMART_SVG =
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 108 26" height="26" ` +
  `style="opacity:.45;transition:opacity .2s;" ` +
  `onmouseover="this.style.opacity='.78'" onmouseout="this.style.opacity='.45'" ` +
  `aria-label="Walmart">` +
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

const AMAZON_IMG = `<img src="https://cdn.simpleicons.org/amazon" alt="Amazon" ` +
  `style="height:26px;opacity:.45;filter:brightness(0) invert(1);transition:opacity .2s;" ` +
  `onmouseover="this.style.opacity='.78'" onmouseout="this.style.opacity='.45'">`;

const WALMART_IMG = `<img src="https://cdn.simpleicons.org/walmart" alt="Walmart" ` +
  `style="height:26px;opacity:.45;filter:brightness(0) invert(1);transition:opacity .2s;" ` +
  `onmouseover="this.style.opacity='.78'" onmouseout="this.style.opacity='.45'">`;

function fixFile(filename) {
  const filePath = path.join(__dirname, '..', 'src', filename);
  const src = fs.readFileSync(filePath, 'utf8');
  const { tStart, tEnd, html } = extract(src);

  let updated = html
    .replace(AMAZON_IMG,  AMAZON_SVG)
    .replace(WALMART_IMG, WALMART_SVG)
    .replace('Platforms we build on', 'Platforms we work on');

  if (updated === html) {
    console.log(`${filename}: nothing to update (already fixed?)`);
    return;
  }

  const newSrc = src.substring(0, tStart) + '\n' + reencode(updated) + '\n' + src.substring(tEnd);
  fs.writeFileSync(filePath, newSrc, 'utf8');
  console.log(`✓ ${filename}: Amazon/Walmart replaced with inline SVG, label updated`);
}

fixFile('index.html');
fixFile('services.html');
