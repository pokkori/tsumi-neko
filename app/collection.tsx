import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useGameStore } from "../src/stores/gameStore";
import { CAT_SHAPES } from "../src/data/catShapes";
import { CAT_SKINS } from "../src/data/catSkins";
import { ACHIEVEMENTS } from "../src/data/achievements";
import { COLORS } from "../src/constants/colors";
import { CatShapeId } from "../src/types";

const WEEKLY_MISSIONS = [
  { id: "wm_coins_500", label: "今週500コイン獲得", target: 500, reward: 200 },
  { id: "wm_merge_50", label: "今週50回合体", target: 50, reward: 150 },
  { id: "wm_chunky_1", label: "今週ずんぐりを1回誕生させる", target: 1, reward: 300 },
];

// Evolution stage order (matches EVOLUTION_MAP chain)
const EVOLUTION_ORDER: CatShapeId[] = [
  "tiny", "round", "long", "flat", "loaf",
  "triangle", "curled", "fat", "stretchy", "chunky",
];

const STAGE_BORDER_COLORS: Record<number, string> = {
  0: "#FF69B4",
  1: "#FF8C00",
  2: "#DAA520",
  3: "#32CD32",
  4: "#8B4513",
  5: "#4169E1",
  6: "#9932CC",
  7: "#DC143C",
  8: "#FFD700",
  9: "#FF1493",
};

const STAGE_BG_COLORS: Record<number, string> = {
  0: "#FFE4E1",
  1: "#FFECD2",
  2: "#FFFACD",
  3: "#E8F5E9",
  4: "#F5E6CA",
  5: "#E3F2FD",
  6: "#F3E5F5",
  7: "#FFEBEE",
  8: "#FFF8E1",
  9: "#FCE4EC",
};

/** Mini cat preview for collection grid */
const CatMiniPreview: React.FC<{ shapeId: CatShapeId; unlocked: boolean }> = ({ shapeId, unlocked }) => {
  const shape = CAT_SHAPES.find((s) => s.id === shapeId);
  if (!shape) return null;

  const stageIndex = EVOLUTION_ORDER.indexOf(shapeId);
  const displaySize = 20 + stageIndex * 4; // tiny=20, chunky=56
  const borderColor = unlocked ? (STAGE_BORDER_COLORS[stageIndex] || "#CCC") : "#CCC";
  const bgColor = unlocked ? (STAGE_BG_COLORS[stageIndex] || "#F5F5F5") : "#E0E0E0";

  // Eye size scales with stage
  const eyeSize = 3 + stageIndex * 0.4;

  return (
    <View
      style={{
        width: displaySize + 10,
        height: displaySize + 10,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <View
        style={{
          width: displaySize,
          height: displaySize,
          borderRadius: displaySize / 3,
          backgroundColor: unlocked ? bgColor : "#D0D0D0",
          borderWidth: 2,
          borderColor,
          justifyContent: "center",
          alignItems: "center",
          overflow: "visible",
        }}
      >
        {unlocked ? (
          <>
            {/* Ears */}
            <View
              style={{
                position: "absolute",
                top: -4,
                left: displaySize * 0.15,
                width: 0,
                height: 0,
                borderLeftWidth: 3,
                borderRightWidth: 3,
                borderBottomWidth: 5,
                borderLeftColor: "transparent",
                borderRightColor: "transparent",
                borderBottomColor: borderColor,
              }}
            />
            <View
              style={{
                position: "absolute",
                top: -4,
                right: displaySize * 0.15,
                width: 0,
                height: 0,
                borderLeftWidth: 3,
                borderRightWidth: 3,
                borderBottomWidth: 5,
                borderLeftColor: "transparent",
                borderRightColor: "transparent",
                borderBottomColor: borderColor,
              }}
            />
            {/* Eyes */}
            <View style={{ flexDirection: "row", gap: 3, marginTop: -2 }}>
              <View
                style={{
                  width: eyeSize,
                  height: eyeSize + 1,
                  borderRadius: eyeSize / 2,
                  backgroundColor: "#333",
                }}
              />
              <View
                style={{
                  width: eyeSize,
                  height: eyeSize + 1,
                  borderRadius: eyeSize / 2,
                  backgroundColor: "#333",
                }}
              />
            </View>
            {/* Crown for triangle (stage 5) */}
            {stageIndex === 5 && (
              <View style={{ position: "absolute", top: -8, width: 8, height: 5, alignItems: "center" }}>
                <View style={{ width: 0, height: 0, borderLeftWidth: 4, borderRightWidth: 4, borderBottomWidth: 5, borderLeftColor: "transparent", borderRightColor: "transparent", borderBottomColor: "#FFD700" }} />
              </View>
            )}
            {/* Halo for curled (stage 6) */}
            {stageIndex === 6 && (
              <View style={{ position: "absolute", top: -7, width: displaySize * 0.5, height: 4, borderRadius: 2, borderWidth: 1.5, borderColor: "#FFD700", backgroundColor: "rgba(255,215,0,0.3)" }} />
            )}
            {/* Rainbow aura for chunky (stage 9) */}
            {stageIndex === 9 && (
              <View style={{ position: "absolute", width: displaySize + 8, height: displaySize + 8, borderRadius: (displaySize + 8) / 3, borderWidth: 2, borderColor: "rgba(255,215,0,0.5)", backgroundColor: "rgba(255,255,200,0.15)", zIndex: -1 }} />
            )}
          </>
        ) : (
          <Text style={{ fontSize: displaySize * 0.5, color: "#999" }}>?</Text>
        )}
      </View>
    </View>
  );
};

export default function CollectionScreen() {
  const router = useRouter();
  const achievements = useGameStore((s) => s.achievements);
  const unlockedSkins = useGameStore((s) => s.unlockedSkins);

  const shapesUsedCount = achievements.shapesUsed.length;
  const unlockedCount = achievements.unlockedIds.length;

  const [weeklyProgress, setWeeklyProgress] = useState<Record<string, number>>({});

  useEffect(() => {
    (async () => {
      const weekKey = `@tsumineko/weekly_${new Date().toISOString().slice(0, 7)}_W${Math.ceil(new Date().getDate() / 7)}`;
      const raw = await AsyncStorage.getItem(weekKey);
      if (raw) setWeeklyProgress(JSON.parse(raw));
    })();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>{"<-"} 戻る</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>ネコ図鑑</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Evolution Chain - 横スクロール進化チェーン可視化 */}
        <Text style={styles.sectionTitle}>進化チェーン</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chainScroll}>
          <View style={styles.chainRow}>
            {EVOLUTION_ORDER.map((shapeId, idx) => (
              <React.Fragment key={shapeId}>
                <View style={styles.chainCell}>
                  <CatMiniPreview shapeId={shapeId} unlocked={achievements.shapesUsed.includes(shapeId)} />
                  <Text style={styles.chainName}>{CAT_SHAPES.find(c=>c.id===shapeId)?.name ?? shapeId}</Text>
                </View>
                {idx < EVOLUTION_ORDER.length - 1 && (
                  <Text style={styles.arrow}>→</Text>
                )}
              </React.Fragment>
            ))}
          </View>
        </ScrollView>
        <Text style={styles.sectionSubtitle}>
          発見率: {shapesUsedCount}/{EVOLUTION_ORDER.length}
        </Text>

        <View style={styles.evolutionChain}>
          {EVOLUTION_ORDER.map((shapeId, idx) => {
            const shape = CAT_SHAPES.find((s) => s.id === shapeId);
            const unlocked = achievements.shapesUsed.includes(shapeId);
            return (
              <React.Fragment key={shapeId}>
                <View style={styles.evolutionCard}>
                  <Text style={styles.stageLabel}>Lv.{idx + 1}</Text>
                  <CatMiniPreview shapeId={shapeId} unlocked={unlocked} />
                  <Text style={styles.cardName}>
                    {unlocked ? (shape?.name || shapeId) : "???"}
                  </Text>
                  <Text style={[styles.cardStatus, unlocked && styles.cardStatusUnlocked]}>
                    {unlocked ? "発見済" : "未発見"}
                  </Text>
                  {unlocked && shape?.personality && (
                    <Text style={{ fontSize: 9, color: '#888', textAlign: 'center', marginTop: 2, fontStyle: 'italic' }}>
                      {shape.personality}
                    </Text>
                  )}
                </View>
                {idx < EVOLUTION_ORDER.length - 1 && (
                  <View style={styles.arrowContainer}>
                    <Text style={styles.arrowText}>{">"}</Text>
                  </View>
                )}
              </React.Fragment>
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
                    {
                      backgroundColor: unlocked ? skin.bodyColor : "#CCCCCC",
                      borderColor: unlocked ? (skin.patternColor || "#00000020") : "#CCCCCC",
                    },
                  ]}
                >
                  {unlocked && (
                    <>
                      <View style={{ width: 4, height: 5, borderRadius: 2.5, backgroundColor: skin.eyeColor, position: "absolute", left: 8, top: 12 }} />
                      <View style={{ width: 4, height: 5, borderRadius: 2.5, backgroundColor: skin.eyeColor, position: "absolute", right: 8, top: 12 }} />
                      <View style={{ width: 3, height: 2, borderRadius: 1.5, backgroundColor: skin.noseColor, position: "absolute", bottom: 12, alignSelf: "center" }} />
                    </>
                  )}
                </View>
                <Text style={styles.cardName}>
                  {unlocked ? skin.name : "???"}
                </Text>
                <Text style={[styles.cardStatus, unlocked && styles.cardStatusUnlocked]}>
                  {unlocked ? "解放済" : "未解放"}
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
                {hidden ? "?" : achievement.icon}
              </Text>
              <View style={styles.achievementInfo}>
                <Text style={styles.achievementName}>
                  {hidden ? "???" : achievement.name}
                </Text>
                <Text style={styles.achievementDesc}>
                  {hidden ? "隠し実績" : achievement.description}
                </Text>
              </View>
              <Text style={[styles.cardStatus, unlocked && styles.cardStatusUnlocked]}>
                {unlocked ? "達成" : "未達成"}
              </Text>
            </View>
          );
        })}

        {/* Weekly Missions */}
        <View style={{ marginTop: 20, paddingHorizontal: 16 }}>
          <Text style={{ color: "#FFD700", fontSize: 16, fontWeight: "bold", marginBottom: 8 }}>週次ミッション</Text>
          {WEEKLY_MISSIONS.map(mission => {
            const progress = weeklyProgress[mission.id] ?? 0;
            const completed = progress >= mission.target;
            const pct = Math.min((progress / mission.target) * 100, 100);
            return (
              <View key={mission.id} style={{ marginBottom: 12, padding: 12, backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 12 }}>
                <Text style={{ color: completed ? "#4CAF50" : "#fff", fontSize: 14, fontWeight: "bold" }}>
                  {completed ? "[完了] " : ""}{mission.label}
                </Text>
                <View style={{ height: 6, backgroundColor: "#333", borderRadius: 3, marginTop: 6 }}>
                  <View style={{ width: `${pct}%` as any, height: 6, backgroundColor: completed ? "#4CAF50" : "#FF6B35", borderRadius: 3 }} />
                </View>
                <Text style={{ color: "#aaa", fontSize: 11, marginTop: 3 }}>
                  {progress}/{mission.target} (報酬: {mission.reward}コイン)
                </Text>
              </View>
            );
          })}
        </View>

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
  chainScroll: { marginVertical: 12 },
  chainRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16 },
  chainCell: { alignItems: 'center', width: 70 },
  chainName: { fontSize: 10, color: COLORS.text, textAlign: 'center', marginTop: 4 },
  arrow: { color: COLORS.textLight, fontSize: 20, marginHorizontal: 4 },
  // Evolution chain: horizontal scroll with arrows
  evolutionChain: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 4,
    marginBottom: 16,
    paddingVertical: 8,
  },
  evolutionCard: {
    width: 72,
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    padding: 6,
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  stageLabel: {
    fontSize: 9,
    fontWeight: "bold",
    color: COLORS.textLight,
    marginBottom: 2,
  },
  arrowContainer: {
    justifyContent: "center",
    alignItems: "center",
    width: 12,
  },
  arrowText: {
    fontSize: 14,
    color: COLORS.textLight,
    fontWeight: "bold",
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
  cardName: {
    fontSize: 10,
    color: COLORS.text,
    textAlign: "center",
    marginTop: 2,
  },
  cardStatus: {
    fontSize: 10,
    marginTop: 2,
    color: COLORS.textLight,
  },
  cardStatusUnlocked: {
    color: COLORS.success,
    fontWeight: "bold",
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
});
