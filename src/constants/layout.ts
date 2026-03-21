import { Dimensions } from "react-native";

const { width, height } = Dimensions.get("window");

export const SCREEN_WIDTH = width;
export const SCREEN_HEIGHT = height;

export const LAYOUT = {
  HUD_HEIGHT: 80,
  PREVIEW: {
    x: SCREEN_WIDTH - 70,
    y: 100,
    size: 50,
  },
  GROUND_LINE_Y: 750,
  GAME_AREA: {
    top: 120,
    bottom: 750,
    left: 0,
    right: SCREEN_WIDTH,
  },
} as const;
