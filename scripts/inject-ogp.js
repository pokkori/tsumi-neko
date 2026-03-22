const fs = require('fs');
const path = require('path');

const distIndexPath = path.join(__dirname, '..', 'dist', 'index.html');

if (!fs.existsSync(distIndexPath)) {
  console.error('dist/index.html not found. Run expo export first.');
  process.exit(1);
}

let html = fs.readFileSync(distIndexPath, 'utf8');

// 1. lang="en" → lang="ja" 変換（常に実行）※スペース数に関わらずマッチ
html = html.replace(/<html([^>]*?)\s+lang="en"/, '<html$1 lang="ja"');

// 2. titleタグをキーワード付きに置換（常に実行）
// data-rh属性付きの空titleタグを置換
html = html.replace(
  /<title[^>]*><\/title>/,
  '<title>つみネコ - 猫を積み上げてずんぐりネコを目指せ！無料パズルゲーム</title>'
);
// 通常のtitleタグも対応
html = html.replace(
  /<title>つみネコ<\/title>/,
  '<title>つみネコ - 猫を積み上げてずんぐりネコを目指せ！無料パズルゲーム</title>'
);

// 3. OGPタグが未注入なら注入（条件付き）
if (html.includes('og:image')) {
  // OGP注入済みだがdescriptionが未注入なら追加
  if (!html.includes('<meta name="description"')) {
    const descTag = '<meta name="description" content="猫を積み上げてずんぐりネコを目指す無料パズルゲーム！10種類の個性豊かなネコとずんぐりボスが登場。ランク制度でリプレイ性抜群。" />\n';
    html = html.replace('<head>', '<head>' + descTag);
    console.log('description meta tag added.');
  } else {
    console.log('OGP tags already present, skipping OGP injection.');
  }
} else {
  const ogpTags = `<meta name="description" content="猫を積み上げてずんぐりネコを目指す無料パズルゲーム！10種類の個性豊かなネコとずんぐりボスが登場。ランク制度でリプレイ性抜群。" />
<meta property="og:type" content="website" />
<meta property="og:title" content="つみネコ - 猫を積み上げてずんぐりネコを目指せ！無料パズルゲーム" />
<meta property="og:description" content="猫を積み上げてずんぐりネコを目指す無料パズルゲーム！10種類の個性豊かなネコとずんぐりボスが登場。ランク制度でリプレイ性抜群。" />
<meta property="og:url" content="https://tsumi-neko.vercel.app" />
<meta property="og:image" content="https://tsumi-neko.vercel.app/og-image.png" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="つみネコ - 猫を積み上げてずんぐりネコを目指せ！無料パズルゲーム" />
<meta name="twitter:description" content="猫を積み上げてずんぐりネコを目指す無料パズルゲーム！10種類の個性豊かなネコとずんぐりボスが登場。ランク制度でリプレイ性抜群。" />
<meta name="twitter:image" content="https://tsumi-neko.vercel.app/og-image.png" />
`;
  html = html.replace('<head>', '<head>' + ogpTags);
  console.log('OGP tags injected into dist/index.html');
}

fs.writeFileSync(distIndexPath, html, 'utf8');
console.log('lang/title updates applied to dist/index.html');
