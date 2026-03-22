import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  SafeAreaView,
  Platform,
  Alert,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { formatScore, formatHeight } from "../src/utils/format";
import { shareResult, generateEmojiGrid, generateShareImage } from "../src/utils/share";
import { loadData } from "../src/utils/storage";
import { COLORS } from "../src/constants/colors";
import { CatShapeId } from "../src/types";
import { CAT_EMOJI, CAT_SHAPES } from "../src/data/catShapes";
import { useGameStore } from "../src/stores/gameStore";

export default function ResultScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    score: string;
    height: string;
    catCount: string;
    maxCombo: string;
    isNewRecord: string;
    isDaily: string;
    mergeCount: string;
    shapesUsed: string;
    coinsEarned: string;
    dailyClear: string;
  }>();

  const score = parseInt(params.score || "0", 10);
  const height = parseFloat(params.height || "0");
  const catCount = parseInt(params.catCount || "0", 10);
  const maxCombo = parseInt(params.maxCombo || "0", 10);
  const isNewRecord = params.isNewRecord === "true";
  const isDaily = params.isDaily === "true";
  const mergeCount = parseInt(params.mergeCount || "0", 10);
  const coinsEarned = parseInt(params.coinsEarned || "0", 10);
  const dailyClear = params.dailyClear === "true";
  const shapesUsed: CatShapeId[] = params.shapesUsed
    ? (params.shapesUsed.split(",").filter(Boolean) as CatShapeId[])
    : [];

  // maxEvolutionをshapesUsedから即座に計算（useEffectより前で確定させる）
  const maxEvolution: string = (() => {
    if (shapesUsed.length === 0) return "";
    const evolutionOrder = CAT_SHAPES.map((s) => s.id);
    let maxIndex = -1;
    let maxShapeId: CatShapeId | null = null;
    for (const shapeId of shapesUsed) {
      const idx = evolutionOrder.indexOf(shapeId);
      if (idx > maxIndex) {
        maxIndex = idx;
        maxShapeId = shapeId;
      }
    }
    return maxShapeId ? (CAT_EMOJI[maxShapeId] || "") : "";
  })();

  const [currentStreak, setCurrentStreak] = useState<number>(0);
  const [previewDataUrl, setPreviewDataUrl] = useState<string | null>(null);
  const [skinUnlockMessage, setSkinUnlockMessage] = useState<string | null>(null);

  // 今回解禁された最高進化ランクのバッジ表示（useEffectより前で確定させる）
  const evolutionBadge = maxEvolution ? `最高進化 ${maxEvolution} 解禁！` : null;

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const confettiAnim = useRef(new Animated.Value(0)).current;
  const badgePulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    loadData("@tsumineko/stats").then((stats) => {
      setCurrentStreak(stats.currentStreak);
    });
  }, []);

  // スキン解放チェック（スコア5000点以上でペルシャ解放）
  useEffect(() => {
    if (score >= 5000) {
      const store = useGameStore.getState();
      const alreadyUnlocked = store.unlockedSkins.includes("persian");
      if (!alreadyUnlocked) {
        store.unlockSkin("persian").then(() => {
          setSkinUnlockMessage("🎉 スキン解放！ペルシャネコが使えるようになった！");
          Alert.alert(
            "🎉 スキン解放！",
            "ペルシャネコのスキンが解放されました！\nショップで確認してね！"
          );
        });
      }
    }
  }, [score]);

  useEffect(() => {
    if (Platform.OS === "web") {
      generateShareImage({ score, height, catCount, maxCombo, mergeCount, isNewRecord, shapesUsed, maxEvolution })
        .then((url) => { if (url) setPreviewDataUrl(url); });
    }
  }, []);

  useEffect(() => {
    if (isNewRecord) {
      Animated.sequence([
        Animated.timing(confettiAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(confettiAnim, { toValue: 0.8, duration: 300, useNativeDriver: true }),
        Animated.timing(confettiAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]).start();
    }
  }, [isNewRecord]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        useNativeDriver: true,
      }),
    ]).start();
    // Gold badge pulse (everlasting)
    if (evolutionBadge) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(badgePulseAnim, { toValue: 1.12, duration: 600, useNativeDriver: true }),
          Animated.timing(badgePulseAnim, { toValue: 1.0, duration: 800, useNativeDriver: true }),
        ])
      ).start();
    }
  }, []);

  const handleShare = () => {
    shareResult({ score, height, catCount, isNewRecord, mergeCount, shapesUsed, maxCombo, maxEvolution });
  };

  // Generate emoji preview for display
  const emojiPreview = generateEmojiGrid(shapesUsed, mergeCount, catCount);

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <Text style={styles.gameOverText}>GAME OVER</Text>

        {isNewRecord && (
          <Animated.View
            style={[
              styles.newRecordBanner,
              {
                transform: [{ scale: confettiAnim.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1.1] }) }],
                opacity: confettiAnim.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1] }),
              },
            ]}
          >
            <Text style={styles.newRecordText}>🎉 NEW RECORD! 🎉</Text>
          </Animated.View>
        )}

        {dailyClear && (
          <View style={{
            backgroundColor: "#1565C0",
            paddingHorizontal: 24,
            paddingVertical: 10,
            borderRadius: 20,
            marginBottom: 12,
          }}>
            <Text style={{ color: "#FFFFFF", fontSize: 16, fontWeight: "bold", textAlign: "center" }}>
              📅 デイリーチャレンジ クリア！
            </Text>
          </View>
        )}

        {/* Score Card */}
        <View style={styles.scoreCard}>
          <View style={styles.scoreRow}>
            <Text style={styles.scoreLabel}>Score</Text>
            <Text style={styles.scoreValue}>{formatScore(score)}</Text>
          </View>
          <View style={styles.scoreRow}>
            <Text style={styles.scoreLabel}>Height</Text>
            <Text style={styles.scoreValue}>{formatHeight(height)}</Text>
          </View>
          <View style={styles.scoreRow}>
            <Text style={styles.scoreLabel}>Cats</Text>
            <Text style={styles.scoreValue}>{catCount}</Text>
          </View>
          <View style={styles.scoreRow}>
            <Text style={styles.scoreLabel}>Combo</Text>
            <Text style={styles.scoreValue}>x{maxCombo}</Text>
          </View>
          {mergeCount > 0 && (
            <View style={styles.scoreRow}>
              <Text style={styles.scoreLabel}>Merges</Text>
              <Text style={[styles.scoreValue, styles.mergeValue]}>
                x{mergeCount}
              </Text>
            </View>
          )}
          {coinsEarned > 0 && (
            <View style={styles.scoreRow}>
              <Text style={styles.scoreLabel}>獲得コイン</Text>
              <Text style={[styles.scoreValue, { color: "#FFD700" }]}>🪙 +{coinsEarned}</Text>
            </View>
          )}
        </View>

        {evolutionBadge && (
          <Animated.View style={{
            backgroundColor: 'rgba(255,215,0,0.18)',
            borderRadius: 8,
            padding: 8,
            marginTop: 8,
            borderWidth: 2,
            borderColor: '#FFD700',
            shadowColor: '#FFD700',
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.6,
            shadowRadius: 8,
            elevation: 6,
            transform: [{ scale: badgePulseAnim }],
          }}>
            <Text style={{ color: '#FFD700', fontSize: 18, fontWeight: 'bold', textAlign: 'center' }}>
              {'🌟'} {evolutionBadge}
            </Text>
          </Animated.View>
        )}

        {/* Skin Unlock Notification */}
        {skinUnlockMessage && (
          <View style={{
            backgroundColor: "rgba(255,215,0,0.2)",
            borderRadius: 12,
            paddingHorizontal: 20,
            paddingVertical: 10,
            marginBottom: 12,
            borderWidth: 1,
            borderColor: "#FFD700",
          }}>
            <Text style={{ color: "#FFD700", fontWeight: "bold", textAlign: "center", fontSize: 16 }}>
              {skinUnlockMessage}
            </Text>
          </View>
        )}

        {/* Streak Display */}
        {currentStreak >= 2 && (
          <View style={styles.streakBanner}>
            <Text style={styles.streakText}>
              🔥 {currentStreak}日連続プレイ中！
            </Text>
          </View>
        )}

        {/* OGP Image Preview (web) or Emoji Grid (native) */}
        {previewDataUrl && Platform.OS === "web" ? (
          <View style={styles.emojiCard}>
            {/* @ts-ignore web-only img element */}
            <img src={previewDataUrl} style={{ width: "100%", borderRadius: 8, maxHeight: 200, objectFit: "cover" }} alt="score card" />
          </View>
        ) : emojiPreview ? (
          <View style={styles.emojiCard}>
            <Text style={styles.emojiGrid}>{emojiPreview}</Text>
          </View>
        ) : null}

        {/* Buttons */}
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => router.replace("/game")}
        >
          <Text style={styles.buttonText}>もう一回</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.shareButton}
          onPress={handleShare}
        >
          <Text style={styles.buttonText}>
            {previewDataUrl ? "📸 画像付きシェア" : "📢 シェアする"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.homeButton}
          onPress={() => router.replace("/")}
        >
          <Text style={styles.homeButtonText}>タイトルに戻る</Text>
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1A1A2E",
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    alignItems: "center",
    padding: 20,
    width: "100%",
    maxWidth: 400,
  },
  gameOverText: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#FFFFFF",
    letterSpacing: 4,
    marginBottom: 16,
  },
  newRecordBanner: {
    backgroundColor: "#FFD700",
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 20,
  },
  newRecordText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1A1A2E",
  },
  scoreCard: {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 16,
    padding: 24,
    width: "90%",
    marginBottom: 16,
  },
  scoreRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  scoreLabel: {
    fontSize: 18,
    color: "rgba(255,255,255,0.7)",
  },
  scoreValue: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  mergeValue: {
    color: "#FFD700",
  },
  streakBanner: {
    backgroundColor: "rgba(255, 165, 0, 0.2)",
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 165, 0, 0.5)",
  },
  streakText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFA500",
    textAlign: "center",
  },
  emojiCard: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 12,
    padding: 16,
    width: "90%",
    marginBottom: 20,
    alignItems: "center",
  },
  emojiGrid: {
    fontSize: 16,
    color: "#FFFFFF",
    textAlign: "center",
    lineHeight: 24,
  },
  retryButton: {
    backgroundColor: COLORS.secondary,
    paddingHorizontal: 50,
    paddingVertical: 16,
    borderRadius: 30,
    marginBottom: 12,
    width: "80%",
    alignItems: "center",
  },
  shareButton: {
    backgroundColor: "#4FC3F7",
    paddingHorizontal: 50,
    paddingVertical: 16,
    borderRadius: 30,
    marginBottom: 12,
    width: "80%",
    alignItems: "center",
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "bold",
  },
  homeButton: {
    marginTop: 12,
  },
  homeButtonText: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 16,
  },
});
