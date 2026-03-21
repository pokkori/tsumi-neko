import {
  AchievementId,
  AchievementProgress,
  GameState,
  PlayerStats,
} from "../types";

export function checkAchievements(
  gameState: GameState,
  stats: PlayerStats,
  progress: AchievementProgress,
  gameStartTime: number
): AchievementId[] {
  const newlyUnlocked: AchievementId[] = [];

  const check = (id: AchievementId, condition: boolean) => {
    if (!progress.unlockedIds.includes(id) && condition) {
      newlyUnlocked.push(id);
    }
  };

  // Stack
  check("first_stack", gameState.catCount >= 1);
  check("stack_10", gameState.catCount >= 10);
  check("stack_50", gameState.catCount >= 50);
  check("stack_100", gameState.catCount >= 100);

  // Height
  check("height_1m", gameState.height >= 1.0);
  check("height_5m", gameState.height >= 5.0);
  check("height_10m", gameState.height >= 10.0);

  // Combo
  check("combo_5", gameState.maxCombo >= 5);
  check("combo_10", gameState.maxCombo >= 10);
  check("combo_20", gameState.maxCombo >= 20);

  // Score
  check("score_1000", gameState.score >= 1000);
  check("score_5000", gameState.score >= 5000);
  check("score_10000", gameState.score >= 10000);

  // Play count
  check("games_10", stats.totalGames >= 10);
  check("games_100", stats.totalGames >= 100);

  // Streak
  check("daily_7", stats.currentStreak >= 7);
  check("daily_30", stats.currentStreak >= 30);

  // Collection
  check("all_shapes", progress.shapesUsed.length >= 10);

  // Hidden
  check(
    "perfect_balance",
    gameState.catCount >= 20 && gameState.fallenCats.length === 0
  );

  const elapsedSec = (Date.now() - gameStartTime) / 1000;
  check("speed_demon", gameState.catCount >= 5 && elapsedSec <= 10);

  const hour = new Date().getHours();
  check("night_owl", hour >= 2 && hour < 4);

  return newlyUnlocked;
}

export function checkLuckySave(
  heightDrop: number,
  threshold: number
): boolean {
  return heightDrop >= threshold * 0.9 && heightDrop < threshold;
}
