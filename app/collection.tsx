import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from "react-native";
import { useRouter } from "expo-router";
import { useGameStore } from "../src/stores/gameStore";
import { CAT_SHAPES } from "../src/data/catShapes";
import { CAT_SKINS } from "../src/data/catSkins";
import { ACHIEVEMENTS } from "../src/data/achievements";
import { COLORS } from "../src/constants/colors";

export default function CollectionScreen() {
  const router = useRouter();
  const achievements = useGameStore((s) => s.achievements);
  const unlockedSkins = useGameStore((s) => s.unlockedSkins);

  const shapesUsedCount = achievements.shapesUsed.length;
  const unlockedCount = achievements.unlockedIds.length;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>← 戻る</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>📚 ネコ図鑑</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Shape Collection */}
        <Text style={styles.sectionTitle}>形状コレクション</Text>
        <Text style={styles.sectionSubtitle}>
          収集率: {shapesUsedCount}/{CAT_SHAPES.length}
        </Text>

        <View style={styles.grid}>
          {CAT_SHAPES.map((shape) => {
            const unlocked = achievements.shapesUsed.includes(shape.id);
            return (
              <View
                key={shape.id}
                style={[styles.card, !unlocked && styles.cardLocked]}
              >
                <Text style={styles.cardEmoji}>
                  {unlocked ? "🐱" : "❓"}
                </Text>
                <Text style={styles.cardName}>
                  {unlocked ? shape.name : "???"}
                </Text>
                <Text style={styles.cardStatus}>
                  {unlocked ? "✅" : "🔒"}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Skin Collection */}
        <Text style={styles.sectionTitle}>スキンコレクション</Text>
        <Text style={styles.sectionSubtitle}>
          解放率: {unlockedSkins.length}/{CAT_SKINS.length}
        </Text>

        <View style={styles.grid}>
          {CAT_SKINS.map((skin) => {
            const unlocked = unlockedSkins.includes(skin.id);
            return (
              <View
                key={skin.id}
                style={[styles.card, !unlocked && styles.cardLocked]}
              >
                <View
                  style={[
                    styles.skinCircle,
                    { backgroundColor: unlocked ? skin.bodyColor : "#CCCCCC" },
                  ]}
                />
                <Text style={styles.cardName}>
                  {unlocked ? skin.name : "???"}
                </Text>
                <Text style={styles.cardStatus}>
                  {unlocked ? "✅" : "🔒"}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Achievements */}
        <Text style={styles.sectionTitle}>実績</Text>
        <Text style={styles.sectionSubtitle}>
          解放率: {unlockedCount}/{ACHIEVEMENTS.length}
        </Text>

        {ACHIEVEMENTS.map((achievement) => {
          const unlocked = achievements.unlockedIds.includes(achievement.id);
          const hidden = achievement.isSecret && !unlocked;

          return (
            <View
              key={achievement.id}
              style={[styles.achievementRow, !unlocked && styles.achievementLocked]}
            >
              <Text style={styles.achievementIcon}>
                {hidden ? "❓" : achievement.icon}
              </Text>
              <View style={styles.achievementInfo}>
                <Text style={styles.achievementName}>
                  {hidden ? "???" : achievement.name}
                </Text>
                <Text style={styles.achievementDesc}>
                  {hidden ? "隠し実績" : achievement.description}
                </Text>
              </View>
              <Text style={styles.achievementStatus}>
                {unlocked ? "✅" : "🔒"}
              </Text>
            </View>
          );
        })}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    fontSize: 16,
    color: COLORS.secondary,
    fontWeight: "bold",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.text,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.text,
    marginTop: 20,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: COLORS.textLight,
    marginBottom: 12,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  card: {
    width: 100,
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  cardLocked: {
    opacity: 0.5,
    backgroundColor: "#E0E0E0",
  },
  cardEmoji: {
    fontSize: 28,
    marginBottom: 4,
  },
  cardName: {
    fontSize: 11,
    color: COLORS.text,
    textAlign: "center",
  },
  cardStatus: {
    fontSize: 12,
    marginTop: 4,
  },
  skinCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: "#00000020",
    marginBottom: 4,
  },
  achievementRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
  },
  achievementLocked: {
    opacity: 0.6,
  },
  achievementIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  achievementInfo: {
    flex: 1,
  },
  achievementName: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.text,
  },
  achievementDesc: {
    fontSize: 12,
    color: COLORS.textLight,
    marginTop: 2,
  },
  achievementStatus: {
    fontSize: 16,
    marginLeft: 8,
  },
});
