import React from "react";
import { View, Text, StyleSheet } from "react-native";

interface DailyBadgeProps {
  isCompleted: boolean;
}

export const DailyBadge: React.FC<DailyBadgeProps> = ({ isCompleted }) => {
  if (isCompleted) return null;

  return (
    <View style={styles.badge}>
      <Text style={styles.text}>!</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    position: "absolute",
    top: -6,
    right: -6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#F44336",
    justifyContent: "center",
    alignItems: "center",
  },
  text: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "bold",
  },
});
