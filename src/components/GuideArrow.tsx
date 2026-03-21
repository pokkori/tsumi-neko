import React from "react";
import { View, StyleSheet } from "react-native";

interface GuideArrowProps {
  x: number;
  topY: number;
  bottomY: number;
  visible: boolean;
}

export const GuideArrow: React.FC<GuideArrowProps> = ({
  x,
  topY,
  bottomY,
  visible,
}) => {
  if (!visible) return null;

  return (
    <View
      style={[
        styles.container,
        {
          left: x - 1,
          top: topY,
          height: bottomY - topY,
        },
      ]}
    >
      <View style={styles.line} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    width: 2,
    zIndex: 5,
  },
  line: {
    flex: 1,
    width: 2,
    backgroundColor: "rgba(255,255,255,0.3)",
    borderStyle: "dotted" as any,
  },
});
