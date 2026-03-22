import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Svg, { Ellipse, Path, Rect } from "react-native-svg";
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
        <View style={{flexDirection:'row', alignItems:'center', gap:3}}>
          <Svg width={14} height={14} viewBox="0 0 60 60">
            <Path d="M16,18 L10,6 L22,14 Z" fill="#FF6644"/>
            <Path d="M44,18 L50,6 L38,14 Z" fill="#FF6644"/>
            <Ellipse cx="30" cy="34" rx="20" ry="18" fill="#FF9966"/>
            <Ellipse cx="22" cy="29" rx="3" ry="3.5" fill="#1a1a2e"/>
            <Ellipse cx="38" cy="29" rx="3" ry="3.5" fill="#1a1a2e"/>
          </Svg>
          <Text style={styles.label}>x{catCount}</Text>
        </View>
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
          <View style={{flexDirection:'row', alignItems:'center', gap:4}}>
            <Svg width={14} height={14} viewBox="0 0 28 28">
              <Path d="M5,2 L23,2 L23,14 Q23,22 14,24 Q5,22 5,14 Z" stroke="#ffd700" strokeWidth="1.5" fill="rgba(255,215,0,0.2)"/>
              <Path d="M5,7 L2,7 L2,12 Q2,16 5,16" stroke="#ffd700" strokeWidth="1.5" fill="none"/>
              <Path d="M23,7 L26,7 L26,12 Q26,16 23,16" stroke="#ffd700" strokeWidth="1.5" fill="none"/>
              <Rect x="10" y="22" width="8" height="4" rx="1" fill="#ffd700"/>
            </Svg>
            <Text style={[styles.bestLabel, { color: "#FFD700" }]}>NEW RECORD!</Text>
          </View>
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
