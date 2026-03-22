import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";

interface Particle {
  id: number;
  angle: number;
  color: string;
}

const PARTICLE_COLORS = ["#FFD700", "#FF6B6B", "#87CEEB", "#98FB98", "#FFB6C1"];

const PARTICLES: Particle[] = Array.from({ length: 5 }, (_, i) => ({
  id: i,
  angle: (i * 360) / 5,
  color: PARTICLE_COLORS[i],
}));

interface ParticleViewProps {
  angle: number;
  color: string;
}

const ParticleView: React.FC<ParticleViewProps> = ({ angle, color }) => {
  const scale = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const translate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1.5,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(translate, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const rad = (angle * Math.PI) / 180;
  const dx = Math.cos(rad) * 18;
  const dy = Math.sin(rad) * 18;

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          backgroundColor: color,
          opacity,
          transform: [
            { scale },
            {
              translateX: translate.interpolate({
                inputRange: [0, 1],
                outputRange: [0, dx],
              }),
            },
            {
              translateY: translate.interpolate({
                inputRange: [0, 1],
                outputRange: [0, dy],
              }),
            },
          ],
        },
      ]}
    />
  );
};

interface LandingEffectProps {
  x: number;
  y: number;
}

export const LandingEffect: React.FC<LandingEffectProps> = ({ x, y }) => {
  return (
    <View
      style={[styles.container, { left: x, top: y }]}
      pointerEvents="none"
    >
      {PARTICLES.map((p) => (
        <ParticleView key={p.id} angle={p.angle} color={p.color} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    width: 0,
    height: 0,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 25,
  },
  particle: {
    position: "absolute",
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
