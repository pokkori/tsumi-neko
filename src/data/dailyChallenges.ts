import { ChallengeRule, DailyChallenge } from "../types";

const CHALLENGE_RULES: {
  rule: ChallengeRule;
  name: string;
  description: string;
  targetScore: number;
  rewardCoins: number;
  difficulty: number;
}[] = [
  { rule: "heavy_cats", name: "おデブ祭り", description: "全ネコの体重が2倍！重さに耐えろ！", targetScore: 2000, rewardCoins: 200, difficulty: 3 },
  { rule: "bouncy_cats", name: "バウンスフィーバー", description: "ネコがめっちゃ跳ねる！安定させろ！", targetScore: 1500, rewardCoins: 250, difficulty: 4 },
  { rule: "tiny_only", name: "ちびっこ集合", description: "ちびネコだけ！小さいけど不安定！", targetScore: 2500, rewardCoins: 150, difficulty: 2 },
  { rule: "fat_only", name: "重量級マッチ", description: "でぶネコだけ！重すぎて崩壊注意！", targetScore: 1800, rewardCoins: 200, difficulty: 3 },
  { rule: "no_guide", name: "ノーガイド", description: "落下ガイドなし！勘を頼りに！", targetScore: 2000, rewardCoins: 300, difficulty: 4 },
  { rule: "speed_up", name: "倍速チャレンジ", description: "落下速度2倍！素早い判断力が試される！", targetScore: 1500, rewardCoins: 250, difficulty: 4 },
  { rule: "low_gravity", name: "月面ネコ", description: "重力0.5倍！ふわふわ落下！", targetScore: 3000, rewardCoins: 150, difficulty: 2 },
  { rule: "high_friction", name: "ベタベタネコ", description: "摩擦2倍！くっつきやすいけど形が大事！", targetScore: 3500, rewardCoins: 150, difficulty: 1 },
  { rule: "random_wind", name: "嵐の日", description: "ランダムに横風が吹く！風に負けるな！", targetScore: 1500, rewardCoins: 300, difficulty: 5 },
  { rule: "mirror", name: "あべこべ", description: "操作が左右反転！脳がバグる！", targetScore: 1500, rewardCoins: 300, difficulty: 5 },
];

export function getDailyChallenge(dateStr: string): DailyChallenge {
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = (hash * 31 + dateStr.charCodeAt(i)) | 0;
  }
  const index = Math.abs(hash) % CHALLENGE_RULES.length;
  const rule = CHALLENGE_RULES[index];

  return {
    id: dateStr,
    rule: rule.rule,
    ruleName: rule.name,
    ruleDescription: rule.description,
    targetScore: rule.targetScore,
    rewardCoins: rule.rewardCoins,
  };
}

export function applyChallengeRule(
  rule: ChallengeRule,
  physicsParams: {
    gravity: { x: number; y: number };
    catMass: number;
    catRestitution: number;
    catFriction: number;
    dropSpeed: number;
    showGuide: boolean;
    windForce: number;
    mirrorInput: boolean;
  }
): typeof physicsParams {
  const p = { ...physicsParams };
  switch (rule) {
    case "heavy_cats": p.catMass *= 2; break;
    case "bouncy_cats": p.catRestitution = 0.5; break;
    case "tiny_only": break;
    case "fat_only": break;
    case "no_guide": p.showGuide = false; break;
    case "speed_up": p.dropSpeed *= 2; break;
    case "low_gravity": p.gravity = { ...p.gravity, y: p.gravity.y * 0.5 }; break;
    case "high_friction": p.catFriction *= 2; break;
    case "random_wind": p.windForce = 0.002; break;
    case "mirror": p.mirrorInput = true; break;
  }
  return p;
}
