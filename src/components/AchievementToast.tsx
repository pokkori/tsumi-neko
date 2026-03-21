import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import { Achievement } from "../types";

interface AchievementToastProps {
  achievement: Achievement | null;
}

export const AchievementToast: React.FC<AchievementToastProps> = ({ achievement }) => {
  const translateY = React.useRef(new Animated.Value(-100)).current;
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (achievement) {
      setVisible(true);
      translateY.setValue(-100);

      Animated.sequence([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.delay(3000),
        Animated.timing(translateY, {
          toValue: -100,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => setVisible(false));
    }
  }, [achievement]);

  if (!visible || !achievement) return null;

  return (
    <Animated.View style={[styles.container, { transform: [{ translateY }] }]}>
      <Text style={styles.title}>🏆 実績解除!</Text>
      <Text style={styles.name}>
        {achievement.icon} {achievement.name}
      </Text>
      <Text style={styles.reward}>+{achievement.rewardCoins} 🪙</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 50,
    left: 20,
    right: 20,
    backgroundColor: "rgba(0,0,0,0.85)",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    zIndex: 100,
    borderWidth: 2,
    borderColor: "#FFD700",
  },
  title: {
    color: "#FFD700",
    fontSize: 14,
    fontWeight: "bold",
  },
  name: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 4,
  },
  reward: {
    color: "#FFD700",
    fontSize: 14,
    marginTop: 4,
  },
});
