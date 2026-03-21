import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  SafeAreaView,
} from "react-native";
import { useRouter } from "expo-router";
import { useGameStore } from "../src/stores/gameStore";
import { useDailyChallenge } from "../src/hooks/useDailyChallenge";
import { DailyBadge } from "../src/components/DailyBadge";
import { formatScore, formatHeight } from "../src/utils/format";
import { COLORS } from "../src/constants/colors";

export default function TitleScreen() {
  const router = useRouter();
  const stats = useGameStore((s) => s.stats);
  const initialized = useGameStore((s) => s.initialized);
  const { isCompleted } = useDailyChallenge();

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const catBounce = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Pulse animation for play button
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Cat tower bounce animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(catBounce, {
          toValue: -8,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(catBounce, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  if (!initialized) {
    return (
      <View style={[styles.container, styles.loading]}>
        <Text style={styles.loadingText}>🐱 Loading...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Cat Tower Animation */}
      <Animated.View
        style={[styles.towerContainer, { transform: [{ translateY: catBounce }] }]}
      >
        <Text style={styles.catTower}>{"  🐱  \n 🐱🐱 \n🐱🐱🐱"}</Text>
        <View style={styles.towerBase} />
      </Animated.View>

      {/* Title */}
      <Text style={styles.title}>つみネコ</Text>
      <Text style={styles.subtitle}>Stack Cats</Text>

      {/* Play Button */}
      <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
        <TouchableOpacity
          style={styles.playButton}
          onPress={() => router.push("/game")}
          activeOpacity={0.8}
        >
          <Text style={styles.playButtonText}>▶ あそぶ</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Daily Challenge */}
      <TouchableOpacity
        style={styles.dailyButton}
        onPress={() => router.push("/game?daily=true")}
        activeOpacity={0.8}
      >
        <Text style={styles.dailyButtonText}>📅 デイリー</Text>
        <DailyBadge isCompleted={isCompleted} />
      </TouchableOpacity>

      {/* Best Score */}
      <View style={styles.statsContainer}>
        <Text style={styles.statsText}>
          🏆 Best: {formatScore(stats.bestScore)}
        </Text>
        <Text style={styles.statsText}>
          📏 Max: {formatHeight(stats.bestHeight)}
        </Text>
      </View>

      {/* Footer Buttons */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.footerButton}
          onPress={() => router.push("/collection")}
        >
          <Text style={styles.footerButtonText}>📚 図鑑</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.footerButton}
          onPress={() => router.push("/shop")}
        >
          <Text style={styles.footerButtonText}>🛍 ショップ</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.footerButton}
          onPress={() => router.push("/settings")}
        >
          <Text style={styles.footerButtonText}>⚙ 設定</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  loading: {
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 24,
    color: COLORS.text,
  },
  towerContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  catTower: {
    fontSize: 32,
    lineHeight: 40,
    textAlign: "center",
  },
  towerBase: {
    width: 120,
    height: 8,
    backgroundColor: COLORS.ground,
    borderRadius: 4,
    marginTop: 4,
  },
  title: {
    fontSize: 48,
    fontWeight: "bold",
    color: COLORS.text,
    letterSpacing: 8,
    textShadowColor: "rgba(0,0,0,0.1)",
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 20,
    color: COLORS.textLight,
    marginBottom: 30,
    letterSpacing: 4,
  },
  playButton: {
    backgroundColor: COLORS.secondary,
    paddingHorizontal: 60,
    paddingVertical: 18,
    borderRadius: 30,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  playButtonText: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "bold",
  },
  dailyButton: {
    backgroundColor: "#4FC3F7",
    paddingHorizontal: 40,
    paddingVertical: 14,
    borderRadius: 25,
    marginTop: 16,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  dailyButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
  },
  statsContainer: {
    marginTop: 24,
    alignItems: "center",
  },
  statsText: {
    fontSize: 16,
    color: COLORS.text,
    marginVertical: 2,
  },
  footer: {
    flexDirection: "row",
    position: "absolute",
    bottom: 40,
    gap: 20,
  },
  footerButton: {
    backgroundColor: "rgba(255,255,255,0.7)",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  footerButtonText: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: "bold",
  },
});
