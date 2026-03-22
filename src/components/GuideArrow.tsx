import React from "react";
import { View, StyleSheet } from "react-native";
import { Svg, Line, Polygon } from "react-native-svg";

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

  const height = bottomY - topY;
  const arrowSize = 8;

  return (
    <View
      style={[
        styles.container,
        {
          left: x - arrowSize,
          top: topY,
          height,
          width: arrowSize * 2,
        },
      ]}
    >
      <Svg width={arrowSize * 2} height={height}>
        {/* Dashed vertical line */}
        <Line
          x1={arrowSize}
          y1={0}
          x2={arrowSize}
          y2={height - arrowSize}
          stroke="rgba(255,255,255,0.55)"
          strokeWidth={2}
          strokeDasharray="6,5"
        />
        {/* Arrowhead at bottom */}
        <Polygon
          points={`${arrowSize},${height} ${arrowSize - arrowSize},${height - arrowSize} ${arrowSize + arrowSize},${height - arrowSize}`}
          fill="rgba(255,255,255,0.7)"
        />
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    zIndex: 5,
  },
});
