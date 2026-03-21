import { FaceData, FaceExpression } from "../types";

export const CAT_FACES: Record<FaceExpression, FaceData> = {
  normal: {
    expression: "normal",
    leftEye: "M10,10 C10,7 13,5 15,5 C17,5 20,7 20,10 C20,12 17,13 15,13 C13,13 10,12 10,10 Z",
    rightEye: "M25,10 C25,7 28,5 30,5 C32,5 35,7 35,10 C35,12 32,13 30,13 C28,13 25,12 25,10 Z",
    mouth: "M18,18 Q22,22 27,18",
    extras: undefined,
  },
  scared: {
    expression: "scared",
    leftEye: "M10,8 C10,4 13,2 15,2 C17,2 20,4 20,8 C20,12 17,14 15,14 C13,14 10,12 10,8 Z",
    rightEye: "M25,8 C25,4 28,2 30,2 C32,2 35,4 35,8 C35,12 32,14 30,14 C28,14 25,12 25,8 Z",
    mouth: "M19,19 C19,19 22,16 22,16 C22,16 25,19 25,19",
    extras: "M8,4 L12,7 M37,4 L33,7",
  },
  sleeping: {
    expression: "sleeping",
    leftEye: "M10,10 Q15,13 20,10",
    rightEye: "M25,10 Q30,13 35,10",
    mouth: "M20,19 Q22,21 24,19",
    extras: "M38,2 L42,0 M40,5 L44,3 M42,8 L46,6",
  },
  angry: {
    expression: "angry",
    leftEye: "M10,10 C10,7 13,6 15,6 C17,6 20,7 20,10 C20,12 17,13 15,13 C13,13 10,12 10,10 Z",
    rightEye: "M25,10 C25,7 28,6 30,6 C32,6 35,7 35,10 C35,12 32,13 30,13 C28,13 25,12 25,10 Z",
    mouth: "M17,20 L22,17 L27,20",
    extras: "M5,2 L8,5 L5,5 Z M40,2 L37,5 L40,5 Z",
  },
  shocked: {
    expression: "shocked",
    leftEye: "M10,6 C10,2 13,0 15,0 C17,0 20,2 20,6 C20,12 17,14 15,14 C13,14 10,12 10,6 Z",
    rightEye: "M25,6 C25,2 28,0 30,0 C32,0 35,2 35,6 C35,12 32,14 30,14 C28,14 25,12 25,6 Z",
    mouth: "M18,18 C18,18 22,24 22,24 C22,24 26,18 26,18 Z",
    extras: "M6,0 L10,4 M39,0 L35,4 M22,-4 L22,0",
  },
  love: {
    expression: "love",
    leftEye: "M11,8 L15,4 L19,8 L15,12 Z",
    rightEye: "M26,8 L30,4 L34,8 L30,12 Z",
    mouth: "M18,18 Q22,23 27,18",
    extras: "M5,0 L7,3 L9,0 L7,4 Z M36,0 L38,3 L40,0 L38,4 Z",
  },
  dizzy: {
    expression: "dizzy",
    leftEye: "M11,7 L19,13 M11,13 L19,7",
    rightEye: "M26,7 L34,13 M26,13 L34,7",
    mouth: "M18,20 Q22,23 26,20 Q22,17 18,20",
    extras: undefined,
  },
};

export function getExpressionForState(
  phase: string,
  isTopOfStack: boolean,
  comboCount: number,
  hasWeight: boolean
): FaceExpression {
  if (phase === "collapsing") return "shocked";
  if (phase === "dropping") return "scared";
  if (phase === "idle") return "normal";
  if (phase === "gameover") return "dizzy";
  if (comboCount >= 3 && isTopOfStack) return "love";
  if (hasWeight) return "angry";
  if (isTopOfStack) return "sleeping";
  return "normal";
}
