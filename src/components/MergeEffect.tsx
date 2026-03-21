import React, { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import { MergeEvent, CatShapeId } from "../types";
import { CAT_SHAPES } from "../data/catShapes";

interface MergeEffectProps {
  mergeEvent: MergeEvent | null;
  cameraY: number;
}

const PARTICLE_COLORS = [
  "#FFD700", "#FF6B6B", "#4ECDC4", "#45B7D1",
  "#96CEB4", "#FFEAA7", "#DDA0DD", "#FF8C69",
  "#98D8C8", "#F7DC6F", "#BB8FCE", "#85C1E9",
];

// Evolution stage names for display
const STAGE_NAMES: Record<CatShapeId, string> = {
  tiny: "ちびネコ",
  round: "まんまるネコ",
  long: "ながながネコ",
  flat: "ぺたんこネコ",
  loaf: "食パンネコ",
  triangle: "おすわりネコ",
  curled: "まるまりネコ",
  fat: "でぶネコ",
  stretchy: "のびのびネコ",
  chunky: "ずんぐりネコ",
};

interface ParticleConfig {
  angle: number;
  speed: number;
  color: string;
  size: number;
  delay: number;
}

function generateParticles(count: number): ParticleConfig[] {
  const particles: ParticleConfig[] = [];
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
    particles.push({
      angle,
      speed: 60 + Math.random() * 80,
      color: PARTICLE_COLORS[i % PARTICLE_COLORS.length],
      size: 6 + Math.random() * 6,
      delay: Math.random() * 50,
    });
  }
  return particles;
}

const Particle: React.FC<{
  config: ParticleConfig;
  originX: number;
  originY: number;
  active: boolean;
}> = ({ config, originX, originY, active }) => {
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!active) return;

    translateX.setValue(0);
    translateY.setValue(0);
    opacity.setValue(1);
    scale.setValue(1);

    const destX = Math.cos(config.angle) * config.speed;
    const destY = Math.sin(config.angle) * config.speed;

    Animated.parallel([
      Animated.timing(translateX, {
        toValue: destX,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: destY,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 500,
        delay: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 0.2,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, [active]);

  return (
    <Animated.View
      style={{
        position: "absolute",
        left: originX - config.size / 2,
        top: originY - config.size / 2,
        width: config.size,
        height: config.size,
        borderRadius: config.size / 2,
        backgroundColor: config.color,
        opacity,
        transform: [{ translateX }, { translateY }, { scale }],
      }}
      pointerEvents="none"
    />
  );
};

export const MergeEffect: React.FC<MergeEffectProps> = ({ mergeEvent, cameraY }) => {
  const [activeEvent, setActiveEvent] = useState<MergeEvent | null>(null);
  const [particles, setParticles] = useState<ParticleConfig[]>([]);

  // Morph animation: old cats shrink in
  const morphShrinkScale = useRef(new Animated.Value(1)).current;
  const morphShrinkOpacity = useRef(new Animated.Value(1)).current;

  // Flash
  const flashAnim = useRef(new Animated.Value(0)).current;

  // New cat spring in
  const newCatScale = useRef(new Animated.Value(0)).current;
  const newCatOpacity = useRef(new Animated.Value(0)).current;

  // Text animations
  const textScale = useRef(new Animated.Value(0.3)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;

  // Bounce ring
  const bounceScale = useRef(new Animated.Value(0.5)).current;
  const bounceOpacity = useRef(new Animated.Value(0)).current;

  const lastTimestamp = useRef(0);

  useEffect(() => {
    if (!mergeEvent || mergeEvent.timestamp === lastTimestamp.current) return;
    lastTimestamp.current = mergeEvent.timestamp;
    setActiveEvent(mergeEvent);

    const isLargeCat = mergeEvent.evolutionIndex >= 6;
    const particleCount = isLargeCat ? 16 : 10;
    setParticles(generateParticles(particleCount));

    // Reset all animations
    morphShrinkScale.setValue(1);
    morphShrinkOpacity.setValue(1);
    flashAnim.setValue(0);
    newCatScale.setValue(0);
    newCatOpacity.setValue(0);
    textScale.setValue(0.3);
    textOpacity.setValue(1);
    bounceScale.setValue(0.5);
    bounceOpacity.setValue(1);

    // Phase 1: Old cats shrink to center (0-150ms)
    Animated.parallel([
      Animated.timing(morphShrinkScale, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(morphShrinkOpacity, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Phase 2: Flash (instant)
      flashAnim.setValue(isLargeCat ? 0.7 : 0.4);

      Animated.parallel([
        // Flash fade
        Animated.timing(flashAnim, {
          toValue: 0,
          duration: isLargeCat ? 400 : 250,
          useNativeDriver: true,
        }),
        // Phase 3: New cat springs in (150-450ms)
        Animated.sequence([
          Animated.delay(50),
          Animated.parallel([
            Animated.spring(newCatScale, {
              toValue: 1,
              friction: 3,
              tension: 200,
              useNativeDriver: true,
            }),
            Animated.timing(newCatOpacity, {
              toValue: 1,
              duration: 100,
              useNativeDriver: true,
            }),
          ]),
        ]),
        // Text float up
        Animated.spring(textScale, {
          toValue: 1.5,
          friction: 4,
          tension: 100,
          useNativeDriver: true,
        }),
        Animated.timing(textOpacity, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
        // Bounce ring
        Animated.spring(bounceScale, {
          toValue: 1.5,
          friction: 3,
          tension: 180,
          useNativeDriver: true,
        }),
        Animated.timing(bounceOpacity, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setActiveEvent(null);
      });
    });
  }, [mergeEvent?.timestamp]);

  if (!activeEvent) return null;

  const newShape = CAT_SHAPES.find((s) => s.id === activeEvent.toShapeId);
  const shapeName = STAGE_NAMES[activeEvent.toShapeId] || newShape?.name || "";
  const eventX = activeEvent.x;
  const eventY = activeEvent.y + cameraY;

  // Size for the morphing preview circles
  const oldSize = 20 + activeEvent.evolutionIndex * 4;
  const newSize = 24 + (activeEvent.evolutionIndex + 1) * 5;

  return (
    <>
      {/* Flash overlay */}
      <Animated.View
        style={[
          styles.flashOverlay,
          { opacity: flashAnim },
        ]}
        pointerEvents="none"
      />

      {/* Morph: old cats shrinking to center */}
      <Animated.View
        style={{
          position: "absolute",
          left: eventX - oldSize / 2 - 15,
          top: eventY - oldSize / 2,
          width: oldSize,
          height: oldSize,
          borderRadius: oldSize / 2,
          backgroundColor: "rgba(255,200,200,0.7)",
          opacity: morphShrinkOpacity,
          transform: [{ scale: morphShrinkScale }, { translateX: 15 }],
          zIndex: 28,
        }}
        pointerEvents="none"
      />
      <Animated.View
        style={{
          position: "absolute",
          left: eventX - oldSize / 2 + 15,
          top: eventY - oldSize / 2,
          width: oldSize,
          height: oldSize,
          borderRadius: oldSize / 2,
          backgroundColor: "rgba(255,200,200,0.7)",
          opacity: morphShrinkOpacity,
          transform: [{ scale: morphShrinkScale }, { translateX: -15 }],
          zIndex: 28,
        }}
        pointerEvents="none"
      />

      {/* Morph: new cat springing in */}
      <Animated.View
        style={{
          position: "absolute",
          left: eventX - newSize / 2,
          top: eventY - newSize / 2,
          width: newSize,
          height: newSize,
          borderRadius: newSize / 2,
          backgroundColor: "rgba(255,255,150,0.6)",
          borderWidth: 2,
          borderColor: "rgba(255,215,0,0.8)",
          opacity: newCatOpacity,
          transform: [{ scale: newCatScale }],
          zIndex: 28,
        }}
        pointerEvents="none"
      />

      {/* Particles */}
      {particles.map((p, i) => (
        <Particle
          key={`${activeEvent.timestamp}-${i}`}
          config={p}
          originX={eventX}
          originY={eventY}
          active={true}
        />
      ))}

      {/* Bounce scale ring */}
      <Animated.View
        style={[
          styles.bounceRing,
          {
            left: eventX - 40,
            top: eventY - 40,
            opacity: bounceOpacity,
            transform: [{ scale: bounceScale }],
          },
        ]}
        pointerEvents="none"
      />

      {/* Evolution text with arrow */}
      <Animated.View
        style={[
          styles.textContainer,
          {
            left: eventX - 90,
            top: eventY - 85,
            opacity: textOpacity,
            transform: [{ scale: textScale }],
          },
        ]}
        pointerEvents="none"
      >
        <Text style={styles.mergeText}>{"MERGE!"}</Text>
        <Text style={styles.arrowText}>{">>>"}</Text>
        <Text style={styles.shapeNameText}>{shapeName}</Text>
      </Animated.View>
    </>
  );
};

const styles = StyleSheet.create({
  flashOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,200,0.4)",
    zIndex: 25,
  },
  bounceRing: {
    position: "absolute",
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: "rgba(255,215,0,0.6)",
    backgroundColor: "rgba(255,255,200,0.2)",
    zIndex: 26,
  },
  textContainer: {
    position: "absolute",
    width: 180,
    alignItems: "center",
    zIndex: 27,
  },
  mergeText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFD700",
    textShadowColor: "rgba(0,0,0,0.8)",
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  arrowText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#FFAA00",
    textShadowColor: "rgba(0,0,0,0.6)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
    marginVertical: -2,
  },
  shapeNameText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFFFFF",
    textShadowColor: "rgba(0,0,0,0.8)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
});
