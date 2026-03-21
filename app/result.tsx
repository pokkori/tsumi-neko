import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  SafeAreaView,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { formatScore, formatHeight } from "../src/utils/format";
import { shareResult } from "../src/utils/share";
import { COLORS } from "../src/constants/colors";

export default function ResultScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    score: string;
    height: string;
    catCount: string;
    maxCombo: string;
    isNewRecord: string;
    isDaily: string;
  }>();

  const score = parseInt(params.score || "0", 10);
  const height = parseFloat(params.height || "0");
  const catCount = parseInt(params.catCount || "0", 10);
  const maxCombo = parseInt(params.maxCombo || "0", 10);
  const isNewRecord = params.isNewRecord === "true";
  const isDaily = params.isDaily === "true";

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

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
  }, []);

  const handleShare = () => {
    shareResult({ score, height, catCount, isNewRecord });
  };

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
          <View style={styles.newRecordBanner}>
            <Text style={styles.newRecordText}>🏆 NEW RECORD! 🏆</Text>
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
            <Text style={styles.scoreValue}>{catCount}匹</Text>
          </View>
          <View style={styles.scoreRow}>
            <Text style={styles.scoreLabel}>Combo</Text>
            <Text style={styles.scoreValue}>x{maxCombo}</Text>
          </View>
        </View>

        {/* Buttons */}
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => router.replace("/game")}
        >
          <Text style={styles.buttonText}>🔄 もう一回</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.shareButton}
          onPress={handleShare}
        >
          <Text style={styles.buttonText}>📸 シェアする</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.homeButton}
          onPress={() => router.replace("/")}
        >
          <Text style={styles.homeButtonText}>🏠 タイトルに戻る</Text>
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
    marginBottom: 24,
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
