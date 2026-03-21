import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet,
  Modal,
  SafeAreaView,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useGameState } from "../src/hooks/useGameState";
import { useGameStore } from "../src/stores/gameStore";
import { useDailyChallenge } from "../src/hooks/useDailyChallenge";
import { CatBody } from "../src/components/CatBody";
import { ScoreDisplay } from "../src/components/ScoreDisplay";
import { ComboPopup } from "../src/components/ComboPopup";
import { CatPreview } from "../src/components/CatPreview";
import { GuideArrow } from "../src/components/GuideArrow";
import { Background } from "../src/components/Background";
import { PHYSICS } from "../src/constants/physics";
import { COLORS } from "../src/constants/colors";

export default function GameScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ daily?: string }>();
  const isDaily = params.daily === "true";

  const settings = useGameStore((s) => s.settings);
  const { challenge, recordAttempt } = useDailyChallenge();

  const { gameState, isRunning, startGame, onTap, continueFromReward } =
    useGameState(settings.selectedSkinId);

  const [paused, setPaused] = useState(false);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    startGame();
    setStarted(true);
  }, []);

  useEffect(() => {
    if (gameState?.phase === "gameover" && started) {
      // Navigate to result
      const finalState = gameState;
      if (isDaily) {
        recordAttempt(finalState.score);
      }
      const timeout = setTimeout(() => {
        router.replace({
          pathname: "/result",
          params: {
            score: String(finalState.score),
            height: String(finalState.height),
            catCount: String(finalState.catCount),
            maxCombo: String(finalState.maxCombo),
            isNewRecord: String(finalState.isNewRecord),
            isDaily: String(isDaily),
          },
        });
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [gameState?.phase]);

  const handleTap = () => {
    if (paused) return;
    onTap();
  };

  if (!gameState) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <TouchableWithoutFeedback onPress={handleTap}>
      <View style={styles.container}>
        <Background heightPx={gameState.heightPx} />

        {/* Daily Challenge Banner */}
        {isDaily && (
          <View style={styles.dailyBanner}>
            <Text style={styles.dailyBannerText}>
              📅 {challenge.ruleName}: {challenge.ruleDescription}
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

        {/* Combo Popup */}
        <ComboPopup combo={gameState.combo} />

        {/* Collapsing overlay */}
        {gameState.phase === "collapsing" && (
          <View style={styles.collapseOverlay}>
            <Text style={styles.collapseText}>💥</Text>
          </View>
        )}

        {/* Pause Button */}
        <TouchableOpacity
          style={styles.pauseButton}
          onPress={() => setPaused(true)}
        >
          <Text style={styles.pauseButtonText}>⏸</Text>
        </TouchableOpacity>

        {/* Pause Modal */}
        <Modal
          visible={paused}
          transparent={true}
          animationType="fade"
        >
          <View style={styles.pauseOverlay}>
            <View style={styles.pauseMenu}>
              <Text style={styles.pauseTitle}>⏸ ポーズ中</Text>
              <TouchableOpacity
                style={styles.pauseMenuButton}
                onPress={() => setPaused(false)}
              >
                <Text style={styles.pauseMenuButtonText}>▶ つづける</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.pauseMenuButton, styles.pauseMenuButtonSecondary]}
                onPress={() => {
                  setPaused(false);
                  router.replace("/");
                }}
              >
                <Text style={styles.pauseMenuButtonText}>🏠 タイトルへ</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#87CEEB",
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
    fontSize: 64,
  },
  pauseButton: {
    position: "absolute",
    bottom: 30,
    alignSelf: "center",
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  pauseButtonText: {
    fontSize: 24,
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
