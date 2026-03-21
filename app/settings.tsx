import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Switch,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useGameStore } from "../src/stores/gameStore";
import { resetAllData } from "../src/utils/storage";
import { COLORS } from "../src/constants/colors";
import { CAT_SKINS } from "../src/data/catSkins";

export default function SettingsScreen() {
  const router = useRouter();
  const settings = useGameStore((s) => s.settings);
  const updateSettings = useGameStore((s) => s.updateSettings);
  const unlockedSkins = useGameStore((s) => s.unlockedSkins);
  const initialize = useGameStore((s) => s.initialize);

  const handleReset = () => {
    Alert.alert(
      "データリセット",
      "全てのスコア、実績、コインがリセットされます。よろしいですか？",
      [
        { text: "キャンセル", style: "cancel" },
        {
          text: "リセット",
          style: "destructive",
          onPress: async () => {
            await resetAllData();
            await initialize();
            Alert.alert("完了", "データをリセットしました");
          },
        },
      ]
    );
  };

  const cycleSkin = () => {
    const currentIndex = unlockedSkins.indexOf(settings.selectedSkinId);
    const nextIndex = (currentIndex + 1) % unlockedSkins.length;
    updateSettings({ selectedSkinId: unlockedSkins[nextIndex] });
  };

  const currentSkin = CAT_SKINS.find((s) => s.id === settings.selectedSkinId);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>← 戻る</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>⚙ 設定</Text>
        <View style={{ width: 60 }} />
      </View>

      <View style={styles.content}>
        {/* Skin Selection */}
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>使用スキン</Text>
          <TouchableOpacity style={styles.skinSelector} onPress={cycleSkin}>
            <View
              style={[
                styles.skinCircle,
                { backgroundColor: currentSkin?.bodyColor || "#FFF" },
              ]}
            />
            <Text style={styles.skinName}>{currentSkin?.name || "三毛猫"}</Text>
            <Text style={styles.changeText}>変更 →</Text>
          </TouchableOpacity>
        </View>

        {/* BGM Volume */}
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>
            BGM音量: {Math.round(settings.bgmVolume * 100)}%
          </Text>
          <View style={styles.volumeRow}>
            <TouchableOpacity
              style={styles.volumeButton}
              onPress={() =>
                updateSettings({
                  bgmVolume: Math.max(0, settings.bgmVolume - 0.1),
                })
              }
            >
              <Text style={styles.volumeButtonText}>-</Text>
            </TouchableOpacity>
            <View style={styles.volumeBar}>
              <View
                style={[
                  styles.volumeFill,
                  { width: `${settings.bgmVolume * 100}%` },
                ]}
              />
            </View>
            <TouchableOpacity
              style={styles.volumeButton}
              onPress={() =>
                updateSettings({
                  bgmVolume: Math.min(1, settings.bgmVolume + 0.1),
                })
              }
            >
              <Text style={styles.volumeButtonText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* SE Volume */}
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>
            SE音量: {Math.round(settings.seVolume * 100)}%
          </Text>
          <View style={styles.volumeRow}>
            <TouchableOpacity
              style={styles.volumeButton}
              onPress={() =>
                updateSettings({
                  seVolume: Math.max(0, settings.seVolume - 0.1),
                })
              }
            >
              <Text style={styles.volumeButtonText}>-</Text>
            </TouchableOpacity>
            <View style={styles.volumeBar}>
              <View
                style={[
                  styles.volumeFill,
                  { width: `${settings.seVolume * 100}%` },
                ]}
              />
            </View>
            <TouchableOpacity
              style={styles.volumeButton}
              onPress={() =>
                updateSettings({
                  seVolume: Math.min(1, settings.seVolume + 0.1),
                })
              }
            >
              <Text style={styles.volumeButtonText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Haptics Toggle */}
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>バイブレーション</Text>
          <Switch
            value={settings.hapticsEnabled}
            onValueChange={(v) => updateSettings({ hapticsEnabled: v })}
            trackColor={{ false: "#CCCCCC", true: COLORS.secondary }}
          />
        </View>

        {/* Guide Toggle */}
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>落下ガイド表示</Text>
          <Switch
            value={settings.showGuide}
            onValueChange={(v) => updateSettings({ showGuide: v })}
            trackColor={{ false: "#CCCCCC", true: COLORS.secondary }}
          />
        </View>

        {/* Separator */}
        <View style={styles.separator} />

        {/* Reset */}
        <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
          <Text style={styles.resetButtonText}>スコアリセット</Text>
        </TouchableOpacity>

        {/* Info */}
        <View style={styles.separator} />
        <Text style={styles.infoText}>利用規約</Text>
        <Text style={styles.infoText}>プライバシーポリシー</Text>
        <Text style={styles.infoText}>ライセンス</Text>
        <Text style={styles.versionText}>バージョン 1.0.0</Text>
      </View>
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
  content: {
    padding: 20,
  },
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  settingLabel: {
    fontSize: 16,
    color: COLORS.text,
    flex: 1,
  },
  skinSelector: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  skinCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "#00000020",
  },
  skinName: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: "bold",
  },
  changeText: {
    fontSize: 12,
    color: COLORS.secondary,
  },
  volumeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  volumeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.secondary,
    justifyContent: "center",
    alignItems: "center",
  },
  volumeButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
  },
  volumeBar: {
    width: 80,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#E0E0E0",
    overflow: "hidden",
  },
  volumeFill: {
    height: "100%",
    backgroundColor: COLORS.secondary,
    borderRadius: 4,
  },
  separator: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 16,
  },
  resetButton: {
    backgroundColor: COLORS.danger,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  resetButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  infoText: {
    fontSize: 14,
    color: COLORS.textLight,
    paddingVertical: 8,
  },
  versionText: {
    fontSize: 12,
    color: "#AAAAAA",
    marginTop: 8,
  },
});
