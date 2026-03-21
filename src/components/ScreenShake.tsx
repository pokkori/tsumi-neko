import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, ViewStyle } from "react-native";
import { MergeEvent } from "../types";

interface ScreenShakeProps {
  mergeEvent: MergeEvent | null;
  children: React.ReactNode;
  style?: ViewStyle;
}

export const ScreenShake: React.FC<ScreenShakeProps> = ({
  mergeEvent,
  children,
  style,
}) => {
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const lastTimestamp = useRef(0);

  useEffect(() => {
    if (!mergeEvent || mergeEvent.timestamp === lastTimestamp.current) return;
    lastTimestamp.current = mergeEvent.timestamp;

    // Shake intensity scales with evolution index
    const intensity = Math.min(1 + mergeEvent.evolutionIndex * 0.5, 5);

    Animated.parallel([
      Animated.sequence([
        Animated.timing(translateX, {
          toValue: intensity * 5,
          duration: 25,
          useNativeDriver: true,
        }),
        Animated.timing(translateX, {
          toValue: -intensity * 5,
          duration: 25,
          useNativeDriver: true,
        }),
        Animated.timing(translateX, {
          toValue: intensity * 3,
          duration: 25,
          useNativeDriver: true,
        }),
        Animated.timing(translateX, {
          toValue: -intensity * 3,
          duration: 25,
          useNativeDriver: true,
        }),
        Animated.timing(translateX, {
          toValue: 0,
          duration: 25,
          useNativeDriver: true,
        }),
      ]),
      Animated.sequence([
        Animated.timing(translateY, {
          toValue: intensity * 2,
          duration: 30,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: -intensity * 2,
          duration: 30,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: intensity,
          duration: 30,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 35,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [mergeEvent?.timestamp]);

  return (
    <Animated.View
      style={[
        styles.container,
        style,
        {
          transform: [{ translateX }, { translateY }],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
