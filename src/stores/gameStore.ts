import { create } from "zustand";
import {
  GameState,
  PlayerStats,
  WalletState,
  UserSettings,
  AchievementProgress,
  SkinId,
  AchievementId,
  DailyChallengeResult,
} from "../types";
import {
  loadData,
  saveData,
  getDefaultSettings,
  getDefaultStats,
  getDefaultWallet,
  getDefaultAchievements,
} from "../utils/storage";

interface GameStore {
  // Persisted state
  stats: PlayerStats;
  wallet: WalletState;
  settings: UserSettings;
  achievements: AchievementProgress;
  unlockedSkins: SkinId[];
  dailyResults: Record<string, DailyChallengeResult>;

  // Runtime
  initialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  updateSettings: (partial: Partial<UserSettings>) => Promise<void>;
  addCoins: (amount: number) => Promise<void>;
  spendCoins: (amount: number) => Promise<boolean>;
  unlockSkin: (skinId: SkinId) => Promise<void>;
  unlockAchievement: (id: AchievementId, rewardCoins: number) => Promise<void>;
  addShapeUsed: (shapeId: string) => Promise<void>;
  saveDailyResult: (result: DailyChallengeResult) => Promise<void>;
  saveStats: (stats: PlayerStats) => Promise<void>;
}

export const useGameStore = create<GameStore>((set, get) => ({
  stats: getDefaultStats(),
  wallet: getDefaultWallet(),
  settings: getDefaultSettings(),
  achievements: getDefaultAchievements(),
  unlockedSkins: ["mike", "kuro", "shiro", "tora", "hachiware"],
  dailyResults: {},
  initialized: false,

  initialize: async () => {
    const [stats, wallet, settings, achievements, unlockedSkins, dailyResults] =
      await Promise.all([
        loadData("@tsumineko/stats"),
        loadData("@tsumineko/wallet"),
        loadData("@tsumineko/settings"),
        loadData("@tsumineko/achievements"),
        loadData("@tsumineko/unlocked_skins"),
        loadData("@tsumineko/daily_results"),
      ]);

    set({
      stats,
      wallet,
      settings,
      achievements,
      unlockedSkins,
      dailyResults,
      initialized: true,
    });
  },

  updateSettings: async (partial) => {
    const current = get().settings;
    const updated = { ...current, ...partial };
    set({ settings: updated });
    await saveData("@tsumineko/settings", updated);
  },

  addCoins: async (amount) => {
    const wallet = { ...get().wallet };
    wallet.coins += amount;
    set({ wallet });
    await saveData("@tsumineko/wallet", wallet);
  },

  spendCoins: async (amount) => {
    const wallet = { ...get().wallet };
    if (wallet.coins < amount) return false;
    wallet.coins -= amount;
    set({ wallet });
    await saveData("@tsumineko/wallet", wallet);
    return true;
  },

  unlockSkin: async (skinId) => {
    const skins = [...get().unlockedSkins];
    if (!skins.includes(skinId)) {
      skins.push(skinId);
      set({ unlockedSkins: skins });
      await saveData("@tsumineko/unlocked_skins", skins);
    }
  },

  unlockAchievement: async (id, rewardCoins) => {
    const achievements = { ...get().achievements };
    if (!achievements.unlockedIds.includes(id)) {
      achievements.unlockedIds = [...achievements.unlockedIds, id];
      set({ achievements });
      await saveData("@tsumineko/achievements", achievements);
      await get().addCoins(rewardCoins);
    }
  },

  addShapeUsed: async (shapeId) => {
    const achievements = { ...get().achievements };
    if (!achievements.shapesUsed.includes(shapeId as any)) {
      achievements.shapesUsed = [...achievements.shapesUsed, shapeId as any];
      set({ achievements });
      await saveData("@tsumineko/achievements", achievements);
    }
  },

  saveDailyResult: async (result) => {
    const dailyResults = { ...get().dailyResults, [result.id]: result };
    set({ dailyResults });
    await saveData("@tsumineko/daily_results", dailyResults);
  },

  saveStats: async (stats) => {
    set({ stats });
    await saveData("@tsumineko/stats", stats);
  },
}));
