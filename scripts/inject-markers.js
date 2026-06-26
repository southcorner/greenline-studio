// One-time script: injects __GL_MARKER__ placeholders into src/ bundle files.
// Run once after initial setup: node scripts/inject-markers.js
// After running, verify src/ files contain markers, then commit everything.
'use strict';
const fs = require('fs');
const path = require('path');

const TEMPLATE_OPEN = '<script type="__bundler/template">';

function extractAndDecode(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const tStart = raw.indexOf(TEMPLATE_OPEN) + TEMPLATE_OPEN.length;
  const tEnd   = raw.indexOf('</script>', tStart);
  return {
    raw,
    tStart,
    tEnd,
    html: JSON.parse(raw.substring(tStart, tEnd).trim()),
  };
}

function reEncode(html) {
  return JSON.stringify(html).replace(/<\//g, '<\\u002F');
}

function splice(raw, tStart, tEnd, newJson) {
  return raw.substring(0, tStart) + '\n' + newJson + '\n' + raw.substring(tEnd);
}

function injectAll(html, replacements) {
  let changed = 0;
  for (const [search, marker] of replacements) {
    if (!html.includes(search)) {
      console.warn(`  WARNING: not found — "${search.substring(0, 60)}"`);
      continue;
    }
    html = html.split(search).join(marker);
    changed++;
    console.log(`  OK: ${marker}`);
  }
  return { html, changed };
}

// ── index.html ────────────────────────────────────────────────────────────────
const IDX_REPLACEMENTS = [
  // Hero
  ['DIGITAL COMMERCE STUDIO',
    '__GL_HERO_EYEBROW__'],
  ['Commerce,<br>engineered<br>to ',
    '__GL_HERO_H1_BEFORE__'],
  ['>grow.<span style="position:absolute',
    '>__GL_HERO_H1_HIGHLIGHT__<span style="position:absolute'],
  ['We design, build and run high-performance storefronts on Shopify and beyond, for brands that want growth without the friction.',
    '__GL_HERO_SUB__'],
  // Services section (homepage)
  ['Everything between idea and order confirmed.',
    '__GL_SERVICES_H2__'],
  ['One partner for build, marketplace and marketing, across every platform you sell on.',
    '__GL_SERVICES_SUBLINE__'],
  // Service cards
  ['>Web Development</h3>',                     '>__GL_SVC1_TITLE__</h3>'],
  ['Custom sites and headless builds engineered for speed, SEO and conversion, pixel-faithful to your brand.',
    '__GL_SVC1_DESC__'],
  ['>Ecommerce Store Building</h3>',             '>__GL_SVC2_TITLE__</h3>'],
  ['Shopify, WooCommerce and more, theme, catalogue and checkout set up to sell from day one.',
    '__GL_SVC2_DESC__'],
  ['>Marketplace Management</h3>',               '>__GL_SVC3_TITLE__</h3>'],
  ['Amazon, Flipkart and every major platform, listings, catalogue, ads and account health, handled.',
    '__GL_SVC3_DESC__'],
  ['>Digital Marketing</h3>',                    '>__GL_SVC4_TITLE__</h3>'],
  ['Performance campaigns across Google, Meta, X and Amazon Ads, every rupee tracked to revenue.',
    '__GL_SVC4_DESC__'],
  ['>Social Media Handling</h3>',                '>__GL_SVC5_TITLE__</h3>'],
  ['Content, calendars, community and growth, a feed that builds the brand between launches.',
    '__GL_SVC5_DESC__'],
  ['>Product Design</h3>',                       '>__GL_SVC6_TITLE__</h3>'],
  ['Talented product designers sit with you to design your dream product, from first sketch to production-ready specs.',
    '__GL_SVC6_DESC__'],
  ['>Branding</h3>',                             '>__GL_SVC7_TITLE__</h3>'],
  ['Branding consultation and operations, identity, voice and the guidelines that keep every touchpoint on-brand.',
    '__GL_SVC7_DESC__'],
  // Work / case studies
  ['Stores that earn their keep.',               '__GL_WORK_H2__'],
  ['>Lumen Skincare</h3>',                       '>__GL_CASE1_CLIENT__</h3>'],
  ['A full replatform to headless Shopify Plus, a 1.4s storefront and a checkout rebuilt around the customer.',
    '__GL_CASE1_DESC__'],
  ['>Harbor Goods</h3>',                         '>__GL_CASE2_CLIENT__</h3>'],
  ['CRO + merchandising retainer. 14 straight months of growth.',
    '__GL_CASE2_DESC__'],
  ['>Northwind</h3>',                            '>__GL_CASE3_CLIENT__</h3>'],
  ['Custom headless build for a 40k-SKU catalogue.',
    '__GL_CASE3_DESC__'],
  // Process
  ['A straight line, four steps.',               '__GL_PROCESS_H2__'],
  ['>Audit</h3>',                                '>__GL_PROC1_TITLE__</h3>'],
  ['We map your stack, data and funnel to find where revenue leaks.',
    '__GL_PROC1_DESC__'],
  ['>Design</h3>',                               '>__GL_PROC2_TITLE__</h3>'],
  ['Systemised UX and brand-true interfaces, prototyped fast.',
    '__GL_PROC2_DESC__'],
  ['>Build</h3>',                                '>__GL_PROC3_TITLE__</h3>'],
  ['Engineered, tested and launched, fast stores that hold up.',
    '__GL_PROC3_DESC__'],
  ['>Operate</h3>',                              '>__GL_PROC4_TITLE__</h3>'],
  ['We stay on, optimising, merchandising, keeping the line up.',
    '__GL_PROC4_DESC__'],
  // CTA
  ["Let’s build something that grows.",     '__GL_CTA_H2__'],
  ["Tell us where you are and where you want to be. We’ll map the straightest line to get there.",
    '__GL_CTA_SUB__'],
];

// ── services.html ─────────────────────────────────────────────────────────────
const SVC_REPLACEMENTS = [
  // Intro H1
  ['One studio for the<br>whole commerce ',      '__GL_SINT_H1_BEFORE__'],
  ['>stack.<span style="position:absolute',
    '>__GL_SINT_H1_HIGHLIGHT__<span style="position:absolute'],
  // Intro paragraph
  ['From the storefront you build to the marketplaces you sell on and the campaigns that drive demand, seven services, one accountable partner.',
    '__GL_SINT_DESC__'],
  // Service sections
  ['Storefronts engineered to convert.',         '__GL_S1_H2__'],
  ['Custom websites and headless builds, fast by default. We sweat Core Web Vitals, SEO and the details that turn visits into orders.',
    '__GL_S1_BODY__'],
  ['Ready to sell from day one.',                '__GL_S2_H2__'],
  ['We stand up complete stores on Shopify, WooCommerce and beyond, theme, catalogue, payments and checkout, configured to your operations.',
    '__GL_S2_BODY__'],
  ['Win on every platform you sell on.',         '__GL_S3_H2__'],
  ['Full account management for Amazon, Flipkart and the rest, listings, cataloguing, advertising and the operational health that keeps you ranking.',
    '__GL_S3_BODY__'],
  ['Demand that pays for itself.',               '__GL_S4_H2__'],
  ['Full-funnel performance marketing across every channel that matters, Google, Meta, X and Amazon Ads, with every rupee tracked to revenue.',
    '__GL_S4_BODY__'],
  ['A feed that builds the brand.',              '__GL_S5_H2__'],
  ['Always-on content, community and growth, the day-to-day presence that keeps your brand alive between launches and campaigns.',
    '__GL_S5_BODY__'],
  ['Design the product, not just the page.',     '__GL_S6_H2__'],
  ['Talented product designers sit with you to shape your dream product, from first sketch to production-ready specs, grounded in how people actually shop.',
    '__GL_S6_BODY__'],
  ['A brand people remember and trust.',         '__GL_S7_H2__'],
  ['Branding consultation and operations, identity, voice and the guidelines that keep every touchpoint consistent as you scale.',
    '__GL_S7_BODY__'],
  // Pricing
  ['Pick the line that fits.',                   '__GL_PRICING_H2__'],
  ['>Fixed build</h3>',                          '>__GL_TIER1_NAME__</h3>'],
  ['A defined scope, timeline and price, for a new store, replatform or site build.',
    '__GL_TIER1_DESC__'],
  ['>Monthly partner</h3>',                      '>__GL_TIER2_NAME__</h3>'],
  ['Ongoing marketplace, marketing and social management, a team on call every month.',
    '__GL_TIER2_DESC__'],
  ['>Strategy sprint</h3>',                      '>__GL_TIER3_NAME__</h3>'],
  ['A focused audit and roadmap when you need direction before you commit to a build.',
    '__GL_TIER3_DESC__'],
  // CTA
  ["Tell us what you sell. We’ll handle the rest.",  '__GL_SCTA_H2__'],
  ['One conversation to map the straightest line from where you are to where you want to be.',
    '__GL_SCTA_SUB__'],
];

function processFile(srcFile, replacements, label) {
  console.log(`\n── ${label} ──`);
  const filePath = path.join(__dirname, '..', 'src', srcFile);
  const { raw, tStart, tEnd, html } = extractAndDecode(filePath);
  const { html: injected, changed } = injectAll(html, replacements);
  if (changed === 0) {
    console.log('  No changes made — file may already have markers.');
    return;
  }
  const output = splice(raw, tStart, tEnd, reEncode(injected));
  fs.writeFileSync(filePath, output, 'utf8');
  console.log(`  Done. ${changed}/${replacements.length} markers injected.`);
}

processFile('index.html',    IDX_REPLACEMENTS, 'index.html');
processFile('services.html', SVC_REPLACEMENTS, 'services.html');
console.log('\nMarker injection complete. Run `node build.js` to verify the build output.');
