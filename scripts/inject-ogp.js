const fs = require('fs');
const path = require('path');

const distIndexPath = path.join(__dirname, '..', 'dist', 'index.html');

if (!fs.existsSync(distIndexPath)) {
  console.error('dist/index.html not found. Run expo export first.');
  process.exit(1);
}

let html = fs.readFileSync(distIndexPath, 'utf8');

if (html.includes('og:image')) {
  console.log('OGP tags already present, skipping.');
  process.exit(0);
}

const ogpTags = `<meta property="og:type" content="website" />
<meta property="og:title" content="つみネコ - ネコを積み上げるパズルゲーム" />
<meta property="og:description" content="ネコを積み上げてずんぐりネコを目指せ！物理演算×ネコ×パズル。無料プレイ。" />
<meta property="og:url" content="https://tsumi-neko.vercel.app" />
<meta property="og:image" content="https://tsumi-neko.vercel.app/og-image.png" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="つみネコ - ネコを積み上げるパズルゲーム" />
<meta name="twitter:description" content="ネコを積み上げてずんぐりネコを目指せ！物理演算×ネコ×パズル。" />
<meta name="twitter:image" content="https://tsumi-neko.vercel.app/og-image.png" />
`;

// <head>の直後に挿入
html = html.replace('<head>', '<head>' + ogpTags);
fs.writeFileSync(distIndexPath, html, 'utf8');
console.log('OGP tags injected into dist/index.html');
