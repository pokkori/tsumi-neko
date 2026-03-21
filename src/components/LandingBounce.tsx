import React, { useEffect, useRef, useState } from "react";
import { Animated, StyleSheet } from "react-native";
import { LandingEvent } from "../types";

interface LandingBounceProps {
  landingEvents: LandingEvent[];
  cameraY: number;
}

const LandingRipple: React.FC<{
  event: LandingEvent;
  cameraY: number;
}> = ({ event, cameraY }) => {
  const scale = useRef(new Animated.Value(0.3)).current;
  const opacity = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(scale, {
        toValue: 2.0,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.ripple,
        {
          left: event.x - 20,
          top: event.y + cameraY - 20,
          opacity,
          transform: [{ scale }],
        },
      ]}
      pointerEvents="none"
    />
  );
};

export const LandingBounce: React.FC<LandingBounceProps> = ({
  landingEvents,
  cameraY,
}) => {
  // Only show the most recent landing events (max 3 at a time)
  const recentEvents = landingEvents.slice(-3);

  return (
    <>
      {recentEvents.map((event) => (
        <LandingRipple
          key={`${event.bodyId}-${event.timestamp}`}
          event={event}
          cameraY={cameraY}
        />
      ))}
    </>
  );
};

const styles = StyleSheet.create({
  ripple: {
    position: "absolute",
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.5)",
    backgroundColor: "transparent",
    zIndex: 20,
  },
});
