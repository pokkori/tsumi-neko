import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import Svg, { Path, Rect, Circle } from "react-native-svg";
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
      <View style={{flexDirection:'row', alignItems:'center', gap:6, justifyContent:'center'}}>
        <Svg width={18} height={18} viewBox="0 0 28 28">
          <Path d="M5,2 L23,2 L23,14 Q23,22 14,24 Q5,22 5,14 Z" stroke="#ffd700" strokeWidth="2" fill="rgba(255,215,0,0.2)"/>
          <Path d="M5,7 L2,7 L2,12 Q2,16 5,16" stroke="#ffd700" strokeWidth="1.5" fill="none"/>
          <Path d="M23,7 L26,7 L26,12 Q26,16 23,16" stroke="#ffd700" strokeWidth="1.5" fill="none"/>
          <Rect x="10" y="22" width="8" height="4" rx="1" fill="#ffd700"/>
        </Svg>
        <Text style={styles.title}>実績解除!</Text>
      </View>
      <Text style={styles.name}>
        {achievement.name}
      </Text>
      <View style={{flexDirection:'row', alignItems:'center', gap:4, justifyContent:'center'}}>
        <Text style={styles.reward}>+{achievement.rewardCoins}</Text>
        <Svg width={14} height={14} viewBox="0 0 20 20">
          <Circle cx="10" cy="10" r="8" fill="#ffd700" stroke="#e0a000" strokeWidth="1.5"/>
        </Svg>
      </View>
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
