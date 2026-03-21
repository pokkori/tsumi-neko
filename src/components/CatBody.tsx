import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { ActiveCat, FaceExpression } from "../types";
import { CAT_SHAPES } from "../data/catShapes";
import { CAT_SKINS } from "../data/catSkins";

interface CatBodyProps {
  cat: ActiveCat;
  cameraY: number;
}

export const CatBody: React.FC<CatBodyProps> = React.memo(({ cat, cameraY }) => {
  const shape = CAT_SHAPES.find((s) => s.id === cat.shapeId);
  const skin = CAT_SKINS.find((s) => s.id === cat.skinId);
  if (!shape || !skin) return null;

  const scale = shape.width / 80;
  const w = shape.width;
  const h = shape.height;

  return (
    <View
      style={[
        styles.container,
        {
          left: cat.position.x - w / 2,
          top: cat.position.y + cameraY - h / 2,
          width: w,
          height: h,
          transform: [{ rotate: `${cat.angle}rad` }],
        },
      ]}
    >
      {/* Body */}
      <View
        style={[
          styles.body,
          {
            width: w,
            height: h,
            borderRadius: shape.id === "flat" || shape.id === "stretchy" ? h / 3 : w / 3,
            backgroundColor: skin.bodyColor,
            borderWidth: 2,
            borderColor: skin.patternColor || "#00000020",
          },
        ]}
      >
        {/* Ears */}
        <View style={[styles.earLeft, { borderBottomColor: skin.earColor }]} />
        <View style={[styles.earRight, { borderBottomColor: skin.earColor }]} />
        {/* Face */}
        <View style={styles.face}>
          <View style={[styles.eye, { backgroundColor: skin.eyeColor }]} />
          <View style={[styles.nose, { backgroundColor: skin.noseColor }]} />
          <View style={[styles.eye, { backgroundColor: skin.eyeColor }]} />
        </View>
        {/* Expression overlay */}
        <View style={styles.expressionContainer}>
          <ExpressionIndicator expression={cat.expression} />
        </View>
      </View>
    </View>
  );
});

const ExpressionIndicator: React.FC<{ expression: FaceExpression }> = ({ expression }) => {
  const marks: Record<FaceExpression, string> = {
    normal: "",
    scared: "\u{1F4A7}",
    sleeping: "Zzz",
    angry: "\u{1F4A2}",
    shocked: "\u{2757}",
    love: "\u{1F495}",
    dizzy: "\u{1F4AB}",
  };
  const mark = marks[expression];
  if (!mark) return null;

  return (
    <Text style={styles.markText}>{mark}</Text>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
  },
  body: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  earLeft: {
    position: "absolute",
    top: -8,
    left: 8,
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderBottomWidth: 14,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderBottomColor: "#FFBCBC",
  },
  earRight: {
    position: "absolute",
    top: -8,
    right: 8,
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderBottomWidth: 14,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderBottomColor: "#FFBCBC",
  },
  face: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: -4,
  },
  eye: {
    width: 8,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#333",
  },
  nose: {
    width: 6,
    height: 4,
    borderRadius: 3,
    backgroundColor: "#FF8FAB",
    marginTop: 2,
  },
  expressionContainer: {
    position: "absolute",
    top: -16,
    right: -8,
  },
  markText: {
    fontSize: 10,
  },
});
