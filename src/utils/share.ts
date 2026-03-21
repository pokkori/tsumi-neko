import { Platform, Share } from "react-native";
import { CatShapeId } from "../types";
import { CAT_EMOJI } from "../data/catShapes";

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
}): Promise<string | null> {
  if (Platform.OS !== "web") return null;

  try {
    // Create an offscreen canvas for the OGP image
    const canvas = document.createElement("canvas");
    canvas.width = 1200;
    canvas.height = 630;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, 630);
    gradient.addColorStop(0, "#87CEEB");
    gradient.addColorStop(1, "#1A1A2E");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1200, 630);

    // Title
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 48px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("\u3064\u307F\u30CD\u30B3 - Stack Cats!", 600, 80);

    // New Record banner
    if (params.isNewRecord) {
      ctx.fillStyle = "#FFD700";
      ctx.font = "bold 36px sans-serif";
      ctx.fillText("NEW RECORD!", 600, 130);
    }

    // Score card background
    ctx.fillStyle = "rgba(255,255,255,0.15)";
    roundRect(ctx, 100, 160, 500, 380, 20);
    ctx.fill();

    // Score details
    ctx.fillStyle = "#FFFFFF";
    ctx.textAlign = "left";
    ctx.font = "24px sans-serif";

    const labels = [
      ["Score", params.score.toLocaleString()],
      ["Height", `${params.height.toFixed(1)}m`],
      ["Cats", `${params.catCount}`],
      ["Max Combo", `x${params.maxCombo}`],
      ["Merges", `x${params.mergeCount}`],
    ];

    let y = 220;
    for (const [label, value] of labels) {
      ctx.fillStyle = "rgba(255,255,255,0.7)";
      ctx.font = "22px sans-serif";
      ctx.fillText(label, 140, y);

      ctx.fillStyle = "#FFFFFF";
      ctx.font = "bold 28px sans-serif";
      ctx.fillText(value, 420, y);

      y += 60;
    }

    // Cat tower illustration (right side)
    const emojiList = params.shapesUsed.map((s) => CAT_EMOJI[s] || "\u{1F431}");
    ctx.textAlign = "center";
    ctx.font = "48px sans-serif";
    const towerX = 850;
    let towerY = 500;
    const catsToDraw = Math.min(params.catCount, 8);
    for (let i = 0; i < catsToDraw; i++) {
      const emoji = emojiList[i % emojiList.length];
      ctx.fillText(emoji, towerX + (i % 2 === 0 ? 0 : 30), towerY);
      towerY -= 50;
    }

    // Hashtag
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.font = "18px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("#\u3064\u307F\u30CD\u30B3 #StackCats", 600, 610);

    return canvas.toDataURL("image/png");
  } catch {
    return null;
  }
}

/** Helper to draw rounded rectangle */
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
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
  const emojiGrid = generateEmojiGrid(shapesUsed, mergeCount, catCount);
  const text = [
    `\u3010\u3064\u307F\u30CD\u30B3\uD83D\uDC31\u3011${catCount}\u5339\u7A4D\u3093\u3060\uFF01\u6700\u9AD8\u30E9\u30F3\u30AF: ${maxEvolution || "?"}!`,
    `${recordMark}\u9AD8\u3055: ${height.toFixed(1)}m | \u30B9\u30B3\u30A2: ${score.toLocaleString()}`,
    "",
    emojiGrid,
    "",
    "\u3064\u307F\u30CD\u30B3 - \u30CD\u30B3\u3092\u7A4D\u307F\u4E0A\u3052\u3066\u5408\u4F53\u3055\u305B\u3088\u3046!",
    "#\u3064\u307F\u30CD\u30B3 #StackCats",
  ].filter(Boolean).join("\n");

  // Try to generate and share image on web
  if (Platform.OS === "web") {
    const imageDataUrl = await generateShareImage({
      score,
      height,
      catCount,
      maxCombo,
      mergeCount,
      isNewRecord,
      shapesUsed,
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
