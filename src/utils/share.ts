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
        return CAT_EMOJI[shapesUsed[idx]] || "🐱";
      })
      .join("");
    towerLines.unshift(cats);
  }

  const grid = towerLines.join("\n");
  const mergeInfo = mergeCount > 0 ? `\n合体: ${mergeCount}回 ✨` : "";

  return `${grid}${mergeInfo}\n使った猫: ${emojiRow}`;
}

export async function shareResult(params: {
  score: number;
  height: number;
  catCount: number;
  isNewRecord: boolean;
  mergeCount?: number;
  shapesUsed?: CatShapeId[];
}): Promise<void> {
  const { score, height, catCount, isNewRecord, mergeCount = 0, shapesUsed = [] } = params;

  const recordMark = isNewRecord ? "NEW RECORD! " : "";
  const emojiGrid = generateEmojiGrid(shapesUsed, mergeCount, catCount);

  const text = [
    `${recordMark}ネコを${catCount}匹積み上げた!`,
    `高さ: ${height.toFixed(1)}m`,
    `スコア: ${score.toLocaleString()}`,
    "",
    emojiGrid,
    "",
    "つみネコ - ネコを積み上げて合体させよう!",
    "#つみネコ #StackCats",
  ].join("\n");

  try {
    await Share.share({
      message: text,
    });
  } catch {
    // User cancelled or share failed
  }
}
