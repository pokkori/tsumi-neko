import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { CatShapeId } from "../types";
import { CAT_SHAPES } from "../data/catShapes";

interface CatPreviewProps {
  shapeId: CatShapeId;
}

const SHAPE_EMOJI: Record<string, string> = {
  round: "🟠",
  long: "🟤",
  flat: "🟡",
  triangle: "🔺",
  fat: "🟣",
  tiny: "⚪",
  loaf: "🟫",
  curled: "🔵",
  stretchy: "🟢",
  chunky: "🟥",
};

export const CatPreview: React.FC<CatPreviewProps> = ({ shapeId }) => {
  const shape = CAT_SHAPES.find((s) => s.id === shapeId);
  if (!shape) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.label}>NEXT</Text>
      <View style={styles.preview}>
        <Text style={styles.catEmoji}>🐱</Text>
        <Text style={styles.shapeName}>{shape.name}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 100,
    right: 16,
    alignItems: "center",
    zIndex: 10,
  },
  label: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "bold",
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  preview: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 4,
  },
  catEmoji: {
    fontSize: 24,
  },
  shapeName: {
    color: "#FFFFFF",
    fontSize: 8,
    marginTop: 2,
  },
});
