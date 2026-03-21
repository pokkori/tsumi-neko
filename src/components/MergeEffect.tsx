import React, { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import { MergeEvent } from "../types";
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
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const flashAnim = useRef(new Animated.Value(0)).current;
  const bounceScale = useRef(new Animated.Value(0)).current;
  const lastTimestamp = useRef(0);

  useEffect(() => {
    if (!mergeEvent || mergeEvent.timestamp === lastTimestamp.current) return;
    lastTimestamp.current = mergeEvent.timestamp;
    setActiveEvent(mergeEvent);

    // More particles for larger cats
    const isLargeCat = mergeEvent.evolutionIndex >= 6;
    const particleCount = isLargeCat ? 16 : 10;
    setParticles(generateParticles(particleCount));

    scaleAnim.setValue(0.3);
    opacityAnim.setValue(1);
    flashAnim.setValue(isLargeCat ? 0.6 : 0.3);
    bounceScale.setValue(0.5);

    Animated.parallel([
      // Merge text scale + fade
      Animated.spring(scaleAnim, {
        toValue: 1.5,
        friction: 4,
        tension: 100,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      // Flash overlay
      Animated.timing(flashAnim, {
        toValue: 0,
        duration: isLargeCat ? 400 : 300,
        useNativeDriver: true,
      }),
      // Bounce scale: 0.5 -> 1.3 -> 1.0 spring
      Animated.spring(bounceScale, {
        toValue: 1.0,
        friction: 3,
        tension: 180,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setActiveEvent(null);
    });
  }, [mergeEvent?.timestamp]);

  if (!activeEvent) return null;

  const newShape = CAT_SHAPES.find((s) => s.id === activeEvent.toShapeId);
  const shapeName = newShape?.name || "";
  const eventX = activeEvent.x;
  const eventY = activeEvent.y + cameraY;

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
            opacity: opacityAnim,
            transform: [{ scale: bounceScale }],
          },
        ]}
        pointerEvents="none"
      />

      {/* Evolution text */}
      <Animated.View
        style={[
          styles.textContainer,
          {
            left: eventX - 80,
            top: eventY - 80,
            opacity: opacityAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
        pointerEvents="none"
      >
        <Text style={styles.mergeText}>{"MERGE!"}</Text>
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
    width: 160,
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
  shapeNameText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#FFFFFF",
    textShadowColor: "rgba(0,0,0,0.8)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
});
