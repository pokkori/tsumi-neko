import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { formatScore, formatHeight } from "../utils/format";

interface ScoreDisplayProps {
  score: number;
  height: number;
  catCount: number;
  combo: number;
  bestScore?: number;
}

function getComboColor(combo: number): string {
  if (combo < 3) return "#FFFFFF";
  if (combo < 5) return "#FFD700";
  if (combo < 10) return "#FF6B6B";
  if (combo < 20) return "#FF00FF";
  return "#00FFFF";
}

export const ScoreDisplay: React.FC<ScoreDisplayProps> = ({
  score,
  height,
  catCount,
  combo,
  bestScore = 0,
}) => {
  const isNewRecord = score > 0 && score >= bestScore;
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
      <View style={styles.row}>
        {isNewRecord ? (
          <Text style={[styles.bestLabel, { color: "#FFD700" }]}>🏆 NEW RECORD!</Text>
        ) : (
          <Text style={styles.bestLabel}>Best: {formatScore(bestScore)}</Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 8,
    left: 8,
    right: 8,
    zIndex: 10,
    backgroundColor: "rgba(0,0,0,0.45)",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 2,
  },
  label: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "bold",
    textShadowColor: "rgba(0,0,0,0.7)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  combo: {
    fontSize: 14,
    fontWeight: "bold",
    textShadowColor: "rgba(0,0,0,0.7)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  bestLabel: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 13,
    fontWeight: "bold",
    textShadowColor: "rgba(0,0,0,0.7)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
});
