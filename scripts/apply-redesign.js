/**
 * Splices redesigned template HTML (edited as plain files in the scratchpad)
 * back into the bundled src/ files, replacing the JSON-encoded template string.
 * Usage: node scripts/apply-redesign.js <scratchpad-dir>
 */
const fs   = require('fs');
const path = require('path');

const SCRATCH = process.argv[2];
if (!SCRATCH) { console.error('usage: node apply-redesign.js <scratchpad-dir>'); process.exit(1); }

const TEMPLATE_OPEN = '<script type="__bundler/template">';

const PAIRS = [
  ['index.html',    'index-template.html'],
  ['services.html', 'services-template.html'],
];

for (const [srcFile, tplFile] of PAIRS) {
  const srcPath = path.join(__dirname, '..', 'src', srcFile);
  const src     = fs.readFileSync(srcPath, 'utf8');
  const tStart  = src.indexOf(TEMPLATE_OPEN) + TEMPLATE_OPEN.length;
  const tEnd    = src.indexOf('</script>', tStart);

  // sanity: current template must parse before we touch anything
  JSON.parse(src.substring(tStart, tEnd).trim());

  const html      = fs.readFileSync(path.join(SCRATCH, tplFile), 'utf8');
  const reEncoded = JSON.stringify(html).replace(/<\//g, '<\\u002F');
  const out = src.substring(0, tStart) + '\n' + reEncoded + '\n' + src.substring(tEnd);
  fs.writeFileSync(srcPath, out, 'utf8');

  // verify round-trip
  const chk = fs.readFileSync(srcPath, 'utf8');
  const cS  = chk.indexOf(TEMPLATE_OPEN) + TEMPLATE_OPEN.length;
  const cE  = chk.indexOf('</script>', cS);
  const parsed = JSON.parse(chk.substring(cS, cE).trim());
  if (parsed !== html) throw new Error(srcFile + ': round-trip mismatch');
  console.log('✓ ' + srcFile + ' re-encoded (' + html.length + ' chars), round-trip OK');
}
