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
import { CAT_SHAPES } from "../src/data/catShapes";
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

  const evolutionOrder = ["tiny","round","long","flat","loaf","triangle","curled","fat","stretchy","chunky"];
  const evolutionLabels = ["ちび","まんまる","ながなが","ぺたんこ","食パン","おすわり","まるまり","でぶ","のびのび","ずんぐり"];
  const maxReachedIdx = evolutionOrder.reduce((max, shape, idx) => {
    return shapesUsed.includes(shape as CatShapeId) ? idx : max;
  }, -1);

  const GAME_RANK_THRESHOLDS = [
    { threshold: 8000, rank: "S", color: "#FFD700", label: "スコアマスター！" },
    { threshold: 4000, rank: "A", color: "#C0C0C0", label: "ネコ積み達人" },
    { threshold: 1500, rank: "B", color: "#CD7F32", label: "なかなかの腕前" },
    { threshold: 0, rank: "C", color: "#888888", label: "次は上を目指せ！" },
  ] as const;
  const gameRank = GAME_RANK_THRESHOLDS.find(r => score >= r.threshold) ?? GAME_RANK_THRESHOLDS[3];

  // maxEvolutionをshapesUsedから即座に計算（useEffectより前で確定させる）
  const EVOLUTION_NAMES: Record<string, string> = {
    tiny: "ちびネコ", round: "まんまるネコ", long: "ながながネコ",
    flat: "ぺたんこネコ", loaf: "食パンネコ", triangle: "おすわりネコ",
    curled: "まるまりネコ", fat: "でぶネコ", stretchy: "のびのびネコ",
    chunky: "ずんぐりネコ",
  };
  const EVOLUTION_LV: Record<string, number> = {
    tiny: 1, round: 2, long: 3, flat: 4, loaf: 5,
    triangle: 6, curled: 7, fat: 8, stretchy: 9, chunky: 10,
  };
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
    // shapeId文字列を返す（絵文字は使用しない）
    return maxShapeId ?? "";
  })();

  const [currentStreak, setCurrentStreak] = useState<number>(0);
  const [bestScore, setBestScore] = useState<number>(0);
  const [previewDataUrl, setPreviewDataUrl] = useState<string | null>(null);
  const [skinUnlockMessage, setSkinUnlockMessage] = useState<string | null>(null);

  // 今回解禁された最高進化ランクのバッジ表示（絵文字不使用）
  const evolutionBadge = maxEvolution
    ? `最高進化 Lv${EVOLUTION_LV[maxEvolution] ?? "?"} ${EVOLUTION_NAMES[maxEvolution] ?? maxEvolution} 解禁！`
    : null;

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const confettiAnim = useRef(new Animated.Value(0)).current;
  const badgePulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    loadData("@tsumineko/stats").then((stats) => {
      setCurrentStreak(stats.currentStreak);
      setBestScore(stats.bestScore ?? 0);
    });
  }, []);

  // スキン解放チェック（スコア5000点以上でペルシャ解放）
  useEffect(() => {
    if (score >= 5000) {
      const store = useGameStore.getState();
      const alreadyUnlocked = store.unlockedSkins.includes("persian");
      if (!alreadyUnlocked) {
        store.unlockSkin("persian").then(() => {
          setSkinUnlockMessage("スキン解放！ペルシャネコが使えるようになった！");
          Alert.alert(
            "スキン解放！",
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

        <View style={{ backgroundColor: gameRank.color + '22', borderWidth: 2, borderColor: gameRank.color, borderRadius: 16, paddingHorizontal: 32, paddingVertical: 10, marginBottom: 16 }}>
          <Text style={{ fontSize: 40, fontWeight: 'bold', color: gameRank.color, textAlign: 'center' }}>ランク {gameRank.rank}</Text>
          <Text style={{ fontSize: 13, color: '#ccc', textAlign: 'center', marginTop: 2 }}>{gameRank.label}</Text>
        </View>

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
            <Text style={styles.newRecordText}>NEW RECORD!</Text>
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
              デイリーチャレンジ クリア！
            </Text>
          </View>
        )}

        {/* ニアミス表示 */}
        {!isNewRecord && bestScore > 0 && score < bestScore && (
          <View style={{ backgroundColor: 'rgba(255,215,0,0.12)', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 8, marginBottom: 10, borderWidth: 1, borderColor: 'rgba(255,215,0,0.4)' }}>
            <Text style={{ color: '#FFD700', fontSize: 13, fontWeight: 'bold', textAlign: 'center' }}>
              あと {formatScore(bestScore - score)} 点で自己ベスト更新！
            </Text>
          </View>
        )}
        {!isNewRecord && toNext !== null && toNext > 0 && (
          <View style={{ backgroundColor: 'rgba(150,200,255,0.1)', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 6, marginBottom: 10, borderWidth: 1, borderColor: 'rgba(100,180,255,0.3)' }}>
            <Text style={{ color: '#90CAF9', fontSize: 12, textAlign: 'center' }}>
              あと {formatScore(toNext)} 点でランク{gameRank.rank === 'C' ? 'B' : gameRank.rank === 'B' ? 'B+' : gameRank.rank === 'B+' ? 'A' : gameRank.rank === 'A' ? 'A+' : 'S'} 到達！
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
              <Text style={[styles.scoreValue, { color: "#FFD700" }]}>COIN: +{coinsEarned}</Text>
            </View>
          )}
        </View>

        {/* Evolution Chart */}
        <View style={{ marginTop: 16, paddingHorizontal: 8 }}>
          <Text style={{ color: "#aaa", fontSize: 12, textAlign: "center", marginBottom: 6 }}>進化チャート</Text>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            {evolutionOrder.map((shape, idx) => {
              const reached = shapesUsed.includes(shape as CatShapeId);
              const isMax = idx === maxReachedIdx;
              return (
                <View key={shape} style={{ alignItems: "center", flex: 1 }}
                  accessibilityLabel={`${evolutionLabels[idx]}${isMax ? ' 最高到達' : reached ? ' 解禁済み' : ' 未到達'}`}
                  accessibilityRole="text"
                >
                  <View style={{
                    width: 22, height: 22, borderRadius: 11,
                    backgroundColor: reached ? (isMax ? "#FFD700" : "#81C784") : "#333",
                    borderWidth: isMax ? 2 : reached ? 1 : 0,
                    borderColor: isMax ? "#FFD700" : "#4CAF50",
                    alignItems: "center", justifyContent: "center",
                  }}>
                    {isMax ? (
                      <Text style={{ fontSize: 10, color: "#333", fontWeight: "bold" }}>★</Text>
                    ) : reached ? (
                      <Text style={{ fontSize: 9, color: "#fff", fontWeight: "bold" }}>✓</Text>
                    ) : null}
                  </View>
                  <Text style={{ fontSize: 7, color: reached ? "#fff" : "#666", marginTop: 2, textAlign: "center" }}>
                    {evolutionLabels[idx]}
                  </Text>
                </View>
              );
            })}
          </View>
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
              {evolutionBadge}
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
              {currentStreak}日連続プレイ中！
            </Text>
          </View>
        )}

        {/* 7日ストリーク達成バナー */}
        {currentStreak > 0 && currentStreak % 7 === 0 && (
          <View style={{ backgroundColor: '#FFD700', borderRadius: 12, padding: 16, marginVertical: 12, alignItems: 'center' }}>
            <Text style={{ fontWeight: 'bold', fontSize: 18, color: '#1a1a1a' }}>7日連続達成！ストリーク継続中！</Text>
            <Text style={{ fontSize: 14, color: '#1a1a1a', marginTop: 4 }}>STREAK: {currentStreak}日</Text>
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

        {/* Reward Ad UI - App Store配信後に有効化 */}

        {/* Buttons */}
        <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', textAlign: 'center', marginBottom: 8 }}>
          {score >= 8000
            ? "伝説のスコア！さらなる高みへ！"
            : score >= 4000
            ? "あと少しでずんぐりネコ達人！"
            : score >= 1500
            ? "もっと積めるはず！次こそずんぐりネコ！"
            : "コツをつかんで再挑戦！"}
        </Text>
        <TouchableOpacity
          style={[styles.retryButton, { width: "90%", backgroundColor: "#FF6B35", minHeight: 44 }]}
          accessibilityLabel="もう一度プレイする"
          accessibilityRole="button"
          onPress={() => router.replace("/game")}
        >
          <Text style={styles.buttonText}>もう一回！</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.shareButton, { minHeight: 44 }]}
          accessibilityLabel="結果をシェアする"
          accessibilityRole="button"
          onPress={handleShare}
        >
          <Text style={styles.buttonText}>
            {previewDataUrl ? "画像付きシェア" : "シェアする"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.homeButton, { minHeight: 44 }]}
          accessibilityLabel="タイトルに戻る"
          accessibilityRole="button"
          onPress={() => router.replace("/")}
        >
          <Text style={styles.homeButtonText}>タイトルに戻る</Text>
        </TouchableOpacity>

        {Platform.OS === "web" && (
          <TouchableOpacity
            style={{ marginTop: 16, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 12, paddingHorizontal: 20, paddingVertical: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' }}
            onPress={() => {
              if (typeof window !== 'undefined') {
                window.open('https://tsumi-neko.vercel.app/shop', '_blank');
              }
            }}
          >
            <Text style={{ color: '#FFD700', fontSize: 13, textAlign: 'center' }}>コインを買ってずんぐりネコを目指す</Text>
          </TouchableOpacity>
        )}
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
