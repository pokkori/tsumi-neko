import { useRef, useCallback, useState, useEffect } from "react";
import { GameLoop, ChallengeConfig } from "../engine/GameLoop";
import { GameState, SkinId, CatShapeId, AchievementId } from "../types";
import { updateStats, addScoreRecord } from "../utils/storage";
import { useGameStore } from "../stores/gameStore";
import { ACHIEVEMENTS } from "../data/achievements";
import { checkAchievements } from "./useAchievements";
import {
  hapticsLight,
  hapticsSuccess,
  hapticsError,
  hapticsMerge,
  hapticsMergeLarge,
  hapticsCollapse,
  hapticsCombo,
} from "../utils/haptics";
import {
  playDropSound,
  playMergeSound,
  playLandSound,
  playComboSound,
  playCollapseSound,
  playGameOverSound,
  resumeAudioContext,
} from "../utils/sound";

export function useGameState(skinId: SkinId = "mike", forceShapeId?: CatShapeId, challengeConfig?: ChallengeConfig) {
  const gameLoopRef = useRef<GameLoop | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const gameStartTimeRef = useRef<number>(Date.now());
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const store = useGameStore();

  const startGame = useCallback(() => {
    if (gameLoopRef.current) {
      gameLoopRef.current.destroy();
    }
    const loop = new GameLoop(skinId, forceShapeId, challengeConfig);

    // Resume audio context on game start (requires user gesture)
    resumeAudioContext();

    // Set up haptic + sound callbacks
    loop.onCatDropped = () => {
      if (store.settings.hapticsEnabled) hapticsLight();
      playDropSound();
    };
    loop.onCatMerged = (evolutionIndex: number) => {
      if (store.settings.hapticsEnabled) {
        if (evolutionIndex >= 6) {
          hapticsMergeLarge();
        } else {
          hapticsMerge();
        }
      }
      playMergeSound(evolutionIndex);
    };
    loop.onCatLanded = () => {
      if (store.settings.hapticsEnabled) hapticsLight();
      playLandSound();
    };
    loop.onCollapsed = () => {
      if (store.settings.hapticsEnabled) hapticsCollapse();
      playCollapseSound();
    };
    loop.onCombo = (comboCount: number) => {
      if (store.settings.hapticsEnabled) hapticsCombo();
      playComboSound(comboCount);
    };

    gameLoopRef.current = loop;
    loop.start();
    gameStartTimeRef.current = Date.now();
    setGameState({ ...loop.state });
    setIsRunning(true);
  }, [skinId, forceShapeId, store.settings.hapticsEnabled, challengeConfig]);

  const onDrop = useCallback(() => {
    gameLoopRef.current?.onDrop();
  }, []);

  const setDropPosition = useCallback((x: number) => {
    gameLoopRef.current?.setDropPosition(x);
  }, []);

  useEffect(() => {
    if (!isRunning || !gameLoopRef.current) return;

    let running = true;
    const tick = () => {
      if (!running || !gameLoopRef.current) return;

      const state = gameLoopRef.current.update();
      setGameState(state);

      if (state.phase === "gameover") {
        setIsRunning(false);
        handleGameOver(state);
        return;
      }

      animFrameRef.current = requestAnimationFrame(tick);
    };

    animFrameRef.current = requestAnimationFrame(tick);

    return () => {
      running = false;
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [isRunning]);

  const handleGameOver = async (state: GameState) => {
    playGameOverSound();
    const result = await updateStats({
      score: state.score,
      height: state.height,
      catCount: state.catCount,
      maxCombo: state.maxCombo,
    });

    await addScoreRecord({
      score: state.score,
      height: state.height,
      catCount: state.catCount,
      maxCombo: state.maxCombo,
      date: new Date().toISOString(),
      skinId: state.activeSkinId,
      dailyChallengeId: state.dailyChallengeId,
    });

    // Check achievements
    const stats = store.stats;
    const updatedStats = {
      ...stats,
      totalGames: stats.totalGames + 1,
      totalCatsStacked: stats.totalCatsStacked + state.catCount,
    };
    const newAchievements = checkAchievements(
      state,
      updatedStats,
      store.achievements,
      gameStartTimeRef.current
    );

    for (const achievementId of newAchievements) {
      const achievement = ACHIEVEMENTS.find((a) => a.id === achievementId);
      if (achievement) {
        await store.unlockAchievement(achievementId, achievement.rewardCoins);
      }
    }

    // Track shapes used
    if (state.currentCat) {
      await store.addShapeUsed(state.currentCat.shapeId);
    }
    for (const cat of state.stackedCats) {
      await store.addShapeUsed(cat.shapeId);
    }

    // Earn coins
    const coinsEarned = state.catCount * 2
      + (state.maxCombo >= 10 ? 150 : state.maxCombo >= 5 ? 50 : 0)
      + (result.isNewRecord ? 100 : 0)
      + (state.mergeCount * 10); // Bonus coins for merges
    await store.addCoins(coinsEarned);

    if (gameLoopRef.current) {
      gameLoopRef.current.state.isNewRecord = result.isNewRecord;
      setGameState({ ...gameLoopRef.current.state });
    }

    await store.initialize(); // Refresh store
  };

  const continueFromReward = useCallback(() => {
    if (gameLoopRef.current) {
      gameLoopRef.current.continueFromReward();
      // フェーズを強制的にidleに戻す（gameover判定ループの防止）
      if (gameLoopRef.current.state) {
        gameLoopRef.current.state.phase = "idle";
        setGameState({ ...gameLoopRef.current.state });
      }
      setIsRunning(true);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      gameLoopRef.current?.destroy();
    };
  }, []);

  return {
    gameState,
    isRunning,
    startGame,
    onDrop,
    setDropPosition,
    continueFromReward,
  };
}
