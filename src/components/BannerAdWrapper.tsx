import React from "react";
import { Platform, View } from "react-native";
import { AD_CONFIG } from "../constants/ads";

/**
 * BannerAdWrapper
 *
 * - Native (iOS/Android): react-native-google-mobile-ads の BannerAd を表示
 * - Web: 何も表示しない（AdMob は Web 非対応）
 *
 * ads.ts の PRODUCTION_MODE が false の間はテスト ID を使用するため
 * 実機でも安全に動作確認できる。
 */

let BannerAd: React.ComponentType<any> | null = null;
let BannerAdSize: Record<string, string> | null = null;

if (Platform.OS !== "web") {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const admob = require("react-native-google-mobile-ads");
    BannerAd = admob.BannerAd;
    BannerAdSize = admob.BannerAdSize;
  } catch {
    // ライブラリ未リンク時 (Expo Go など) はサイレントに無効化
    BannerAd = null;
  }
}

interface BannerAdWrapperProps {
  /** 広告の下マージン（デフォルト 0） */
  marginBottom?: number;
}

export const BannerAdWrapper: React.FC<BannerAdWrapperProps> = ({
  marginBottom = 0,
}) => {
  if (Platform.OS === "web" || !BannerAd || !BannerAdSize) {
    return null;
  }

  const adUnitId =
    Platform.OS === "ios" ? AD_CONFIG.BANNER_ID.ios : AD_CONFIG.BANNER_ID.android;

  return (
    <View
      style={{
        alignItems: "center",
        marginBottom,
        minHeight: 50,
      }}
      accessibilityLabel="広告"
      accessibilityRole="none"
    >
      <BannerAd
        unitId={adUnitId}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        requestOptions={{ requestNonPersonalizedAdsOnly: true }}
      />
    </View>
  );
};
