import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  SafeAreaView,
  PanResponder,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useGameState } from "../src/hooks/useGameState";
import { useGameStore } from "../src/stores/gameStore";
import { useDailyChallenge } from "../src/hooks/useDailyChallenge";
import { ChallengeConfig } from "../src/engine/GameLoop";
import { resumeAudioContext, playBGM, stopBGM } from "../src/utils/sound";
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
import AsyncStorage from "@react-native-async-storage/async-storage";

const TUTORIAL_KEY = "@tsumineko/tutorial_seen";

const EVOLUTION_ORDER = ["tiny","round","long","flat","loaf","triangle","curled","fat","stretchy","chunky"];
const CHUNKY_INDEX = EVOLUTION_ORDER.length - 1; // 9

export default function GameScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ daily?: string }>();
  const isDaily = params.daily === "true";

  const settings = useGameStore((s) => s.settings);
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
  const [showChunkyShare, setShowChunkyShare] = useState(false);
  const [showContinueModal, setShowContinueModal] = useState(false);
  const pendingResultParams = useRef<Record<string, string> | null>(null);

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
    setStarted(true);
  }, [startGame]);

  // BGM control
  useEffect(() => {
    if (started && !showTutorial) {
      playBGM();
    }
    return () => {
      stopBGM();
    };
  }, [started, showTutorial]);

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
            />

            {/* Merge count indicator */}
            {gameState.mergeCount > 0 && (
              <View style={styles.mergeCounter}>
                <Text style={styles.mergeCounterText}>
                  Merge x{gameState.mergeCount}
                </Text>
              </View>
            )}

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
              return remainingMerges <= 3 && remainingMerges > 0 ? (
                <View style={{
                  position: "absolute",
                  bottom: 90,
                  alignSelf: "center",
                  backgroundColor: "rgba(255,215,0,0.9)",
                  paddingHorizontal: 16,
                  paddingVertical: 6,
                  borderRadius: 20,
                  zIndex: 15,
                }}>
                  <Text style={{ fontSize: 14, fontWeight: "bold", color: "#333" }}>
                    👑 あと{remainingMerges}回で ずんぐりネコ！
                  </Text>
                </View>
              ) : null;
            })()}

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
          style={styles.pauseButton}
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
            setShowChunkyShare(true);
          }}
        />

        {/* Continue Modal */}
        <Modal visible={showContinueModal} transparent animationType="fade">
          <View style={styles.pauseOverlay}>
            <View style={styles.pauseMenu}>
              <Text style={{ fontSize: 28, textAlign: "center", marginBottom: 4 }}>😿</Text>
              <Text style={styles.pauseTitle}>ゲームオーバー</Text>
              <Text style={{ fontSize: 15, color: "#666", textAlign: "center", marginBottom: 8 }}>
                コンティニューしますか？
              </Text>
              <TouchableOpacity
                style={[styles.pauseMenuButton, { backgroundColor: "#FF6B35" }]}
                onPress={() => {
                  setShowContinueModal(false);
                  continueFromReward();
                }}
              >
                <Text style={styles.pauseMenuButtonText}>🐱 続ける（広告）</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{ marginTop: 16 }}
                onPress={() => {
                  setShowContinueModal(false);
                  navigateToResult();
                }}
              >
                <Text style={{ color: "#666", textAlign: "center", fontSize: 16 }}>
                  結果を見る
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Chunky Share Modal */}
        <Modal visible={showChunkyShare} transparent animationType="fade">
          <View style={styles.pauseOverlay}>
            <View style={styles.pauseMenu}>
              <Text style={{ fontSize: 28, textAlign: "center", marginBottom: 8 }}>👑</Text>
              <Text style={[styles.pauseTitle, { fontSize: 18 }]}>ずんぐりネコ誕生！</Text>
              <TouchableOpacity
                style={styles.pauseMenuButton}
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
              >
                <Text style={styles.pauseMenuButtonText}>📢 シェアする</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.pauseMenuButton, styles.pauseMenuButtonSecondary]}
                onPress={() => setShowChunkyShare(false)}
              >
                <Text style={styles.pauseMenuButtonText}>つづける</Text>
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
    top: 52,
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
    top: 50,
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
