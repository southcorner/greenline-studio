'use strict';
const fs   = require('fs');
const path = require('path');

const content = JSON.parse(fs.readFileSync(path.join(__dirname, 'content.json'), 'utf8'));
const TEMPLATE_OPEN = '<script type="__bundler/template">';

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

function buildPage(srcFile, markers) {
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

  // Re-encode: JSON.stringify then escape closing tags to prevent </script> in output
  const reEncoded = JSON.stringify(html).replace(/<\//g, '<\\u002F');
  return src.substring(0, tStart) + '\n' + reEncoded + '\n' + src.substring(tEnd);
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

// Build
fs.mkdirSync(path.join(__dirname, 'dist'), { recursive: true });

console.log('Building index.html...');
fs.writeFileSync(path.join(__dirname, 'dist', 'index.html'),    buildPage('index.html',    HOME_MARKERS),     'utf8');

console.log('Building services.html...');
fs.writeFileSync(path.join(__dirname, 'dist', 'services.html'), buildPage('services.html', SERVICES_MARKERS), 'utf8');

copyFile(path.join(__dirname, 'sw.js'),    path.join(__dirname, 'dist', 'sw.js'));
copyFile(path.join(__dirname, '_headers'), path.join(__dirname, 'dist', '_headers'));
copyDir( path.join(__dirname, 'admin'),    path.join(__dirname, 'dist', 'admin'));

console.log('Build complete → dist/');
