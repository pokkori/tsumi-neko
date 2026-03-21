import React from "react";
import { View, StyleSheet } from "react-native";
import { COLORS } from "../constants/colors";

interface BackgroundProps {
  heightPx: number;
}

export const Background: React.FC<BackgroundProps> = ({ heightPx }) => {
  // Transition from light sky to deeper blue as tower grows
  const progress = Math.min(1, heightPx / 1000);
  const r = Math.round(135 + (74 - 135) * progress);
  const g = Math.round(206 + (144 - 206) * progress);
  const b = Math.round(235 + (217 - 235) * progress);

  return (
    <View style={[styles.container, { backgroundColor: `rgb(${r},${g},${b})` }]}>
      {/* Ground */}
      <View style={styles.ground} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  ground: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
    backgroundColor: COLORS.ground,
    borderTopWidth: 3,
    borderTopColor: COLORS.groundDark,
  },
});
