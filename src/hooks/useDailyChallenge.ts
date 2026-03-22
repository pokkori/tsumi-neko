import { useMemo } from "react";
import { getDailyChallenge } from "../data/dailyChallenges";
import { DailyChallenge, DailyChallengeResult } from "../types";
import { useGameStore } from "../stores/gameStore";

export function useDailyChallenge() {
  const dailyResults = useGameStore((s) => s.dailyResults);
  const saveDailyResult = useGameStore((s) => s.saveDailyResult);

  const today = new Date().toISOString().split("T")[0];

  const challenge = useMemo(() => {
    return getDailyChallenge(today);
  }, [today]);

  const todayResult = dailyResults[today] ?? null;
  const isCompleted = todayResult?.completed ?? false;

  const recordAttempt = async (score: number) => {
    const existing = dailyResults[today];
    const wasAlreadyCompleted = existing?.completed ?? false;
    const isNowCompleted = score >= challenge.targetScore;
    const result: DailyChallengeResult = {
      id: today,
      completed: isNowCompleted || wasAlreadyCompleted,
      bestScore: Math.max(score, existing?.bestScore ?? 0),
      attempts: (existing?.attempts ?? 0) + 1,
    };
    await saveDailyResult(result);
    // 初回クリア時のみコイン100枚付与
    if (isNowCompleted && !wasAlreadyCompleted) {
      await useGameStore.getState().addCoins(100);
    }
    return result;
  };

  return {
    challenge,
    todayResult,
    isCompleted,
    recordAttempt,
  };
}
