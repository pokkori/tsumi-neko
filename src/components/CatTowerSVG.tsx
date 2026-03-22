import React from "react";
import Svg, { Circle, Path, G } from "react-native-svg";

function CatUnit({ cx, cy, size, stage }: { cx: number; cy: number; size: number; stage: number }) {
  const bodyColors = ["#FFE4E1","#FFF8E7","#FFE4B5","#E8F5E9","#D7CCC8","#E3F2FD","#F3E5F5","#FFCCBC","#FFF9C4","#FCE4EC"];
  const borderColors = ["#FF69B4","#FF8C00","#DAA520","#32CD32","#8B4513","#4169E1","#9932CC","#DC143C","#FFD700","#FF1493"];
  const bodyColor = bodyColors[stage % bodyColors.length];
  const borderColor = borderColors[stage % borderColors.length];
  const r = size * 0.4;

  return (
    <G>
      <Circle cx={cx} cy={cy + size * 0.05} r={r} fill={bodyColor} stroke={borderColor} strokeWidth="1.5" />
      <Path d={`M${cx - r * 0.7} ${cy - r * 0.6} L${cx - r * 0.3} ${cy - r * 1.0} L${cx - r * 0.1} ${cy - r * 0.55}`} fill={borderColor} />
      <Path d={`M${cx + r * 0.1} ${cy - r * 0.55} L${cx + r * 0.3} ${cy - r * 1.0} L${cx + r * 0.7} ${cy - r * 0.6}`} fill={borderColor} />
      <Circle cx={cx - r * 0.35} cy={cy - r * 0.1} r={r * 0.12} fill="#333" />
      <Circle cx={cx + r * 0.35} cy={cy - r * 0.1} r={r * 0.12} fill="#333" />
      <Path d={`M${cx} ${cy + r * 0.15} L${cx - r * 0.08} ${cy + r * 0.25} L${cx + r * 0.08} ${cy + r * 0.25} Z`} fill="#FF69B4" />
    </G>
  );
}

interface CatTowerSVGProps {
  width: number;
  height: number;
}

export function CatTowerSVG({ width, height }: CatTowerSVGProps) {
  const catSize = width * 0.28;
  const row3y = height * 0.82;
  const row2y = height * 0.54;
  const row1y = height * 0.28;

  return (
    <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <CatUnit cx={width * 0.2} cy={row3y} size={catSize} stage={0} />
      <CatUnit cx={width * 0.5} cy={row3y} size={catSize} stage={1} />
      <CatUnit cx={width * 0.8} cy={row3y} size={catSize} stage={2} />
      <CatUnit cx={width * 0.35} cy={row2y} size={catSize * 0.9} stage={3} />
      <CatUnit cx={width * 0.65} cy={row2y} size={catSize * 0.9} stage={4} />
      <CatUnit cx={width * 0.5} cy={row1y} size={catSize * 0.85} stage={9} />
    </Svg>
  );
}
