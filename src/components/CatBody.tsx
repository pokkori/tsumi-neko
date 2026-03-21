import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { ActiveCat, FaceExpression, CatShapeId } from "../types";
import { CAT_SHAPES } from "../data/catShapes";
import { CAT_SKINS } from "../data/catSkins";

// Evolution stage index (0=tiny -> 9=chunky)
const EVOLUTION_STAGE: Record<CatShapeId, number> = {
  tiny: 0,
  round: 1,
  long: 2,
  flat: 3,
  loaf: 4,
  triangle: 5,
  curled: 6,
  fat: 7,
  stretchy: 8,
  chunky: 9,
};

// Stage-based body color overlay (blended with skin color)
const STAGE_ACCENT_COLORS: Record<number, string> = {
  0: "#FFB6C1", // pink
  1: "#FFA07A", // light salmon
  2: "#FFD700", // gold
  3: "#98FB98", // pale green
  4: "#DEB887", // burlywood
  5: "#87CEEB", // sky blue
  6: "#DDA0DD", // plum
  7: "#FF6347", // tomato
  8: "#F0E68C", // khaki gold
  9: "#FF69B4", // hot pink (rainbow aura)
};

// Stage-based border/accent color for differentiation
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

interface CatBodyProps {
  cat: ActiveCat;
  cameraY: number;
}

export const CatBody: React.FC<CatBodyProps> = React.memo(({ cat, cameraY }) => {
  const shape = CAT_SHAPES.find((s) => s.id === cat.shapeId);
  const skin = CAT_SKINS.find((s) => s.id === cat.skinId);
  if (!shape || !skin) return null;

  const stage = EVOLUTION_STAGE[cat.shapeId] ?? 0;
  const w = shape.width;
  const h = shape.height;

  // Eye size scales with stage (bigger = cuter at higher stages)
  const eyeSize = 6 + stage * 0.8;
  const eyeGap = 4 + stage * 0.5;

  // Border width increases slightly with stage
  const borderWidth = 2 + Math.floor(stage / 3);
  const borderColor = STAGE_BORDER_COLORS[stage] || "#00000020";

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
      {/* Rainbow Aura for Stage 10 (chunky) */}
      {stage === 9 && <RainbowAura width={w} height={h} />}

      {/* Halo for Stage 7 (curled) */}
      {stage === 6 && <Halo width={w} />}

      {/* Crown for Stage 6 (triangle - おすわりネコ) */}
      {stage === 5 && <Crown width={w} />}

      {/* Body */}
      <View
        style={[
          styles.body,
          {
            width: w,
            height: h,
            borderRadius: shape.id === "flat" || shape.id === "stretchy" ? h / 3 : w / 3,
            backgroundColor: skin.bodyColor,
            borderWidth,
            borderColor,
          },
        ]}
      >
        {/* Ears - scale with stage */}
        <View
          style={[
            styles.earLeft,
            {
              borderBottomColor: skin.earColor,
              borderLeftWidth: 6 + stage * 0.5,
              borderRightWidth: 6 + stage * 0.5,
              borderBottomWidth: 10 + stage * 1,
              top: -(6 + stage * 0.5),
            },
          ]}
        />
        <View
          style={[
            styles.earRight,
            {
              borderBottomColor: skin.earColor,
              borderLeftWidth: 6 + stage * 0.5,
              borderRightWidth: 6 + stage * 0.5,
              borderBottomWidth: 10 + stage * 1,
              top: -(6 + stage * 0.5),
            },
          ]}
        />

        {/* Cape for Stage 9 (マント) */}
        {stage === 8 && <Cape width={w} height={h} />}

        {/* Face */}
        <View style={[styles.face, { gap: eyeGap }]}>
          <View
            style={[
              styles.eye,
              {
                width: eyeSize,
                height: eyeSize + 2,
                borderRadius: (eyeSize + 2) / 2,
                backgroundColor: skin.eyeColor,
              },
            ]}
          >
            {/* Eye sparkle for stage >= 4 */}
            {stage >= 4 && (
              <View
                style={{
                  position: "absolute",
                  top: 1,
                  right: 1,
                  width: eyeSize * 0.3,
                  height: eyeSize * 0.3,
                  borderRadius: eyeSize * 0.15,
                  backgroundColor: "#FFFFFF",
                }}
              />
            )}
          </View>
          <View
            style={[
              styles.nose,
              {
                backgroundColor: skin.noseColor,
                width: 4 + stage * 0.3,
                height: 3 + stage * 0.2,
              },
            ]}
          />
          <View
            style={[
              styles.eye,
              {
                width: eyeSize,
                height: eyeSize + 2,
                borderRadius: (eyeSize + 2) / 2,
                backgroundColor: skin.eyeColor,
              },
            ]}
          >
            {stage >= 4 && (
              <View
                style={{
                  position: "absolute",
                  top: 1,
                  right: 1,
                  width: eyeSize * 0.3,
                  height: eyeSize * 0.3,
                  borderRadius: eyeSize * 0.15,
                  backgroundColor: "#FFFFFF",
                }}
              />
            )}
          </View>
        </View>

        {/* Mouth for stage >= 3 */}
        {stage >= 3 && (
          <View
            style={{
              width: 6 + stage * 0.5,
              height: 3,
              borderBottomLeftRadius: 4,
              borderBottomRightRadius: 4,
              borderBottomWidth: 1.5,
              borderLeftWidth: 0.5,
              borderRightWidth: 0.5,
              borderColor: skin.noseColor,
              marginTop: 1,
            }}
          />
        )}

        {/* Whiskers for stage >= 2 */}
        {stage >= 2 && <Whiskers stage={stage} />}

        {/* Accessory: Ribbon (Stage 3) */}
        {stage === 2 && <Ribbon />}

        {/* Accessory: Bell (Stage 4) */}
        {stage === 3 && <Bell />}

        {/* Accessory: Scarf (Stage 5) */}
        {stage === 4 && <Scarf width={w} />}

        {/* Accessory: Bowtie (Stage 8) */}
        {stage === 7 && <Bowtie />}

        {/* Expression overlay */}
        <View style={styles.expressionContainer}>
          <ExpressionIndicator expression={cat.expression} stage={stage} />
        </View>
      </View>
    </View>
  );
});

// ============= Accessories =============

const RainbowAura: React.FC<{ width: number; height: number }> = ({ width, height }) => (
  <View
    style={{
      position: "absolute",
      left: -8,
      top: -8,
      width: width + 16,
      height: height + 16,
      borderRadius: (width + 16) / 3,
      borderWidth: 3,
      borderColor: "rgba(255,215,0,0.6)",
      backgroundColor: "rgba(255,255,200,0.15)",
      zIndex: -1,
    }}
  >
    {/* Sparkle dots */}
    <View style={{ position: "absolute", top: -4, left: width * 0.3, width: 5, height: 5, borderRadius: 2.5, backgroundColor: "#FFD700" }} />
    <View style={{ position: "absolute", top: height * 0.2, right: -4, width: 4, height: 4, borderRadius: 2, backgroundColor: "#FF69B4" }} />
    <View style={{ position: "absolute", bottom: -3, left: width * 0.5, width: 4, height: 4, borderRadius: 2, backgroundColor: "#87CEEB" }} />
    <View style={{ position: "absolute", top: height * 0.5, left: -4, width: 3, height: 3, borderRadius: 1.5, backgroundColor: "#98FB98" }} />
  </View>
);

const Halo: React.FC<{ width: number }> = ({ width }) => (
  <View
    style={{
      position: "absolute",
      top: -14,
      alignSelf: "center",
      width: width * 0.5,
      height: 8,
      borderRadius: 4,
      borderWidth: 2,
      borderColor: "#FFD700",
      backgroundColor: "rgba(255,215,0,0.3)",
      zIndex: 5,
      left: width * 0.25,
    }}
  />
);

const Crown: React.FC<{ width: number }> = ({ width }) => (
  <View
    style={{
      position: "absolute",
      top: -16,
      left: width * 0.2,
      width: width * 0.6,
      height: 14,
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "flex-end",
      zIndex: 5,
    }}
  >
    <View style={crownStyles.point} />
    <View style={[crownStyles.point, { height: 12 }]} />
    <View style={crownStyles.point} />
    <View
      style={{
        position: "absolute",
        bottom: 0,
        width: "100%",
        height: 4,
        backgroundColor: "#FFD700",
        borderRadius: 1,
      }}
    />
  </View>
);

const crownStyles = StyleSheet.create({
  point: {
    width: 0,
    height: 9,
    borderLeftWidth: 4,
    borderRightWidth: 4,
    borderBottomWidth: 8,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderBottomColor: "#FFD700",
    marginHorizontal: 1,
  },
});

const Ribbon: React.FC = () => (
  <View
    style={{
      position: "absolute",
      bottom: 6,
      left: 6,
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: "#FF69B4",
      borderWidth: 1,
      borderColor: "#FF1493",
    }}
  />
);

const Bell: React.FC = () => (
  <View
    style={{
      position: "absolute",
      bottom: 4,
      alignSelf: "center",
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: "#FFD700",
      borderWidth: 1,
      borderColor: "#DAA520",
    }}
  >
    <View
      style={{
        position: "absolute",
        bottom: 1,
        alignSelf: "center",
        width: 3,
        height: 3,
        borderRadius: 1.5,
        backgroundColor: "#B8860B",
      }}
    />
  </View>
);

const Scarf: React.FC<{ width: number }> = ({ width }) => (
  <View
    style={{
      position: "absolute",
      bottom: 2,
      left: 0,
      right: 0,
      height: 6,
      backgroundColor: "#E74C3C",
      borderRadius: 3,
      opacity: 0.8,
    }}
  />
);

const Bowtie: React.FC = () => (
  <View
    style={{
      position: "absolute",
      bottom: 4,
      alignSelf: "center",
      flexDirection: "row",
      alignItems: "center",
    }}
  >
    {/* Left wing */}
    <View
      style={{
        width: 0,
        height: 0,
        borderTopWidth: 4,
        borderBottomWidth: 4,
        borderRightWidth: 5,
        borderTopColor: "transparent",
        borderBottomColor: "transparent",
        borderRightColor: "#1A237E",
      }}
    />
    {/* Center knot */}
    <View
      style={{
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: "#283593",
      }}
    />
    {/* Right wing */}
    <View
      style={{
        width: 0,
        height: 0,
        borderTopWidth: 4,
        borderBottomWidth: 4,
        borderLeftWidth: 5,
        borderTopColor: "transparent",
        borderBottomColor: "transparent",
        borderLeftColor: "#1A237E",
      }}
    />
  </View>
);

const Cape: React.FC<{ width: number; height: number }> = ({ width, height }) => (
  <View
    style={{
      position: "absolute",
      bottom: 0,
      right: -6,
      width: 14,
      height: height * 0.6,
      backgroundColor: "#8B0000",
      borderRadius: 4,
      borderWidth: 1,
      borderColor: "#B22222",
      opacity: 0.7,
      zIndex: -1,
    }}
  />
);

const Whiskers: React.FC<{ stage: number }> = ({ stage }) => {
  const len = 6 + stage * 0.5;
  const color = "rgba(0,0,0,0.2)";
  return (
    <>
      {/* Left whiskers */}
      <View
        style={{
          position: "absolute",
          left: 2,
          top: "48%",
          width: len,
          height: 1,
          backgroundColor: color,
          transform: [{ rotate: "-15deg" }],
        }}
      />
      <View
        style={{
          position: "absolute",
          left: 2,
          top: "55%",
          width: len,
          height: 1,
          backgroundColor: color,
          transform: [{ rotate: "15deg" }],
        }}
      />
      {/* Right whiskers */}
      <View
        style={{
          position: "absolute",
          right: 2,
          top: "48%",
          width: len,
          height: 1,
          backgroundColor: color,
          transform: [{ rotate: "15deg" }],
        }}
      />
      <View
        style={{
          position: "absolute",
          right: 2,
          top: "55%",
          width: len,
          height: 1,
          backgroundColor: color,
          transform: [{ rotate: "-15deg" }],
        }}
      />
    </>
  );
};

const ExpressionIndicator: React.FC<{ expression: FaceExpression; stage: number }> = ({ expression, stage }) => {
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

  // Larger expression text for higher stage cats
  const fontSize = 8 + Math.min(stage, 5) * 1;

  return (
    <Text style={[styles.markText, { fontSize }]}>{mark}</Text>
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
    overflow: "visible",
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
