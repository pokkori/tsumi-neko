const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

const W = 1200, H = 630;
const canvas = createCanvas(W, H);
const ctx = canvas.getContext('2d');

// 背景グラデーション
const grad = ctx.createLinearGradient(0, 0, W, H);
grad.addColorStop(0, '#FF6B9D');
grad.addColorStop(1, '#C44569');
ctx.fillStyle = grad;
ctx.fillRect(0, 0, W, H);

// タイトル
ctx.fillStyle = '#FFFFFF';
ctx.font = 'bold 80px sans-serif';
ctx.textAlign = 'center';
ctx.fillText('\uD83D\uDC31 つみネコ', W / 2, 240);

// サブタイトル
ctx.font = '40px sans-serif';
ctx.fillText('ネコを積み上げてずんぐりネコを目指せ！', W / 2, 330);

// URL
ctx.fillStyle = 'rgba(255,255,255,0.8)';
ctx.font = '30px sans-serif';
ctx.fillText('tsumi-neko.vercel.app', W / 2, H - 40);

const outDir = path.join(__dirname, '..', 'public');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'og-image.png'), canvas.toBuffer('image/png'));
console.log('og-image.png generated');
