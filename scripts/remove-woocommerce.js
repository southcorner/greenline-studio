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

// Match the exact WooCommerce img tag as it exists in the committed src files
const WOO_PATTERN = /<img src="https:\/\/cdn\.simpleicons\.org\/woocommerce"[^>]*>/;

function removeWoo(filename) {
  const filePath = path.join(__dirname, '..', 'src', filename);
  const src = fs.readFileSync(filePath, 'utf8');
  const { tStart, tEnd, html } = extract(src);

  if (!html.includes('woocommerce')) {
    console.log(filename + ': WooCommerce not found, skipping');
    return;
  }

  const newHtml = html.replace(WOO_PATTERN, '');

  if (newHtml === html) {
    console.log(filename + ': pattern did not match — check tag format');
    return;
  }

  const newSrc =
    src.substring(0, tStart) + '\n' +
    reencode(newHtml) + '\n' +
    src.substring(tEnd);

  fs.writeFileSync(filePath, newSrc, 'utf8');
  console.log('✓ ' + filename + ': WooCommerce removed');
}

removeWoo('index.html');
removeWoo('services.html');
