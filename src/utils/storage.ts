import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  PlayerStats,
  ScoreRecord,
  WalletState,
  UserSettings,
  AchievementProgress,
  DailyChallengeResult,
  SkinId,
  AdState,
  StorageSchema,
} from "../types";

const KEYS = {
  STATS: "@tsumineko/stats" as const,
  SCORES: "@tsumineko/scores" as const,
  WALLET: "@tsumineko/wallet" as const,
  SETTINGS: "@tsumineko/settings" as const,
  ACHIEVEMENTS: "@tsumineko/achievements" as const,
  DAILY_RESULTS: "@tsumineko/daily_results" as const,
  UNLOCKED_SKINS: "@tsumineko/unlocked_skins" as const,
  AD_STATE: "@tsumineko/ad_state" as const,
};

const DEFAULTS: StorageSchema = {
  "@tsumineko/stats": {
    totalGames: 0,
    totalCatsStacked: 0,
    totalHeight: 0,
    bestScore: 0,
    bestHeight: 0,
    bestCombo: 0,
    bestCatCount: 0,
    currentStreak: 0,
    maxStreak: 0,
    lastPlayDate: "",
    firstPlayDate: "",
  },
  "@tsumineko/scores": [],
  "@tsumineko/wallet": {
    coins: 0,
    adsRemoved: false,
    purchasedSkins: [],
  },
  "@tsumineko/settings": {
    bgmVolume: 0.8,
    seVolume: 1.0,
    hapticsEnabled: true,
    showGuide: true,
    selectedSkinId: "mike",
  },
  "@tsumineko/achievements": {
    unlockedIds: [],
    shapesUsed: [],
    fastStackCount: 0,
  },
  "@tsumineko/daily_results": {},
  "@tsumineko/unlocked_skins": ["mike", "kuro", "shiro", "tora", "hachiware"],
  "@tsumineko/ad_state": {
    gamesUntilInterstitial: 3,
    rewardAvailable: true,
    lastRewardTime: 0,
  },
};

export async function loadData<K extends keyof StorageSchema>(
  key: K
): Promise<StorageSchema[K]> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (raw === null) return DEFAULTS[key];
    return JSON.parse(raw) as StorageSchema[K];
  } catch {
    return DEFAULTS[key];
  }
}

export async function saveData<K extends keyof StorageSchema>(
  key: K,
  value: StorageSchema[K]
): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

export async function addScoreRecord(record: ScoreRecord): Promise<void> {
  const scores = await loadData("@tsumineko/scores");
  scores.push(record);
  scores.sort((a, b) => b.score - a.score);
  const trimmed = scores.slice(0, 50);
  await saveData("@tsumineko/scores", trimmed);
}

export async function updateStats(
  gameResult: {
    score: number;
    height: number;
    catCount: number;
    maxCombo: number;
  }
): Promise<{ isNewRecord: boolean }> {
  const stats = await loadData("@tsumineko/stats");
  const today = new Date().toISOString().split("T")[0];

  const isNewRecord = gameResult.score > stats.bestScore;

  stats.totalGames++;
  stats.totalCatsStacked += gameResult.catCount;
  stats.totalHeight += gameResult.height;
  stats.bestScore = Math.max(stats.bestScore, gameResult.score);
  stats.bestHeight = Math.max(stats.bestHeight, gameResult.height);
  stats.bestCombo = Math.max(stats.bestCombo, gameResult.maxCombo);
  stats.bestCatCount = Math.max(stats.bestCatCount, gameResult.catCount);

  if (stats.lastPlayDate === "") {
    stats.firstPlayDate = today;
    stats.currentStreak = 1;
  } else {
    const lastDate = new Date(stats.lastPlayDate);
    const todayDate = new Date(today);
    const diffDays = Math.floor(
      (todayDate.getTime() - lastDate.getTime()) / 86400000
    );

    if (diffDays === 1) {
      stats.currentStreak++;
    } else if (diffDays > 1) {
      stats.currentStreak = 1;
    }
  }
  stats.maxStreak = Math.max(stats.maxStreak, stats.currentStreak);
  stats.lastPlayDate = today;

  await saveData("@tsumineko/stats", stats);
  return { isNewRecord };
}

export async function resetAllData(): Promise<void> {
  const keys = Object.values(KEYS);
  for (const key of keys) {
    await AsyncStorage.removeItem(key);
  }
}

export function getDefaultSettings(): UserSettings {
  return { ...DEFAULTS["@tsumineko/settings"] };
}

export function getDefaultStats(): PlayerStats {
  return { ...DEFAULTS["@tsumineko/stats"] };
}

export function getDefaultWallet(): WalletState {
  return { ...DEFAULTS["@tsumineko/wallet"] };
}

export function getDefaultAchievements(): AchievementProgress {
  return { ...DEFAULTS["@tsumineko/achievements"], unlockedIds: [], shapesUsed: [] };
}
