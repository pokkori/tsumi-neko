// ==========================================
// Cat Shapes
// ==========================================

export type CatShapeId =
  | "round"
  | "long"
  | "flat"
  | "triangle"
  | "fat"
  | "tiny"
  | "loaf"
  | "curled"
  | "stretchy"
  | "chunky";

export interface PhysicsVertex {
  x: number;
  y: number;
}

export interface CatShape {
  id: CatShapeId;
  name: string;
  svgPath: string;
  physicsVertices: PhysicsVertex[];
  width: number;
  height: number;
  mass: number;
  friction: number;
  restitution: number;
  centerOfMass: PhysicsVertex;
  rarity: "common" | "uncommon" | "rare";
  spawnWeight: number;
}

// ==========================================
// Cat Faces
// ==========================================

export type FaceExpression =
  | "normal"
  | "scared"
  | "sleeping"
  | "angry"
  | "shocked"
  | "love"
  | "dizzy";

export interface FaceData {
  expression: FaceExpression;
  leftEye: string;
  rightEye: string;
  mouth: string;
  extras?: string;
}

// ==========================================
// Cat Skins
// ==========================================

export type SkinId =
  | "mike"
  | "kuro"
  | "shiro"
  | "tora"
  | "hachiware"
  | "scottish"
  | "persian"
  | "siamese"
  | "russian_blue"
  | "munchkin"
  | "sphynx"
  | "bengal"
  | "ragdoll"
  | "abyssinian"
  | "neko_samurai";

export interface CatSkin {
  id: SkinId;
  name: string;
  description: string;
  bodyColor: string;
  patternColor: string | null;
  patternSvg: string | null;
  earColor: string;
  noseColor: string;
  eyeColor: string;
  tailSvg: string;
  unlockCondition: UnlockCondition;
  isDefault: boolean;
}

export interface UnlockCondition {
  type: "default" | "score" | "count" | "achievement" | "iap" | "daily";
  value: number;
  achievementId?: AchievementId;
}

// ==========================================
// Game State
// ==========================================

export type GamePhase =
  | "idle"
  | "dropping"
  | "settling"
  | "stable"
  | "collapsing"
  | "gameover";

export interface ActiveCat {
  bodyId: number;
  shapeId: CatShapeId;
  skinId: SkinId;
  expression: FaceExpression;
  position: { x: number; y: number };
  angle: number;
  isStacked: boolean;
}

export interface MergeEvent {
  x: number;
  y: number;
  fromShapeId: CatShapeId;
  toShapeId: CatShapeId;
  timestamp: number;
  /** Index of the evolved shape in CAT_SHAPES (0-9), higher = larger cat */
  evolutionIndex: number;
}

export interface LandingEvent {
  bodyId: number;
  x: number;
  y: number;
  timestamp: number;
}

export interface GameState {
  phase: GamePhase;
  score: number;
  height: number;
  heightPx: number;
  combo: number;
  maxCombo: number;
  catCount: number;
  mergeCount: number;
  currentCat: ActiveCat | null;
  nextShapeId: CatShapeId;
  stackedCats: ActiveCat[];
  fallenCats: ActiveCat[];
  cameraY: number;
  isNewRecord: boolean;
  dailyChallengeId: string | null;
  activeSkinId: SkinId;
  lastMergeEvent: MergeEvent | null;
  landingEvents: LandingEvent[];
  shapesUsedInGame: CatShapeId[];
}

// ==========================================
// Score / Records
// ==========================================

export interface ScoreRecord {
  score: number;
  height: number;
  catCount: number;
  maxCombo: number;
  date: string;
  skinId: SkinId;
  dailyChallengeId: string | null;
}

export interface PlayerStats {
  totalGames: number;
  totalCatsStacked: number;
  totalHeight: number;
  bestScore: number;
  bestHeight: number;
  bestCombo: number;
  bestCatCount: number;
  currentStreak: number;
  maxStreak: number;
  lastPlayDate: string;
  firstPlayDate: string;
}

// ==========================================
// Shop / IAP
// ==========================================

export type IAPProductId =
  | "remove_ads"
  | "coin_pack_small"
  | "coin_pack_medium"
  | "coin_pack_large"
  | "neko_samurai_skin";

export interface ShopItem {
  productId: IAPProductId;
  name: string;
  description: string;
  priceJPY: number;
  type: "consumable" | "non_consumable";
  coinAmount?: number;
}

export interface WalletState {
  coins: number;
  adsRemoved: boolean;
  purchasedSkins: SkinId[];
}

// ==========================================
// Daily Challenge
// ==========================================

export type ChallengeRule =
  | "heavy_cats"
  | "bouncy_cats"
  | "tiny_only"
  | "fat_only"
  | "no_guide"
  | "speed_up"
  | "low_gravity"
  | "high_friction"
  | "random_wind"
  | "mirror";

export interface DailyChallenge {
  id: string;
  rule: ChallengeRule;
  ruleName: string;
  ruleDescription: string;
  targetScore: number;
  rewardCoins: number;
}

export interface DailyChallengeResult {
  id: string;
  completed: boolean;
  bestScore: number;
  attempts: number;
}

// ==========================================
// Achievements
// ==========================================

export type AchievementId =
  | "first_stack"
  | "stack_10"
  | "stack_50"
  | "stack_100"
  | "height_1m"
  | "height_5m"
  | "height_10m"
  | "combo_5"
  | "combo_10"
  | "combo_20"
  | "score_1000"
  | "score_5000"
  | "score_10000"
  | "games_10"
  | "games_100"
  | "daily_clear"
  | "daily_7"
  | "daily_30"
  | "all_shapes"
  | "skin_collector"
  | "perfect_balance"
  | "lucky_save"
  | "speed_demon"
  | "night_owl";

export interface Achievement {
  id: AchievementId;
  name: string;
  description: string;
  icon: string;
  rewardCoins: number;
  isSecret: boolean;
}

export interface AchievementProgress {
  unlockedIds: AchievementId[];
  shapesUsed: CatShapeId[];
  fastStackCount: number;
}

// ==========================================
// Ads
// ==========================================

export interface AdState {
  gamesUntilInterstitial: number;
  rewardAvailable: boolean;
  lastRewardTime: number;
}

// ==========================================
// Settings
// ==========================================

export interface UserSettings {
  bgmVolume: number;
  seVolume: number;
  hapticsEnabled: boolean;
  showGuide: boolean;
  selectedSkinId: SkinId;
}

// ==========================================
// AsyncStorage Schema
// ==========================================

export interface StorageSchema {
  "@tsumineko/stats": PlayerStats;
  "@tsumineko/scores": ScoreRecord[];
  "@tsumineko/wallet": WalletState;
  "@tsumineko/settings": UserSettings;
  "@tsumineko/achievements": AchievementProgress;
  "@tsumineko/daily_results": Record<string, DailyChallengeResult>;
  "@tsumineko/unlocked_skins": SkinId[];
  "@tsumineko/ad_state": AdState;
}
