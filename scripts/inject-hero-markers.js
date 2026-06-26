/**
 * One-time script: injects CMS markers into src/index.html for
 * - Hero stats card (metric label, number, sub-line)
 * - Hero case-study card (eyebrow, title, tag1, tag2)
 * - Trusted-by strip (label + 6 client names)
 */
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

const REPLACEMENTS = [
  // ── Hero stats card ──────────────────────────────────────────────
  ['AVG. REVENUE LIFT',                         '__GL_METRIC_LABEL__'],
  // data-count attribute AND display value
  ['data-count="2.4"',                          'data-count="__GL_METRIC_NUM__"'],
  ['>2.4×</span>',                              '>__GL_METRIC_NUM__×</span>'],
  ['across 120+ commerce builds',               '__GL_METRIC_SUB__'],

  // ── Hero case-study card ─────────────────────────────────────────
  ['LIVE · LUMEN SKINCARE',                     '__GL_CARD_EYEBROW__'],
  ['Shopify Plus replatform',                   '__GL_CARD_TITLE__'],
  // Use surrounding style context to avoid hitting other occurrences
  ['padding:4px 10px;">+38% CVR</span>',        'padding:4px 10px;">__GL_CARD_TAG1__</span>'],
  ['padding:4px 10px;">Headless</span>',        'padding:4px 10px;">__GL_CARD_TAG2__</span>'],

  // ── Trusted-by strip ─────────────────────────────────────────────
  ['TRUSTED BY MODERN BRANDS',                  '__GL_TB_LABEL__'],
  ['<span>Katana</span>',                       '<span>__GL_TB_C1__</span>'],
  ['<span>Harbor&nbsp;Goods</span>',            '<span>__GL_TB_C2__</span>'],
  ['<span>Atelier&nbsp;9</span>',               '<span>__GL_TB_C3__</span>'],
  ['<span>Northwind</span>',                    '<span>__GL_TB_C4__</span>'],
  ['<span>Maré</span>',                    '<span>__GL_TB_C5__</span>'],
  ['<span>Foundry&nbsp;Co.</span>',             '<span>__GL_TB_C6__</span>'],
];

const filePath = path.join(__dirname, '..', 'src', 'index.html');
const src = fs.readFileSync(filePath, 'utf8');
const { tStart, tEnd, html } = extract(src);

if (html.includes('__GL_METRIC_LABEL__')) {
  console.log('Markers already injected — nothing to do');
  process.exit(0);
}

let updated = html;
let count   = 0;

for (const [from, to] of REPLACEMENTS) {
  if (!updated.includes(from)) {
    console.warn('  WARNING: anchor not found:', JSON.stringify(from));
    continue;
  }
  updated = updated.split(from).join(to);
  count++;
}

const newSrc = src.substring(0, tStart) + '\n' + reencode(updated) + '\n' + src.substring(tEnd);
fs.writeFileSync(filePath, newSrc, 'utf8');
console.log(`✓ index.html: ${count}/${REPLACEMENTS.length} markers injected`);
