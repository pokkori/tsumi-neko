import { Platform, Share } from "react-native";
import { CatShapeId } from "../types";
import { CAT_EMOJI, CAT_SHAPES } from "../data/catShapes";

export function generateEmojiGrid(
  shapesUsed: CatShapeId[],
  mergeCount: number,
  catCount: number,
): string {
  if (shapesUsed.length === 0) return "";

  // Build a grid showing which cat types were used
  const emojiRow = shapesUsed.map((s) => CAT_EMOJI[s] || "?").join("");

  // Create a visual representation of the tower
  const towerHeight = Math.min(catCount, 5);
  const towerLines: string[] = [];
  for (let i = 0; i < towerHeight; i++) {
    const width = Math.min(i + 1, 3);
    const cats = Array(width)
      .fill(null)
      .map(() => {
        const idx = Math.floor(Math.random() * shapesUsed.length);
        return CAT_EMOJI[shapesUsed[idx]] || "\u{1F431}";
      })
      .join("");
    towerLines.unshift(cats);
  }

  const grid = towerLines.join("\n");
  const mergeInfo = mergeCount > 0 ? `\n\u5408\u4F53: ${mergeCount}\u56DE \u2728` : "";

  return `${grid}${mergeInfo}\n\u4F7F\u3063\u305F\u732B: ${emojiRow}`;
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
    grad.addColorStop(1, "#FF8C55");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // タイトル
    ctx.fillStyle = "#fff";
    ctx.font = "bold 120px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("🐱 つみネコ", W / 2, 300);

    // スコア
    ctx.font = "bold 200px sans-serif";
    ctx.fillText(params.score.toLocaleString(), W / 2, H / 2);

    ctx.font = "60px sans-serif";
    ctx.fillText("点", W / 2, H / 2 + 100);

    // 最高進化
    if (params.maxEvolution) {
      ctx.font = "120px sans-serif";
      ctx.fillText(params.maxEvolution, W / 2, H / 2 + 280);
    }

    // ハッシュタグ
    ctx.font = "50px sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.fillText("#つみネコ #ネコゲーム #StackCats", W / 2, H - 200);

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
    if (params.maxEvolution) {
      const catEmoji = CAT_EMOJI[params.maxEvolution as CatShapeId] ?? '🐱';
      const evolutionName = CAT_SHAPES.find(c => c.id === params.maxEvolution)?.name ?? params.maxEvolution;
      // Evolution stage badge
      ctx.fillStyle = 'rgba(255,255,255,0.12)';
      ctx.beginPath();
      safeRoundRect(ctx, 820, 160, 340, 340, 20);
      ctx.fill();
      // Cat emoji (large)
      ctx.font = '160px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(catEmoji, 990, 370);
      // Evolution name
      ctx.fillStyle = '#FFD700';
      ctx.font = 'bold 28px sans-serif';
      ctx.fillText(`最高進化: ${evolutionName}`, 990, 450);
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
  [10000, "🏆ネコタワー伝説"],
  [5000,  "👑ずんぐりマスター"],
  [3000,  "🌟ネコ積み名人"],
  [1500,  "🔥コンボマニア"],
  [500,   "😺ネコ積みビギナー"],
  [0,     "🐱ちびネコ見習い"],
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
  const chunkyMark = maxEvolution === "chunky" ? "👑ずんぐりネコ達成！ " : "";
  const emojiGrid = generateEmojiGrid(shapesUsed, mergeCount, catCount);
  const rankTitle = (RANK_TITLES.find(([threshold]) => score >= threshold) ?? RANK_TITLES[RANK_TITLES.length - 1])[1];
  const hashtags = maxEvolution === "chunky"
    ? "#つみネコ #ねこ #StackCats #パズルゲーム #ずんぐりネコ"
    : "#つみネコ #ねこ #StackCats #パズルゲーム";
  const text = [
    `【つみネコ🐱】${rankTitle} | ${catCount}匹 | ${height.toFixed(1)}m`,
    `${chunkyMark}${recordMark}スコア: ${score.toLocaleString()}`,
    "",
    emojiGrid,
    "",
    "つみネコ - ネコを積み上げて合体させよう!",
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
