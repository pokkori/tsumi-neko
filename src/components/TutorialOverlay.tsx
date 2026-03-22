import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Modal,
} from "react-native";
import { COLORS } from "../constants/colors";

interface TutorialOverlayProps {
  visible: boolean;
  onComplete: () => void;
}

const STEPS = [
  {
    emoji: "1",
    title: "ドラッグで位置を決めて落とそう!",
    description: "画面を左右にドラッグして落とす位置を決め、指を離すと猫が落ちるよ!",
  },
  {
    emoji: "2",
    title: "同じ猫がぶつかると合体・進化!",
    description: "同じ形の猫同士がぶつかると次の形に進化！10段階で最強のずんぐりネコを目指そう!",
  },
  {
    emoji: "3",
    title: "目標は「ずんぐりネコ」誕生!",
    description: "合体を繰り返してずんぐりネコを生み出せ！崩さないように高く積んでハイスコアも狙おう!",
  },
];

export const TutorialOverlay: React.FC<TutorialOverlayProps> = ({
  visible,
  onComplete,
}) => {
  const [step, setStep] = useState(0);
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const scaleAnim = React.useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    if (visible) {
      setStep(0);
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.8);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleNext = () => {
    if (step < STEPS.length - 1) {
      // Animate transition
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start(() => {
        setStep(step + 1);
        fadeAnim.setValue(0);
        scaleAnim.setValue(0.8);
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.spring(scaleAnim, {
            toValue: 1,
            friction: 8,
            useNativeDriver: true,
          }),
        ]).start();
      });
    } else {
      onComplete();
    }
  };

  if (!visible) return null;

  const currentStep = STEPS[step];

  return (
    <Modal visible={visible} transparent animationType="none">
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.card,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <Text style={styles.emoji}>{currentStep.emoji}</Text>
          <Text style={styles.title}>{currentStep.title}</Text>
          <Text style={styles.description}>{currentStep.description}</Text>

          <View style={styles.dotsContainer}>
            {STEPS.map((_, i) => (
              <View
                key={i}
                style={[styles.dot, i === step && styles.dotActive]}
              />
            ))}
          </View>

          <TouchableOpacity style={styles.button} onPress={handleNext}>
            <Text style={styles.buttonText}>
              {step < STEPS.length - 1 ? "つぎへ" : "はじめる!"}
            </Text>
          </TouchableOpacity>

          {step < STEPS.length - 1 && (
            <TouchableOpacity style={styles.skipButton} onPress={onComplete}>
              <Text style={styles.skipText}>スキップ</Text>
            </TouchableOpacity>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 32,
    width: 300,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  emoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: COLORS.text,
    textAlign: "center",
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: COLORS.textLight,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 24,
  },
  dotsContainer: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 24,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#DDD",
  },
  dotActive: {
    backgroundColor: COLORS.secondary,
    width: 24,
  },
  button: {
    backgroundColor: COLORS.secondary,
    paddingHorizontal: 40,
    paddingVertical: 14,
    borderRadius: 25,
    width: "100%",
    alignItems: "center",
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
  },
  skipButton: {
    marginTop: 12,
  },
  skipText: {
    color: COLORS.textLight,
    fontSize: 14,
  },
});
