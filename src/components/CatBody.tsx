import React, { useRef, useEffect } from "react";
import { View, Text, StyleSheet, Platform, Animated, Easing } from "react-native";
import { ActiveCat, FaceExpression, CatShapeId } from "../types";
import { CAT_SHAPES } from "../data/catShapes";
import { CAT_SKINS } from "../data/catSkins";

// Conditionally import SVG - only available on native/web with react-native-svg
let Svg: any = null;
let Path: any = null;
let Circle: any = null;
let Rect: any = null;
let G: any = null;
let Ellipse: any = null;
let Line: any = null;

try {
  const svgModule = require("react-native-svg");
  Svg = svgModule.Svg || svgModule.default;
  Path = svgModule.Path;
  Circle = svgModule.Circle;
  Rect = svgModule.Rect;
  G = svgModule.G;
  Ellipse = svgModule.Ellipse;
  Line = svgModule.Line;
} catch {
  // SVG not available, will fall back to View-based rendering
}

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

// Stage-based body colors
const STAGE_BODY_COLORS: Record<number, string> = {
  0: "#FFE4E1", // misty rose
  1: "#FFF8E7", // cream
  2: "#FFE4B5", // moccasin
  3: "#E8F5E9", // pale green
  4: "#D7CCC8", // warm gray
  5: "#E3F2FD", // light blue
  6: "#F3E5F5", // light purple
  7: "#FFCCBC", // light orange
  8: "#FFF9C4", // light yellow
  9: "#FCE4EC", // pink
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

// Pattern types per stage (トラ柄, 三毛, etc.)
const STAGE_PATTERNS: Record<number, string> = {
  0: "none",       // ちびネコ - plain
  1: "none",       // まんまるネコ - plain
  2: "tora",       // ながながネコ - トラ柄
  3: "mike",       // ぺたんこネコ - 三毛
  4: "tora",       // 食パンネコ - トラ柄
  5: "none",       // おすわりネコ - plain
  6: "mike",       // まるまりネコ - 三毛
  7: "tora",       // でぶネコ - トラ柄
  8: "mike",       // のびのびネコ - 三毛
  9: "none",       // ずんぐりネコ - rainbow aura instead
};

// Accessory per stage
// Stage 0: none, 1: none, 2: リボン, 3: 鈴, 4: マフラー, 5: 王冠, 6: 天使の輪, 7: 蝶ネクタイ, 8: マント, 9: 虹オーラ
const STAGE_ACCESSORY: Record<number, string> = {
  0: "none",
  1: "none",
  2: "ribbon",
  3: "bell",
  4: "scarf",
  5: "crown",
  6: "halo",
  7: "bowtie",
  8: "cape",
  9: "rainbow",
};

interface CatBodyProps {
  cat: ActiveCat;
  cameraY: number;
}

export const CatBody: React.FC<CatBodyProps> = React.memo(({ cat, cameraY }) => {
  const wobbleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(wobbleAnim, { toValue: 1, duration: 1250, useNativeDriver: true, easing: Easing.inOut(Easing.sin) }),
        Animated.timing(wobbleAnim, { toValue: -1, duration: 1250, useNativeDriver: true, easing: Easing.inOut(Easing.sin) }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, []);

  const wobbleRotate = wobbleAnim.interpolate({ inputRange: [-1, 1], outputRange: ['-3deg', '3deg'] });

  const shape = CAT_SHAPES.find((s) => s.id === cat.shapeId);
  const skin = CAT_SKINS.find((s) => s.id === cat.skinId);
  if (!shape || !skin) return null;

  const stage = EVOLUTION_STAGE[cat.shapeId] ?? 0;
  const w = shape.width;
  const h = shape.height;

  // If SVG is available, render SVG cat
  if (Svg && Path && Circle) {
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
        <Animated.View style={{ transform: [{ rotate: wobbleRotate }], width: w, height: h }}>
        <Svg width={w} height={h} viewBox={`0 0 ${w + 10} ${h + 10}`}>
          <G transform={`translate(5, 5)`}>
            {/* Rainbow Aura for stage 9 */}
            {stage === 9 && (
              <SvgRainbowAura width={w} height={h} />
            )}

            {/* Body shape from svgPath */}
            <Path
              d={shape.svgPath}
              fill={skin.bodyColor}
              stroke={STAGE_BORDER_COLORS[stage]}
              strokeWidth={2 + Math.floor(stage / 3)}
            />

            {/* Pattern overlay (トラ柄 or 三毛) */}
            {STAGE_PATTERNS[stage] === "tora" && (
              <SvgToraPattern width={w} height={h} stage={stage} />
            )}
            {STAGE_PATTERNS[stage] === "mike" && skin.patternSvg && (
              <Path
                d={skin.patternSvg}
                fill={skin.patternColor || "#D4722C"}
                opacity={0.5}
              />
            )}

            {/* Eyes */}
            <SvgEyes w={w} h={h} stage={stage} eyeColor={skin.eyeColor} />

            {/* Nose */}
            <Circle
              cx={w / 2}
              cy={h / 2 + 2}
              r={2 + stage * 0.2}
              fill={skin.noseColor}
            />

            {/* Mouth for stage >= 3 */}
            {stage >= 3 && (
              <Path
                d={`M${w / 2 - 3},${h / 2 + 4} Q${w / 2},${h / 2 + 7} ${w / 2 + 3},${h / 2 + 4}`}
                fill="none"
                stroke={skin.noseColor}
                strokeWidth={1}
              />
            )}

            {/* Whiskers for stage >= 2 */}
            {stage >= 2 && (
              <SvgWhiskers w={w} h={h} stage={stage} />
            )}

            {/* Accessories */}
            <SvgAccessory stage={stage} w={w} h={h} />
          </G>
        </Svg>
        </Animated.View>

        {/* Expression overlay (kept as Text for emoji) */}
        <View style={styles.expressionContainer}>
          <ExpressionIndicator expression={cat.expression} stage={stage} />
        </View>
      </View>
    );
  }

  // Fallback: View-based rendering (same as before)
  return <ViewBasedCatBody cat={cat} cameraY={cameraY} />;
});

// ============= SVG Sub-components =============

const SvgRainbowAura: React.FC<{ width: number; height: number }> = ({ width, height }) => (
  <>
    <Ellipse
      cx={width / 2}
      cy={height / 2}
      rx={width / 2 + 6}
      ry={height / 2 + 6}
      fill="rgba(255,255,200,0.15)"
      stroke="rgba(255,215,0,0.6)"
      strokeWidth={3}
    />
    <Circle cx={width * 0.3} cy={-2} r={2.5} fill="#FFD700" />
    <Circle cx={width + 2} cy={height * 0.3} r={2} fill="#FF69B4" />
    <Circle cx={width * 0.5} cy={height + 2} r={2} fill="#87CEEB" />
    <Circle cx={-2} cy={height * 0.5} r={1.5} fill="#98FB98" />
  </>
);

const SvgToraPattern: React.FC<{ width: number; height: number; stage: number }> = ({ width, height, stage }) => {
  const stripeCount = 3 + Math.floor(stage / 3);
  const stripes = [];
  for (let i = 0; i < stripeCount; i++) {
    const x = (width / (stripeCount + 1)) * (i + 1);
    stripes.push(
      <Line
        key={i}
        x1={x - 3}
        y1={height * 0.25}
        x2={x + 3}
        y2={height * 0.65}
        stroke="#8B4513"
        strokeWidth={2}
        opacity={0.35}
        strokeLinecap="round"
      />
    );
  }
  return <>{stripes}</>;
};

const SvgEyes: React.FC<{ w: number; h: number; stage: number; eyeColor: string }> = ({ w, h, stage, eyeColor }) => {
  const eyeSize = 3 + stage * 0.4;
  const eyeGap = 4 + stage * 0.5;
  const eyeY = h / 2 - 2;

  return (
    <>
      {/* Left eye */}
      <Ellipse
        cx={w / 2 - eyeGap}
        cy={eyeY}
        rx={eyeSize}
        ry={eyeSize + 1}
        fill={eyeColor}
      />
      {/* Left eye sparkle for stage >= 4 */}
      {stage >= 4 && (
        <Circle
          cx={w / 2 - eyeGap + eyeSize * 0.3}
          cy={eyeY - eyeSize * 0.3}
          r={eyeSize * 0.2}
          fill="#FFFFFF"
        />
      )}
      {/* Right eye */}
      <Ellipse
        cx={w / 2 + eyeGap}
        cy={eyeY}
        rx={eyeSize}
        ry={eyeSize + 1}
        fill={eyeColor}
      />
      {/* Right eye sparkle for stage >= 4 */}
      {stage >= 4 && (
        <Circle
          cx={w / 2 + eyeGap + eyeSize * 0.3}
          cy={eyeY - eyeSize * 0.3}
          r={eyeSize * 0.2}
          fill="#FFFFFF"
        />
      )}
    </>
  );
};

const SvgWhiskers: React.FC<{ w: number; h: number; stage: number }> = ({ w, h, stage }) => {
  const len = 8 + stage * 0.8;
  const cy = h / 2 + 1;
  return (
    <>
      {/* Left whiskers */}
      <Line x1={4} y1={cy - 2} x2={4 - len} y2={cy - 4} stroke="rgba(0,0,0,0.2)" strokeWidth={0.8} />
      <Line x1={4} y1={cy + 2} x2={4 - len} y2={cy + 4} stroke="rgba(0,0,0,0.2)" strokeWidth={0.8} />
      {/* Right whiskers */}
      <Line x1={w - 4} y1={cy - 2} x2={w - 4 + len} y2={cy - 4} stroke="rgba(0,0,0,0.2)" strokeWidth={0.8} />
      <Line x1={w - 4} y1={cy + 2} x2={w - 4 + len} y2={cy + 4} stroke="rgba(0,0,0,0.2)" strokeWidth={0.8} />
    </>
  );
};

const SvgAccessory: React.FC<{ stage: number; w: number; h: number }> = ({ stage, w, h }) => {
  const accessory = STAGE_ACCESSORY[stage];
  if (!accessory || accessory === "none") return null;

  switch (accessory) {
    case "ribbon":
      return (
        <Circle
          cx={w * 0.2}
          cy={h * 0.7}
          r={4}
          fill="#FF69B4"
          stroke="#FF1493"
          strokeWidth={1}
        />
      );
    case "bell":
      return (
        <>
          <Circle cx={w / 2} cy={h * 0.8} r={5} fill="#FFD700" stroke="#DAA520" strokeWidth={1} />
          <Circle cx={w / 2} cy={h * 0.8 + 2} r={1.5} fill="#B8860B" />
        </>
      );
    case "scarf":
      return (
        <Rect
          x={2}
          y={h * 0.85}
          width={w - 4}
          height={5}
          rx={2.5}
          fill="#E74C3C"
          opacity={0.8}
        />
      );
    case "crown":
      return (
        <Path
          d={`M${w * 0.25},-4 L${w * 0.35},-14 L${w * 0.45},-6 L${w * 0.55},-16 L${w * 0.65},-6 L${w * 0.75},-14 L${w * 0.8},-4 Z`}
          fill="#FFD700"
          stroke="#DAA520"
          strokeWidth={1}
        />
      );
    case "halo":
      return (
        <Ellipse
          cx={w / 2}
          cy={-6}
          rx={w * 0.22}
          ry={4}
          fill="rgba(255,215,0,0.3)"
          stroke="#FFD700"
          strokeWidth={2}
        />
      );
    case "bowtie":
      return (
        <Path
          d={`M${w / 2 - 8},${h * 0.8} L${w / 2 - 3},${h * 0.8 - 4} L${w / 2 - 3},${h * 0.8 + 4} Z M${w / 2 + 8},${h * 0.8} L${w / 2 + 3},${h * 0.8 - 4} L${w / 2 + 3},${h * 0.8 + 4} Z`}
          fill="#1A237E"
        />
      );
    case "cape":
      return (
        <Rect
          x={w - 4}
          y={h * 0.3}
          width={10}
          height={h * 0.5}
          rx={3}
          fill="#8B0000"
          stroke="#B22222"
          strokeWidth={1}
          opacity={0.7}
        />
      );
    case "rainbow":
      // Rainbow aura is handled separately above
      return null;
    default:
      return null;
  }
};

// ============= Fallback View-based rendering =============

const ViewBasedCatBody: React.FC<CatBodyProps> = ({ cat, cameraY }) => {
  const shape = CAT_SHAPES.find((s) => s.id === cat.shapeId);
  const skin = CAT_SKINS.find((s) => s.id === cat.skinId);
  if (!shape || !skin) return null;

  const stage = EVOLUTION_STAGE[cat.shapeId] ?? 0;
  const w = shape.width;
  const h = shape.height;
  const eyeSize = 6 + stage * 0.8;
  const eyeGap = 4 + stage * 0.5;
  const borderWidth = 2 + Math.floor(stage / 3);
  const borderColor = STAGE_BORDER_COLORS[stage] || "#00000020";

  // Tier-based borderRadius coefficients (設計書R5仕様)
  const tier = stage + 1; // tier1=stage0 ... tier10=stage9
  const borderRadiusCoeff =
    tier <= 1 ? 0.5 :
    tier === 2 ? 0.45 :
    tier === 3 ? 0.4 :
    tier === 4 ? 0.35 :
    0.3;
  const bodyBorderRadius = w * borderRadiusCoeff;

  // Tier-based ear size (設計書R5仕様)
  const earHeight = w * (0.3 + tier * 0.05);
  const earWidth = w * (0.2 + tier * 0.03);

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
      {/* Ears */}
      <View style={[styles.earLeft, { width: earWidth, height: earHeight, borderBottomLeftRadius: earWidth / 2, borderBottomRightRadius: earWidth / 2, backgroundColor: skin.bodyColor, borderColor, borderWidth: borderWidth - 1 > 0 ? borderWidth - 1 : 1 }]} />
      <View style={[styles.earRight, { width: earWidth, height: earHeight, borderBottomLeftRadius: earWidth / 2, borderBottomRightRadius: earWidth / 2, backgroundColor: skin.bodyColor, borderColor, borderWidth: borderWidth - 1 > 0 ? borderWidth - 1 : 1 }]} />
      <View
        style={[
          styles.body,
          {
            width: w,
            height: h,
            borderRadius: bodyBorderRadius,
            backgroundColor: skin.bodyColor,
            borderWidth,
            borderColor,
          },
        ]}
      >
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
          />
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
          />
        </View>
        <View style={styles.expressionContainer}>
          <ExpressionIndicator expression={cat.expression} stage={stage} />
        </View>
      </View>
    </View>
  );
};

// ============= Expression =============

const ExpressionIndicator: React.FC<{ expression: FaceExpression; stage: number }> = ({ expression, stage }) => {
  const sz = 8 + Math.min(stage, 5);
  if (expression === 'normal') return null;
  return (
    <Svg width={sz + 4} height={sz + 4} viewBox="0 0 20 20" style={{ overflow: 'visible' }}>
      {expression === 'scared' && (
        <Path d="M10,2 Q14,8 14,12 Q14,17 10,17 Q6,17 6,12 Q6,8 10,2 Z" fill="#88CCFF" opacity="0.9"/>
      )}
      {expression === 'sleeping' && (
        <>
          <Path d="M4,14 L10,14 L4,8 L10,8" stroke="#AAAAFF" strokeWidth="1.8" fill="none" strokeLinecap="round"/>
          <Path d="M8,10 L12,10 L8,6 L12,6" stroke="#AAAAFF" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
        </>
      )}
      {expression === 'angry' && (
        <>
          <Path d="M10,4 L10,9" stroke="#FF4444" strokeWidth="2" strokeLinecap="round"/>
          <Path d="M7.5,6.5 L12.5,6.5" stroke="#FF4444" strokeWidth="2" strokeLinecap="round"/>
          <Circle cx="10" cy="13" r="3" fill="#FF4444" opacity="0.6"/>
        </>
      )}
      {expression === 'shocked' && (
        <Path d="M10,3 L10,12 M10,15 L10,17" stroke="#FFFF00" strokeWidth="2.5" strokeLinecap="round"/>
      )}
      {expression === 'love' && (
        <Path d="M10,16 Q4,11 4,7 Q4,3 8,3 Q10,5 10,5 Q10,5 12,3 Q16,3 16,7 Q16,11 10,16 Z" fill="#FF88AA"/>
      )}
      {expression === 'dizzy' && (
        <Path d="M10,10 Q14,6 14,10 Q14,14 10,14 Q6,14 6,10 Q6,6 10,6" stroke="#FFAA44" strokeWidth="1.5" fill="none"/>
      )}
    </Svg>
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
  earLeft: {
    position: "absolute",
    top: -10,
    left: 4,
  },
  earRight: {
    position: "absolute",
    top: -10,
    right: 4,
  },
});
