import React, { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import { MergeEvent } from "../types";
import { CAT_SHAPES } from "../data/catShapes";

interface MergeEffectProps {
  mergeEvent: MergeEvent | null;
  cameraY: number;
}

export const MergeEffect: React.FC<MergeEffectProps> = ({ mergeEvent, cameraY }) => {
  const [activeEvent, setActiveEvent] = useState<MergeEvent | null>(null);
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const flashAnim = useRef(new Animated.Value(0)).current;
  const lastTimestamp = useRef(0);

  useEffect(() => {
    if (!mergeEvent || mergeEvent.timestamp === lastTimestamp.current) return;
    lastTimestamp.current = mergeEvent.timestamp;
    setActiveEvent(mergeEvent);

    scaleAnim.setValue(0.3);
    opacityAnim.setValue(1);
    flashAnim.setValue(1);

    Animated.parallel([
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
      Animated.timing(flashAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setActiveEvent(null);
    });
  }, [mergeEvent?.timestamp]);

  if (!activeEvent) return null;

  const newShape = CAT_SHAPES.find((s) => s.id === activeEvent.toShapeId);
  const shapeName = newShape?.name || "";

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

      {/* Merge particles / burst */}
      <Animated.View
        style={[
          styles.burstContainer,
          {
            left: activeEvent.x - 50,
            top: activeEvent.y + cameraY - 50,
            opacity: opacityAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
        pointerEvents="none"
      >
        <Text style={styles.burstEmoji}>{"✨"}</Text>
      </Animated.View>

      {/* Evolution text */}
      <Animated.View
        style={[
          styles.textContainer,
          {
            left: activeEvent.x - 80,
            top: activeEvent.y + cameraY - 80,
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
  burstContainer: {
    position: "absolute",
    width: 100,
    height: 100,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 26,
  },
  burstEmoji: {
    fontSize: 48,
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
