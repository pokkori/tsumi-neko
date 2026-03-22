import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  SafeAreaView,
  PanResponder,
  Alert,
  Animated,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useGameState } from "../src/hooks/useGameState";
import { useGameStore } from "../src/stores/gameStore";
import { useDailyChallenge } from "../src/hooks/useDailyChallenge";
import { ChallengeConfig } from "../src/engine/GameLoop";
import { resumeAudioContext, playBGM, stopBGM, loadBGMAsync } from "../src/utils/sound";
import { CatBody } from "../src/components/CatBody";
import { ScoreDisplay } from "../src/components/ScoreDisplay";
import { ComboPopup } from "../src/components/ComboPopup";
import { CatPreview } from "../src/components/CatPreview";
import { GuideArrow } from "../src/components/GuideArrow";
import { Background } from "../src/components/Background";
import { MergeEffect } from "../src/components/MergeEffect";
import { ScreenShake } from "../src/components/ScreenShake";
import { LandingBounce } from "../src/components/LandingBounce";
import { TutorialOverlay } from "../src/components/TutorialOverlay";
import { ChunkyBornOverlay } from "../src/components/ChunkyBornOverlay";
import { shareResult } from "../src/utils/share";
import { PHYSICS } from "../src/constants/physics";
import { COLORS } from "../src/constants/colors";
import { NEAR_CHUNKY_GAP } from "../src/constants/game";
import { CAT_SHAPES } from "../src/data/catShapes";
import AsyncStorage from "@react-native-async-storage/async-storage";

const TUTORIAL_KEY = "@tsumineko/tutorial_seen";

const EVOLUTION_ORDER = ["tiny","round","long","flat","loaf","triangle","curled","fat","stretchy","chunky"];
const CHUNKY_INDEX = EVOLUTION_ORDER.length - 1; // 9

const calcChunkyRank = (mergeCount: number, score: number): { rank: "S" | "A" | "B" | "C"; label: string; color: string } => {
  if (mergeCount >= 3 && score >= 5000) return { rank: "S", label: "速攻3合体・高スコアの鬼！", color: "#FFD700" };
  if (mergeCount >= 2 && score >= 2000) return { rank: "A", label: "手際よく合体達成！", color: "#C0C0C0" };
  if (mergeCount >= 1 && score >= 500) return { rank: "B", label: "ずんぐり誕生！", color: "#CD7F32" };
  return { rank: "C", label: "まずは合体マスターへ！", color: "#888888" };
};

export default function GameScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ daily?: string }>();
  const isDaily = params.daily === "true";

  const settings = useGameStore((s) => s.settings);
  const walletCoins = useGameStore((s) => s.wallet?.coins ?? 0);
  const bestScore = useGameStore((s) => s.stats?.bestScore ?? 0);
  const { challenge, recordAttempt } = useDailyChallenge();

  // Build challenge config for daily mode
  const challengeConfig = useMemo<ChallengeConfig | undefined>(() => {
    if (!isDaily) return undefined;
    return {
      rule: challenge.rule,
      challengeId: challenge.id,
    };
  }, [isDaily, challenge.rule, challenge.id]);

  const { gameState, isRunning, startGame, onDrop, setDropPosition, continueFromReward } =
    useGameState(settings.selectedSkinId, undefined, challengeConfig);

  const [paused, setPaused] = useState(false);
  const [started, setStarted] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showChunkyBorn, setShowChunkyBorn] = useState(false);
  const [nearmissVisible, setNearmissVisible] = useState(false);
  const [nearmissText, setNearmissText] = useState('');
  const [showChunkyShare, setShowChunkyShare] = useState(false);
  const [chunkyRank, setChunkyRank] = useState<{ rank: "S" | "A" | "B" | "C"; label: string; color: string } | null>(null);
  const [showContinueModal, setShowContinueModal] = useState(false);
  const [continueUsed, setContinueUsed] = useState(false);
  const [personalityToast, setPersonalityToast] = useState<string | null>(null);
  const pendingResultParams = useRef<Record<string, string> | null>(null);
  const chunkyCountdownPulse = useRef(new Animated.Value(1)).current;
  const lastRemainingRef = useRef<number>(0);

  // PanResponder for drag control
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        if (paused) return;
        resumeAudioContext();
        const x = evt.nativeEvent.locationX;
        setDropPosition(x);
      },
      onPanResponderMove: (evt) => {
        if (paused) return;
        const x = evt.nativeEvent.locationX;
        setDropPosition(x);
      },
      onPanResponderRelease: () => {
        if (paused) return;
        onDrop();
      },
    })
  ).current;

  // Check if tutorial should be shown
  useEffect(() => {
    (async () => {
      try {
        const seen = await AsyncStorage.getItem(TUTORIAL_KEY);
        if (!seen) {
          setShowTutorial(true);
        } else {
          startGame();
          setStarted(true);
        }
      } catch {
        startGame();
        setStarted(true);
      }
    })();
  }, []);

  const handleTutorialComplete = useCallback(async () => {
    setShowTutorial(false);
    try {
      await AsyncStorage.setItem(TUTORIAL_KEY, "true");
    } catch {}
    startGame();
    setContinueUsed(false);
    setStarted(true);
  }, [startGame]);

  // BGM control
  useEffect(() => {
    loadBGMAsync();
  }, []);

  useEffect(() => {
    if (started && !showTutorial) {
      playBGM();
    }
    return () => {
      stopBGM();
    };
  }, [started, showTutorial]);

  // フィーバーBGM切り替え: コンボ5以上でフィーバーモード
  useEffect(() => {
    if (!started || gameState?.phase !== 'playing') return;
    const isFever = (gameState?.combo ?? 0) >= 5;
    playBGM(isFever ? 'fever' : 'normal');
  }, [started, gameState?.combo, gameState?.phase]);

  const navigateToResult = useCallback(() => {
    if (pendingResultParams.current) {
      router.replace({
        pathname: "/result",
        params: pendingResultParams.current,
      });
    }
  }, [router]);

  useEffect(() => {
    if (gameState?.phase === "gameover" && started) {
      stopBGM();
      const finalState = gameState;
      if (isDaily) {
        recordAttempt(finalState.score);
      }
      const coinsEarned = Math.floor(finalState.score / 100) + (finalState.mergeCount ?? 0) * 2;
      useGameStore.getState().addCoins(coinsEarned);
      const dailyClearFlag = isDaily && finalState.score >= challenge.targetScore;
      pendingResultParams.current = {
        score: String(finalState.score),
        height: String(finalState.height),
        catCount: String(finalState.catCount),
        maxCombo: String(finalState.maxCombo),
        isNewRecord: String(finalState.isNewRecord),
        isDaily: String(isDaily),
        mergeCount: String(finalState.mergeCount),
        shapesUsed: finalState.shapesUsedInGame.join(","),
        coinsEarned: String(coinsEarned),
        dailyClear: String(dailyClearFlag),
      };
      const timeout = setTimeout(() => {
        setShowContinueModal(true);
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [gameState?.phase]);

  const lastChunkyTimestamp = useRef(0);
  useEffect(() => {
    const ev = gameState?.lastMergeEvent;
    if (!ev) return;
    if (ev.toShapeId === "chunky" && ev.timestamp !== lastChunkyTimestamp.current) {
      lastChunkyTimestamp.current = ev.timestamp;
      setShowChunkyBorn(true);
    }
  }, [gameState?.lastMergeEvent?.timestamp]);

  // Nearmiss: score approaching chunky threshold
  const CHUNKY_SCORE_THRESHOLD = 3000;
  const nearmissShownRef = useRef(false);
  useEffect(() => {
    const score = gameState?.score ?? 0;
    const alreadyChunky = gameState?.lastMergeEvent?.toShapeId === 'chunky';
    if (!alreadyChunky && !nearmissShownRef.current && score > 0) {
      const gap = CHUNKY_SCORE_THRESHOLD - score;
      if (gap > 0 && gap <= NEAR_CHUNKY_GAP) {
        nearmissShownRef.current = true;
        setNearmissText(`あと${gap}点でずんぐり！`);
        setNearmissVisible(true);
        const t = setTimeout(() => setNearmissVisible(false), 2000);
        return () => clearTimeout(t);
      }
    }
    if (alreadyChunky) {
      nearmissShownRef.current = false;
    }
  }, [gameState?.score]);

  const lastPersonalityTimestamp = useRef(0);
  useEffect(() => {
    const ev = gameState?.lastMergeEvent;
    if (!ev?.toShapeId) return;
    if (ev.timestamp === lastPersonalityTimestamp.current) return;
    lastPersonalityTimestamp.current = ev.timestamp;
    const shape = CAT_SHAPES.find((s) => s.id === ev.toShapeId);
    if (shape?.personality) {
      setPersonalityToast(shape.personality);
      const timer = setTimeout(() => setPersonalityToast(null), 800);
      return () => clearTimeout(timer);
    }
  }, [gameState?.lastMergeEvent?.timestamp]);

  if (!gameState && !showTutorial) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <>
      <TutorialOverlay
        visible={showTutorial}
        onComplete={handleTutorialComplete}
      />

      <View style={styles.container} {...panResponder.panHandlers}>
        {gameState && (
          <ScreenShake mergeEvent={gameState.lastMergeEvent} style={styles.shakeContainer}>
            <Background heightPx={gameState.heightPx} />

            {/* Daily Challenge Banner */}
            {isDaily && (
              <View style={styles.dailyBanner}>
                <Text style={styles.dailyBannerText}>
                  {challenge.ruleName}: {challenge.ruleDescription}
                </Text>
              </View>
            )}

            {/* HUD */}
            <ScoreDisplay
              score={gameState.score}
              height={gameState.height}
              catCount={gameState.catCount}
              combo={gameState.combo}
              bestScore={bestScore}
            />

            {/* Merge count indicator */}
            {gameState.mergeCount > 0 && (
              <View style={styles.mergeCounter}>
                <Text style={styles.mergeCounterText}>
                  Merge x{gameState.mergeCount}
                </Text>
              </View>
            )}

            {/* Coin Mini Display */}
            <View style={{ position: 'absolute', top: 72, left: 16, backgroundColor: 'rgba(0,0,0,0.25)', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3, zIndex: 10 }}>
              <Text style={{ color: '#FFD700', fontSize: 11, fontWeight: 'bold' }}>C {walletCoins}</Text>
            </View>

            {/* Next Preview */}
            <CatPreview shapeId={gameState.nextShapeId} />

            {/* Guide Arrow */}
            {gameState.currentCat && gameState.phase === "idle" && settings.showGuide && (
              <GuideArrow
                x={gameState.currentCat.position.x}
                topY={gameState.currentCat.position.y + gameState.cameraY + 30}
                bottomY={PHYSICS.GROUND_Y + gameState.cameraY}
                visible={true}
              />
            )}

            {/* Current Cat */}
            {gameState.currentCat && (
              <CatBody cat={gameState.currentCat} cameraY={gameState.cameraY} />
            )}

            {/* Stacked Cats */}
            {gameState.stackedCats.map((cat) => (
              <CatBody key={cat.bodyId} cat={cat} cameraY={gameState.cameraY} />
            ))}

            {/* Ground Line */}
            <View
              style={[
                styles.ground,
                { top: PHYSICS.GROUND_Y + gameState.cameraY },
              ]}
            />

            {/* Evolution Countdown */}
            {(() => {
              const maxCurrentStage = (gameState.stackedCats ?? []).reduce((max: number, cat: any) => {
                const idx = EVOLUTION_ORDER.indexOf(cat.shapeId ?? "");
                return idx > max ? idx : max;
              }, -1);
              const remainingMerges = maxCurrentStage >= 0 ? CHUNKY_INDEX - maxCurrentStage : CHUNKY_INDEX;
              if (remainingMerges !== lastRemainingRef.current && remainingMerges === 1) {
                chunkyCountdownPulse.setValue(1);
                Animated.loop(
                  Animated.sequence([
                    Animated.timing(chunkyCountdownPulse, { toValue: 1.08, duration: 400, useNativeDriver: true }),
                    Animated.timing(chunkyCountdownPulse, { toValue: 1.0, duration: 400, useNativeDriver: true }),
                  ])
                ).start();
              }
              lastRemainingRef.current = remainingMerges;
              const isLast = remainingMerges === 1;
              return remainingMerges <= 3 && remainingMerges > 0 ? (
                <Animated.View style={{
                  position: "absolute",
                  bottom: 90,
                  alignSelf: "center",
                  backgroundColor: isLast ? "rgba(255,215,0,1.0)" : "rgba(255,215,0,0.9)",
                  paddingHorizontal: isLast ? 22 : 16,
                  paddingVertical: isLast ? 10 : 6,
                  borderRadius: 24,
                  zIndex: 15,
                  transform: [{ scale: isLast ? chunkyCountdownPulse : 1 }],
                  borderWidth: isLast ? 2 : 0,
                  borderColor: "#FF6B35",
                }}>
                  <Text style={{ fontSize: isLast ? 18 : 14, fontWeight: "bold", color: "#333" }}>
                    {isLast ? "★ あと1回！ずんぐりネコ誕生直前！" : `★ あと${remainingMerges}回で ずんぐりネコ！`}
                  </Text>
                </Animated.View>
              ) : null;
            })()}

            {/* Personality Toast */}
            {personalityToast && (
              <View style={{ position: 'absolute', top: 130, alignSelf: 'center', backgroundColor: 'rgba(0,0,0,0.7)', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, zIndex: 20 }}>
                <Text style={{ color: '#fff', fontSize: 13 }}>{personalityToast}</Text>
              </View>
            )}

            {/* Nearmiss Banner */}
            {nearmissVisible && (
              <View style={{ position: 'absolute', top: 80, alignSelf: 'center', backgroundColor: 'rgba(255,107,53,0.9)', borderRadius: 16, paddingHorizontal: 20, paddingVertical: 10, zIndex: 100 }}>
                <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 18 }}>{nearmissText}</Text>
              </View>
            )}

            {/* Combo Popup */}
            <ComboPopup combo={gameState.combo} />

            {/* Merge Effect */}
            <MergeEffect
              mergeEvent={gameState.lastMergeEvent}
              cameraY={gameState.cameraY}
            />

            {/* Landing Bounce Ripples */}
            <LandingBounce
              landingEvents={gameState.landingEvents}
              cameraY={gameState.cameraY}
            />

            {/* Collapsing overlay */}
            {gameState.phase === "collapsing" && (
              <View style={styles.collapseOverlay}>
                <Text style={styles.collapseText}>{"CRASH!"}</Text>
              </View>
            )}
          </ScreenShake>
        )}

        {/* Pause Button */}
        <TouchableOpacity
          style={[styles.pauseButton, { minHeight: 44, minWidth: 44 }]}
          accessibilityLabel="設定を開く"
          accessibilityRole="button"
          onPress={() => setPaused(true)}
        >
          <Text style={styles.pauseButtonText}>||</Text>
        </TouchableOpacity>

        {/* Pause Modal */}
        <Modal
          visible={paused}
          transparent={true}
          animationType="fade"
        >
          <View style={styles.pauseOverlay}>
            <View style={styles.pauseMenu}>
              <Text style={styles.pauseTitle}>PAUSE</Text>
              <TouchableOpacity
                style={styles.pauseMenuButton}
                onPress={() => setPaused(false)}
              >
                <Text style={styles.pauseMenuButtonText}>つづける</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.pauseMenuButton, styles.pauseMenuButtonSecondary]}
                onPress={() => {
                  setPaused(false);
                  router.replace("/");
                }}
              >
                <Text style={styles.pauseMenuButtonText}>タイトルへ</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Chunky Born Fullscreen Overlay */}
        <ChunkyBornOverlay
          visible={showChunkyBorn}
          onComplete={() => {
            setShowChunkyBorn(false);
            setChunkyRank(calcChunkyRank(gameState?.mergeCount ?? 0, gameState?.score ?? 0));
            setShowChunkyShare(true);
          }}
          mergeCount={gameState?.mergeCount ?? 0}
          score={gameState?.score ?? 0}
        />

        {/* Continue Modal */}
        <Modal visible={showContinueModal} transparent animationType="fade">
          <View style={styles.pauseOverlay}>
            <View style={styles.pauseMenu}>
              <Text style={{ fontSize: 28, textAlign: "center", marginBottom: 4 }}></Text>
              <Text style={styles.pauseTitle}>ゲームオーバー</Text>
              <Text style={{ fontSize: 15, color: "#666", textAlign: "center", marginBottom: 8 }}>
                {(gameState?.score ?? 0) >= 1000 ? "いい感じ！もう一踏ん張り！" : "コツをつかんで再挑戦！"}
              </Text>
              {bestScore > 0 && (gameState?.score ?? 0) < bestScore && (
                <Text style={{ fontSize: 12, color: '#888', textAlign: 'center', marginBottom: 4 }}>
                  ベストまで あと {(bestScore - (gameState?.score ?? 0)).toLocaleString()} 点
                </Text>
              )}
              {(gameState?.score ?? 0) >= bestScore && bestScore > 0 && (
                <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#FFD700', textAlign: 'center', marginBottom: 4 }}>
                  BEST NEW RECORD!
                </Text>
              )}
              {!continueUsed ? (
                <>
                  <TouchableOpacity
                    style={[styles.pauseMenuButton, { backgroundColor: walletCoins >= 100 ? "#FF6B35" : "#aaa" }]}
                    onPress={async () => {
                      const state = useGameStore.getState();
                      const CONTINUE_COST = 100;
                      const coins = state.wallet?.coins ?? 0;
                      if (coins >= CONTINUE_COST) {
                        await state.spendCoins(CONTINUE_COST);
                        setContinueUsed(true);
                        setShowContinueModal(false);
                        continueFromReward();
                      } else {
                        Alert.alert("コイン不足", `コンティニューにはCOIN ${CONTINUE_COST}枚必要です\n（現在: ${coins}枚）\n\nプレイを重ねてコインを貯めよう！`);
                      }
                    }}
                  >
                    <Text style={styles.pauseMenuButtonText}>COIN 100枚で続ける</Text>
                  </TouchableOpacity>
                  <Text style={{ fontSize: 11, color: "#999", marginTop: 4, textAlign: "center" }}>
                    {walletCoins >= 100
                      ? `現在 COIN:${walletCoins}枚 → 残り${walletCoins - 100}枚`
                      : `現在 COIN:${walletCoins}枚（あと${100 - walletCoins}枚でコンティニュー可！）`}
                  </Text>
                </>
              ) : (
                <View style={[styles.pauseMenuButton, { backgroundColor: "#ccc" }]}>
                  <Text style={styles.pauseMenuButtonText}>使用済み</Text>
                </View>
              )}
              <TouchableOpacity
                style={{ marginTop: 12, backgroundColor: '#f59e0b', borderRadius: 12, paddingVertical: 14, paddingHorizontal: 32, minHeight: 44 }}
                onPress={() => {
                  nearmissShownRef.current = false;
                  setShowContinueModal(false);
                  startGame();
                }}
              >
                <Text style={{ color: '#0f0c29', fontWeight: 'bold', textAlign: 'center', fontSize: 18 }}>
                  もう一回！
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{ marginTop: 12 }}
                onPress={() => {
                  setShowContinueModal(false);
                  navigateToResult();
                }}
              >
                <Text style={{ color: "#666", textAlign: "center", fontSize: 14 }}>
                  結果を見る →
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Chunky Share Modal */}
        <Modal visible={showChunkyShare} transparent animationType="fade">
          <View style={styles.pauseOverlay}>
            <View style={styles.pauseMenu}>
              <Text style={{ fontSize: 28, textAlign: "center", marginBottom: 8 }}>★</Text>
              <Text style={[styles.pauseTitle, { fontSize: 18 }]}>ずんぐりネコ誕生！</Text>
              {chunkyRank && (
                <View style={{ backgroundColor: chunkyRank.color + '33', borderWidth: 2, borderColor: chunkyRank.color, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 8, marginBottom: 8 }}>
                  <Text style={{ fontSize: 28, fontWeight: 'bold', color: chunkyRank.color, textAlign: 'center' }}>ランク {chunkyRank.rank}</Text>
                  <Text style={{ fontSize: 12, color: '#444', textAlign: 'center', marginTop: 2 }}>{chunkyRank.label}</Text>
                </View>
              )}
              <Text style={{ fontSize: 14, color: '#888', marginBottom: 4 }}>
                スコア: {(gameState?.score ?? 0).toLocaleString()}
              </Text>
              <Text style={{ fontSize: 14, color: '#888', marginBottom: 12 }}>
                合体 {gameState?.mergeCount ?? 0}回達成
              </Text>
              <TouchableOpacity
                style={styles.pauseMenuButton}
                onPress={() => setShowChunkyShare(false)}
              >
                <Text style={styles.pauseMenuButtonText}>つづける</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={async () => {
                  setShowChunkyShare(false);
                  const score = gameState?.score ?? 0;
                  const height = gameState?.height ?? 0;
                  const catCount = gameState?.catCount ?? 0;
                  const mergeCount = gameState?.mergeCount ?? 0;
                  await shareResult({
                    score,
                    height,
                    catCount,
                    isNewRecord: false,
                    mergeCount,
                    shapesUsed: gameState?.shapesUsedInGame ?? [],
                    maxCombo: gameState?.maxCombo ?? 0,
                    maxEvolution: "chunky",
                  });
                }}
                style={{ marginTop: 12 }}
              >
                <Text style={{ color: '#666', fontSize: 14, textAlign: 'center' }}>シェアする</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#87CEEB",
  },
  shakeContainer: {
    flex: 1,
  },
  loadingText: {
    fontSize: 24,
    color: "#FFFFFF",
    textAlign: "center",
    marginTop: 100,
  },
  dailyBanner: {
    position: "absolute",
    top: 90,
    left: 16,
    right: 16,
    backgroundColor: "rgba(79,195,247,0.9)",
    borderRadius: 8,
    padding: 8,
    zIndex: 10,
  },
  dailyBannerText: {
    color: "#FFFFFF",
    fontSize: 12,
    textAlign: "center",
    fontWeight: "bold",
  },
  mergeCounter: {
    position: "absolute",
    top: 72,
    right: 16,
    backgroundColor: "rgba(255,215,0,0.9)",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    zIndex: 10,
  },
  mergeCounterText: {
    color: "#333",
    fontSize: 12,
    fontWeight: "bold",
  },
  ground: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 80,
    backgroundColor: COLORS.ground,
    borderTopWidth: 3,
    borderTopColor: COLORS.groundDark,
    zIndex: 1,
  },
  collapseOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 30,
  },
  collapseText: {
    fontSize: 48,
    fontWeight: "bold",
    color: "#FF4444",
    textShadowColor: "rgba(0,0,0,0.8)",
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  pauseButton: {
    position: "absolute",
    top: 64,
    right: 16,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  pauseButtonText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  pauseOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  pauseMenu: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 30,
    alignItems: "center",
    width: 280,
  },
  pauseTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.text,
    marginBottom: 20,
  },
  pauseMenuButton: {
    backgroundColor: COLORS.secondary,
    paddingHorizontal: 40,
    paddingVertical: 14,
    borderRadius: 25,
    marginTop: 12,
    width: "100%",
    alignItems: "center",
  },
  pauseMenuButtonSecondary: {
    backgroundColor: COLORS.textLight,
  },
  pauseMenuButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
  },
});
