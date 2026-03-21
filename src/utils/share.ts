import { Platform, Share } from "react-native";

export async function shareResult(params: {
  score: number;
  height: number;
  catCount: number;
  isNewRecord: boolean;
}): Promise<void> {
  const { score, height, catCount, isNewRecord } = params;

  const recordMark = isNewRecord ? "NEW RECORD! " : "";
  const text = [
    `${recordMark}ネコを${catCount}匹積み上げた！`,
    `高さ: ${height.toFixed(1)}m`,
    `スコア: ${score.toLocaleString()}`,
    "",
    "つみネコ - ネコを積み上げるだけなのにハマる！",
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
