import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import { ScoreCalculator } from "../engine/ScoreCalculator";

interface ComboPopupProps {
  combo: number;
}

const scorer = new ScoreCalculator();

export const ComboPopup: React.FC<ComboPopupProps> = ({ combo }) => {
  const [visible, setVisible] = useState(false);
  const [text, setText] = useState("");
  const [color, setColor] = useState("#FFFFFF");
  const opacity = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const comboText = scorer.getComboText(combo);
    if (comboText) {
      setText(comboText);
      setColor(scorer.getComboColor(combo));
      setVisible(true);
      opacity.setValue(1);

      Animated.timing(opacity, {
        toValue: 0,
        duration: 1500,
        useNativeDriver: true,
      }).start(() => setVisible(false));
    }
  }, [combo]);

  if (!visible) return null;

  return (
    <Animated.View style={[styles.container, { opacity }]}>
      <Text style={[styles.text, { color }]}>{text}</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: "40%",
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 20,
  },
  text: {
    fontSize: 28,
    fontWeight: "bold",
    textShadowColor: "rgba(0,0,0,0.8)",
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
});
