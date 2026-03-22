import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Svg, { Ellipse, Circle, Path, Rect } from "react-native-svg";
import { CatShapeId } from "../types";

interface CatPreviewProps {
  shapeId: CatShapeId;
}

function CatShapeSVG({ shapeId }: { shapeId: string }) {
  const colorMap: Record<string, string> = {
    round: '#FF9966', long: '#CC8844', flat: '#FFCC44',
    triangle: '#AA66CC', fat: '#9966CC', tiny: '#FFFFFF',
    loaf: '#AA6633', curled: '#4488FF', stretchy: '#44CC66', chunky: '#DD4444',
  };
  const color = colorMap[shapeId] ?? '#FF9966';

  return (
    <Svg width={50} height={50} viewBox="0 0 60 60">
      <Path d="M16,18 L10,6 L22,14 Z" fill="#FF6644"/>
      <Path d="M44,18 L50,6 L38,14 Z" fill="#FF6644"/>
      {shapeId === 'round' && <Ellipse cx="30" cy="32" rx="22" ry="20" fill={color}/>}
      {shapeId === 'long' && <Ellipse cx="30" cy="32" rx="14" ry="24" fill={color}/>}
      {shapeId === 'flat' && <Ellipse cx="30" cy="36" rx="24" ry="14" fill={color}/>}
      {shapeId === 'triangle' && <Path d="M30,8 L52,52 L8,52 Z" fill={color}/>}
      {shapeId === 'fat' && <Ellipse cx="30" cy="32" rx="26" ry="24" fill={color}/>}
      {shapeId === 'tiny' && <Ellipse cx="30" cy="32" rx="12" ry="12" fill={color}/>}
      {shapeId === 'loaf' && <Path d="M8,52 Q8,20 30,18 Q52,20 52,52 Z" fill={color}/>}
      {shapeId === 'curled' && <Path d="M30,52 Q8,52 8,30 Q8,8 30,8 Q52,8 52,30 Q52,52 40,52 Z" fill={color}/>}
      {shapeId === 'stretchy' && <Ellipse cx="30" cy="32" rx="16" ry="26" fill={color}/>}
      {shapeId === 'chunky' && <Rect x="8" y="12" width="44" height="40" rx="10" fill={color}/>}
      {!['round','long','flat','triangle','fat','tiny','loaf','curled','stretchy','chunky'].includes(shapeId) && (
        <Ellipse cx="30" cy="32" rx="20" ry="18" fill={color}/>
      )}
      <Ellipse cx="22" cy="28" rx="3.5" ry="4" fill="#1a1a2e"/>
      <Ellipse cx="38" cy="28" rx="3.5" ry="4" fill="#1a1a2e"/>
      <Circle cx="23.5" cy="26.5" r="1" fill="#fff"/>
      <Circle cx="39.5" cy="26.5" r="1" fill="#fff"/>
      <Ellipse cx="30" cy="36" rx="2" ry="1.5" fill="#FF9999"/>
      <Path d="M30,37.5 Q26,40 24,39" stroke="#555" strokeWidth="1" fill="none"/>
      <Path d="M30,37.5 Q34,40 36,39" stroke="#555" strokeWidth="1" fill="none"/>
    </Svg>
  );
}

export const CatPreview: React.FC<CatPreviewProps> = ({ shapeId }) => {
  if (!shapeId) return null;
  return (
    <View style={styles.container}>
      <Text style={styles.label}>NEXT</Text>
      <View style={styles.preview}>
        <CatShapeSVG shapeId={shapeId} />
        <Text style={styles.shapeName}>{shapeId}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 100,
    right: 16,
    alignItems: "center",
    zIndex: 10,
  },
  label: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "bold",
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  preview: {
    width: 68,
    minHeight: 72,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 4,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },
  shapeName: {
    color: "#FFFFFF",
    fontSize: 8,
    marginTop: 2,
  },
});
