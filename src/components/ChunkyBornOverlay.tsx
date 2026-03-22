import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated, Dimensions } from "react-native";

const { width: SW, height: SH } = Dimensions.get("window");

const STAR_CONFIGS = Array.from({ length: 20 }, (_, i) => ({
  x: (i * 137.5) % SW,
  y: (i * 83.7) % (SH * 0.7),
  delay: i * 60,
  size: 8 + (i % 3) * 6,
  emoji: ["⭐", "✨", "🌟", "💫"][i % 4],
}));

interface ChunkyBornOverlayProps {
  visible: boolean;
  onComplete: () => void;
}

export const ChunkyBornOverlay: React.FC<ChunkyBornOverlayProps> = ({ visible, onComplete }) => {
  const bgOpacity = useRef(new Animated.Value(0)).current;
  const crownScale = useRef(new Animated.Value(0)).current;
  const textTranslateY = useRef(new Animated.Value(60)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const overlayOpacity = useRef(new Animated.Value(1)).current;
  const starOpacities = useRef(STAR_CONFIGS.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    if (!visible) {
      bgOpacity.setValue(0);
      crownScale.setValue(0);
      textTranslateY.setValue(60);
      textOpacity.setValue(0);
      overlayOpacity.setValue(1);
      starOpacities.forEach(a => a.setValue(0));
      return;
    }

    Animated.timing(bgOpacity, {
      toValue: 0.85,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      Animated.spring(crownScale, {
        toValue: 1,
        friction: 3,
        tension: 150,
        useNativeDriver: true,
      }).start();

      Animated.parallel([
        Animated.timing(textTranslateY, { toValue: 0, duration: 500, useNativeDriver: true }),
        Animated.timing(textOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      ]).start();

      const starAnimations = starOpacities.map((anim, i) =>
        Animated.sequence([
          Animated.delay(STAR_CONFIGS[i].delay),
          Animated.timing(anim, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0, duration: 600, useNativeDriver: true }),
        ])
      );
      Animated.stagger(60, starAnimations).start();

      Animated.sequence([
        Animated.delay(1800),
        Animated.timing(overlayOpacity, { toValue: 0, duration: 700, useNativeDriver: true }),
      ]).start(() => {
        onComplete();
      });
    });
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View
      style={[styles.container, { opacity: overlayOpacity }]}
      pointerEvents="none"
    >
      <Animated.View style={[styles.bg, { opacity: bgOpacity }]} />

      {STAR_CONFIGS.map((cfg, i) => (
        <Animated.Text
          key={i}
          style={{
            position: "absolute",
            left: cfg.x,
            top: cfg.y,
            fontSize: cfg.size,
            opacity: starOpacities[i],
            zIndex: 51,
          }}
          pointerEvents="none"
        >
          {cfg.emoji}
        </Animated.Text>
      ))}

      <Animated.View style={[styles.center, { transform: [{ scale: crownScale }] }]}>
        <Text style={styles.crownEmoji}>👑</Text>
        <Text style={styles.catEmoji}>🐱</Text>
      </Animated.View>

      <Animated.View
        style={[
          styles.textContainer,
          {
            opacity: textOpacity,
            transform: [{ translateY: textTranslateY }],
          },
        ]}
      >
        <Text style={styles.titleText}>ずんぐりネコ誕生！</Text>
        <Text style={styles.subtitleText}>最高進化達成🎉</Text>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 50,
  },
  bg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#000000",
    zIndex: 50,
  },
  center: {
    alignItems: "center",
    zIndex: 52,
  },
  crownEmoji: {
    fontSize: 80,
    textAlign: "center",
  },
  catEmoji: {
    fontSize: 64,
    textAlign: "center",
    marginTop: -8,
  },
  textContainer: {
    position: "absolute",
    bottom: "25%",
    alignItems: "center",
    zIndex: 52,
  },
  titleText: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#FFD700",
    textShadowColor: "rgba(0,0,0,0.9)",
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 6,
    textAlign: "center",
  },
  subtitleText: {
    fontSize: 20,
    color: "#FFFFFF",
    textShadowColor: "rgba(0,0,0,0.8)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 4,
    marginTop: 8,
  },
});
