import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { formatScore, formatHeight } from "../utils/format";

interface ScoreDisplayProps {
  score: number;
  height: number;
  catCount: number;
  combo: number;
}

export const ScoreDisplay: React.FC<ScoreDisplayProps> = ({
  score,
  height,
  catCount,
  combo,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Text style={styles.label}>Score: {formatScore(score)}</Text>
        <Text style={styles.label}>🐱x{catCount}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>Height: {formatHeight(height)}</Text>
        {combo >= 2 && (
          <Text style={[styles.combo, { color: getComboColor(combo) }]}>
            Combo: x{combo}
          </Text>
        )}
      </View>
    </View>
  );
};

function getComboColor(combo: number): string {
  if (combo < 3) return "#FFFFFF";
  if (combo < 5) return "#FFD700";
  if (combo < 10) return "#FF6B6B";
  if (combo < 20) return "#FF00FF";
  return "#00FFFF";
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 50,
    left: 16,
    right: 16,
    zIndex: 10,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 2,
  },
  label: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
    textShadowColor: "rgba(0,0,0,0.7)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  combo: {
    fontSize: 18,
    fontWeight: "bold",
    textShadowColor: "rgba(0,0,0,0.7)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
});
