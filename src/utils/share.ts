import { Platform, Share } from "react-native";
import { CatShapeId } from "../types";
import { CAT_EMOJI, CAT_SHAPES } from "../data/catShapes";

export function generateEmojiGrid(
  shapesUsed: CatShapeId[],
  mergeCount: number,
  catCount: number,
): string {
  if (shapesUsed.length === 0) return "";

  const EVOLUTION_ORDER: CatShapeId[] = ["tiny","round","long","flat","loaf","triangle","curled","fat","stretchy","chunky"];
  const STAGE_NUMBERS: Record<string, string> = {
    tiny: "1", round: "2", long: "3", flat: "4", loaf: "5",
    triangle: "6", curled: "7", fat: "8", stretchy: "9", chunky: "10",
  };

  // Build a grid showing which cat stages were used
  const stageRow = shapesUsed.map((s) => STAGE_NUMBERS[s] || "?").join("-");

  // Create a visual representation of the tower using stage numbers
  const towerHeight = Math.min(catCount, 5);
  const towerLines: string[] = [];
  for (let i = 0; i < towerHeight; i++) {
    const width = Math.min(i + 1, 3);
    const cats = Array(width)
      .fill(null)
      .map(() => {
        const idx = Math.floor(Math.random() * shapesUsed.length);
        return `[${STAGE_NUMBERS[shapesUsed[idx]] || "?"}]`;
      })
      .join("");
    towerLines.unshift(cats);
  }

  const grid = towerLines.join("\n");
  const mergeInfo = mergeCount > 0 ? `\n合体: ${mergeCount}回` : "";

  return `${grid}${mergeInfo}\n使った猫: ${stageRow}`;
}

/** Canvas 2D でネコを描画（シェア画像用） */
function drawCanvasCat(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
  evolutionId?: string,
) {
  const colors: Record<string, { body: string; belly: string }> = {
    tiny:    { body: '#F4C2C2', belly: '#FDEBD0' },
    round:   { body: '#FFB347', belly: '#FFF0DC' },
    long:    { body: '#87CEEB', belly: '#E0F4FF' },
    flat:    { body: '#DDA0DD', belly: '#F5E6FF' },
    loaf:    { body: '#98FB98', belly: '#E8FFE8' },
    triangle:{ body: '#FF7F7F', belly: '#FFE8E8' },
    curled:  { body: '#F0E68C', belly: '#FFFFF0' },
    fat:     { body: '#20B2AA', belly: '#E0FFFF' },
    stretchy:{ body: '#FF8C00', belly: '#FFE4B5' },
    chunky:  { body: '#FF6B35', belly: '#FFF5E6' },
  };
  const c = colors[evolutionId ?? ''] ?? { body: '#FF6B35', belly: '#FFF5E6' };
  const r = size / 2;

  ctx.save();

  // 胴体（楕円）
  ctx.fillStyle = c.body;
  ctx.beginPath();
  ctx.ellipse(cx, cy + r * 0.3, r * 0.85, r * 0.7, 0, 0, Math.PI * 2);
  ctx.fill();

  // 頭
  ctx.fillStyle = c.body;
  ctx.beginPath();
  ctx.arc(cx, cy - r * 0.2, r * 0.65, 0, Math.PI * 2);
  ctx.fill();

  // 耳（三角）
  ctx.fillStyle = c.body;
  const earW = r * 0.35;
  const earH = r * 0.45;
  // 左耳
  ctx.beginPath();
  ctx.moveTo(cx - r * 0.45, cy - r * 0.65);
  ctx.lineTo(cx - r * 0.45 - earW, cy - r * 0.65 - earH);
  ctx.lineTo(cx - r * 0.1, cy - r * 0.65);
  ctx.closePath();
  ctx.fill();
  // 右耳
  ctx.beginPath();
  ctx.moveTo(cx + r * 0.45, cy - r * 0.65);
  ctx.lineTo(cx + r * 0.45 + earW, cy - r * 0.65 - earH);
  ctx.lineTo(cx + r * 0.1, cy - r * 0.65);
  ctx.closePath();
  ctx.fill();

  // お腹（楕円）
  ctx.fillStyle = c.belly;
  ctx.beginPath();
  ctx.ellipse(cx, cy - r * 0.15, r * 0.35, r * 0.28, 0, 0, Math.PI * 2);
  ctx.fill();

  // 目
  ctx.fillStyle = '#1a1a2e';
  ctx.beginPath();
  ctx.arc(cx - r * 0.22, cy - r * 0.28, r * 0.09, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx + r * 0.22, cy - r * 0.28, r * 0.09, 0, Math.PI * 2);
  ctx.fill();

  // 目のハイライト
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.arc(cx - r * 0.19, cy - r * 0.31, r * 0.03, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx + r * 0.25, cy - r * 0.31, r * 0.03, 0, Math.PI * 2);
  ctx.fill();

  // 鼻
  ctx.fillStyle = '#FF8FAB';
  ctx.beginPath();
  ctx.arc(cx, cy - r * 0.15, r * 0.06, 0, Math.PI * 2);
  ctx.fill();

  // ひげ
  ctx.strokeStyle = 'rgba(0,0,0,0.3)';
  ctx.lineWidth = r * 0.025;
  ctx.lineCap = 'round';
  [[cx - r * 0.06, cx - r * 0.55], [cx - r * 0.06, cx - r * 0.55], [cx + r * 0.06, cx + r * 0.55]].forEach(() => {});
  // 左ひげ
  for (let i = -1; i <= 1; i++) {
    ctx.beginPath();
    ctx.moveTo(cx - r * 0.06, cy - r * 0.12 + i * r * 0.08);
    ctx.lineTo(cx - r * 0.55, cy - r * 0.18 + i * r * 0.1);
    ctx.stroke();
  }
  // 右ひげ
  for (let i = -1; i <= 1; i++) {
    ctx.beginPath();
    ctx.moveTo(cx + r * 0.06, cy - r * 0.12 + i * r * 0.08);
    ctx.lineTo(cx + r * 0.55, cy - r * 0.18 + i * r * 0.1);
    ctx.stroke();
  }

  // しっぽ
  ctx.strokeStyle = c.body;
  ctx.lineWidth = r * 0.15;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(cx + r * 0.7, cy + r * 0.5);
  ctx.quadraticCurveTo(cx + r * 1.3, cy + r * 0.2, cx + r * 1.1, cy - r * 0.1);
  ctx.stroke();

  ctx.restore();
}

/**
 * Generate a 1080x1920 vertical share image for TikTok/Instagram Stories
 */
export async function generateVerticalShareImage(params: {
  score: number;
  maxEvolution?: string;
}): Promise<string | null> {
  if (Platform.OS !== "web") return null;

  try {
    const canvas = document.createElement("canvas");
    const W = 1080;
    const H = 1920;
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    // 背景グラデーション
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, "#FF6B35");
    grad.addColorStop(0.5, "#FF8C55");
    grad.addColorStop(1, "#FFF5E6");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // ネコイラスト（大きく中央上部に）
    drawCanvasCat(ctx, W / 2, H * 0.28, 480, params.maxEvolution);

    // タイトル
    ctx.fillStyle = "#fff";
    ctx.font = "bold 100px sans-serif";
    ctx.textAlign = "center";
    ctx.shadowColor = "rgba(0,0,0,0.3)";
    ctx.shadowBlur = 12;
    ctx.fillText("つみネコ", W / 2, 180);
    ctx.shadowBlur = 0;

    // スコア背景カード
    ctx.fillStyle = "rgba(255,255,255,0.2)";
    ctx.beginPath();
    if (typeof (ctx as any).roundRect === 'function') {
      (ctx as any).roundRect(W / 2 - 400, H * 0.58, 800, 300, 30);
    } else {
      ctx.rect(W / 2 - 400, H * 0.58, 800, 300);
    }
    ctx.fill();

    // スコア
    ctx.fillStyle = "#fff";
    ctx.font = "bold 180px sans-serif";
    ctx.shadowColor = "rgba(0,0,0,0.4)";
    ctx.shadowBlur = 16;
    ctx.fillText(params.score.toLocaleString(), W / 2, H * 0.58 + 210);
    ctx.shadowBlur = 0;
    ctx.font = "50px sans-serif";
    ctx.fillText("点", W / 2, H * 0.58 + 280);

    // 最高進化名
    if (params.maxEvolution) {
      const evolutionName = CAT_SHAPES.find(c => c.id === params.maxEvolution)?.name ?? params.maxEvolution;
      ctx.font = "bold 60px sans-serif";
      ctx.fillStyle = "#FFD700";
      ctx.shadowColor = "rgba(0,0,0,0.5)";
      ctx.shadowBlur = 8;
      ctx.fillText(`最高進化: ${evolutionName}`, W / 2, H * 0.9);
      ctx.shadowBlur = 0;
    }

    // ハッシュタグ
    ctx.font = "44px sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.fillText("#つみネコ #ネコゲーム #StackCats", W / 2, H - 150);
    ctx.font = "36px sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.6)";
    ctx.fillText("https://tsumi-neko.vercel.app", W / 2, H - 80);

    return canvas.toDataURL("image/png");
  } catch {
    return null;
  }
}

/**
 * Generate a 1200x630 OGP share image using html2canvas (Web) or Canvas API
 */
export async function generateShareImage(params: {
  score: number;
  height: number;
  catCount: number;
  maxCombo: number;
  mergeCount: number;
  isNewRecord: boolean;
  shapesUsed: CatShapeId[];
  maxEvolution?: string;
}): Promise<string | null> {
  if (Platform.OS !== "web") return null;

  try {
    // Create an offscreen canvas for the OGP image
    const canvas = document.createElement("canvas");
    const W = 1200;
    const H = 630;
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, H);
    gradient.addColorStop(0, "#87CEEB");
    gradient.addColorStop(1, "#1A1A2E");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, W, H);

    // Title
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 48px sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("\u3064\u307F\u30CD\u30B3 - Stack Cats!", 80, 80);

    // New Record banner
    if (params.isNewRecord) {
      ctx.fillStyle = "#FFD700";
      ctx.font = "bold 36px sans-serif";
      ctx.textAlign = "left";
      ctx.fillText("NEW RECORD!", 80, 130);
    }

    // Score card background
    ctx.fillStyle = "rgba(255,255,255,0.15)";
    safeRoundRect(ctx, 100, 160, 500, 380, 20);
    ctx.fill();

    // Score details
    ctx.fillStyle = "#FFFFFF";
    ctx.textAlign = "left";
    ctx.font = "24px sans-serif";

    const labels: [string, string][] = [
      ["Score", params.score.toLocaleString()],
      ["Height", `${params.height.toFixed(1)}m`],
      ["Cats", `${params.catCount}`],
      ["Max Combo", `x${params.maxCombo}`],
      ["Merges", `x${params.mergeCount}`],
    ];
    if (params.maxEvolution) {
      labels.push(["最高進化", params.maxEvolution]);
    }

    let y = 220;
    for (const [label, value] of labels) {
      ctx.fillStyle = "rgba(255,255,255,0.7)";
      ctx.font = "22px sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(label, 140, y);

      ctx.fillStyle = "#FFFFFF";
      ctx.font = "bold 28px sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(value, 420, y);

      y += 55;
    }

    // Highest evolution cat drawing (右側に大きく表示)
    {
      const evolutionName = params.maxEvolution
        ? (CAT_SHAPES.find(c => c.id === params.maxEvolution)?.name ?? params.maxEvolution)
        : "ネコ";
      // Evolution stage badge background
      ctx.fillStyle = 'rgba(255,255,255,0.12)';
      ctx.beginPath();
      safeRoundRect(ctx, 820, 140, 340, 380, 20);
      ctx.fill();
      ctx.strokeStyle = '#FFD700';
      ctx.lineWidth = 2;
      ctx.strokeRect(822, 142, 336, 376);
      // ネコSVGをCanvas 2Dで描画
      drawCanvasCat(ctx, 990, 290, 220, params.maxEvolution);
      // Evolution label
      ctx.fillStyle = '#FFD700';
      ctx.font = 'bold 24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`最高進化: ${evolutionName}`, 990, 490);
    }

    // URL and Hashtags
    ctx.fillStyle = "rgba(255,255,255,0.6)";
    ctx.font = "22px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("https://tsumi-neko.vercel.app", 600, H - 55);
    ctx.font = "20px sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.fillText("#つみネコ #ネコ #StackCats #パズルゲーム", 600, H - 25);

    return canvas.toDataURL("image/png");
  } catch {
    return null;
  }
}

/** ブラウザ互換 rounded rectangle（roundRect非対応環境でもクラッシュしない） */
function safeRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  if (typeof (ctx as any).roundRect === 'function') {
    (ctx as any).roundRect(x, y, w, h, r);
    return;
  }
  // フォールバック: quadraticCurveTo で角丸を描画
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

const GAME_URL = "https://tsumi-neko.vercel.app";

const RANK_TITLES: [number, string][] = [
  [10000, "ネコタワー伝説"],
  [5000,  "ずんぐりマスター"],
  [3000,  "ネコ積み名人"],
  [1500,  "コンボマニア"],
  [500,   "ネコ積みビギナー"],
  [0,     "ちびネコ見習い"],
];

export async function shareResult(params: {
  score: number;
  height: number;
  catCount: number;
  isNewRecord: boolean;
  mergeCount?: number;
  shapesUsed?: CatShapeId[];
  maxCombo?: number;
  maxEvolution?: string;
}): Promise<void> {
  const { score, height, catCount, isNewRecord, mergeCount = 0, shapesUsed = [], maxCombo = 0, maxEvolution = "" } = params;

  const recordMark = isNewRecord ? "NEW RECORD! " : "";
  const chunkyMark = maxEvolution === "chunky" ? "★ずんぐりネコ達成！ " : "";
  const emojiGrid = generateEmojiGrid(shapesUsed, mergeCount, catCount);
  const rankTitle = (RANK_TITLES.find(([threshold]) => score >= threshold) ?? RANK_TITLES[RANK_TITLES.length - 1])[1];
  const gameRankStr = score >= 8000 ? "S" : score >= 4000 ? "A" : score >= 1500 ? "B" : "C";
  const hashtags = maxEvolution === "chunky"
    ? "#つみネコ #ねこ #StackCats #パズルゲーム #ずんぐりネコ"
    : "#つみネコ #ねこ #StackCats #パズルゲーム";
  const challengeCall = score < 1500
    ? "あなたはずんぐりネコを誕生させられる？"
    : score < 5000
    ? "ずんぐりネコまであと少し…続きは自分でやってみて"
    : "このスコア、超えられる？";

  const text = [
    `つみネコ スコア ${score.toLocaleString()} 点！ランク${gameRankStr}`,
    `${chunkyMark}${recordMark}${catCount}匹 | 高さ${height.toFixed(1)}m | ${rankTitle}`,
    "",
    emojiGrid,
    "",
    challengeCall,
    "つみネコ - 猫を積んで合体！最強ずんぐりネコを目指せ",
    GAME_URL,
    hashtags,
  ].filter(Boolean).join("\n");

  // Try to generate and share image on web
  if (Platform.OS === "web") {
    // 縦型画像を優先（TikTok/Instagram Stories向け）
    const verticalDataUrl = await generateVerticalShareImage({ score, maxEvolution });
    const imageDataUrl = verticalDataUrl ?? await generateShareImage({
      score,
      height,
      catCount,
      maxCombo,
      mergeCount,
      isNewRecord,
      shapesUsed,
      maxEvolution,
    });

    if (imageDataUrl) {
      // Try Web Share API with image
      try {
        const blob = await (await fetch(imageDataUrl)).blob();
        const file = new File([blob], "tsumineko-score.png", { type: "image/png" });

        if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            text,
            files: [file],
          });
          return;
        }
      } catch {
        // Fall through to text share
      }

      // Fallback: open image in new tab for manual download
      try {
        const link = document.createElement("a");
        link.href = imageDataUrl;
        link.download = "tsumineko-score.png";
        link.click();
      } catch {
        // ignore
      }
    }
  }

  // Text-only share fallback
  try {
    await Share.share({
      message: text,
    });
  } catch {
    // User cancelled or share failed
  }
}
