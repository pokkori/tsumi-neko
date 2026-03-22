import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  StyleSheet,
  SafeAreaView,
} from "react-native";
import { useRouter } from "expo-router";
import { useGameStore } from "../src/stores/gameStore";
import { CAT_SKINS } from "../src/data/catSkins";
import { SHOP_ITEMS } from "../src/data/shopItems";
import { formatCoins } from "../src/utils/format";
import { COLORS } from "../src/constants/colors";

const tagStyle = {
  fontSize: 10,
  color: '#FF6B35',
  backgroundColor: 'rgba(255,107,53,0.1)',
  borderRadius: 8,
  paddingHorizontal: 6,
  paddingVertical: 2,
  borderWidth: 1,
  borderColor: 'rgba(255,107,53,0.3)',
} as const;

const SKIN_PRICES: Record<string, number> = {
  scottish: 500,
  siamese: 500,
  munchkin: 800,
  bengal: 800,
  ragdoll: 1200,
};

export default function ShopScreen() {
  const router = useRouter();
  const wallet = useGameStore((s) => s.wallet);
  const unlockedSkins = useGameStore((s) => s.unlockedSkins);
  const spendCoins = useGameStore((s) => s.spendCoins);
  const unlockSkin = useGameStore((s) => s.unlockSkin);

  const buyableSkins = CAT_SKINS.filter(
    (s) => !s.isDefault && SKIN_PRICES[s.id] !== undefined
  );

  const handleBuySkin = async (skinId: string, price: number) => {
    if (unlockedSkins.includes(skinId as any)) {
      Alert.alert("購入済み", "このスキンは既に所持しています");
      return;
    }
    if (wallet.coins < price) {
      Alert.alert("コイン不足", `あと${price - wallet.coins}コイン必要です`);
      return;
    }

    const success = await spendCoins(price);
    if (success) {
      await unlockSkin(skinId as any);
      Alert.alert("購入完了!", `${CAT_SKINS.find((s) => s.id === skinId)?.name}を獲得しました！`);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>← 戻る</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>🛍 ショップ</Text>
        <Text style={styles.coins}>🪙 {formatCoins(wallet.coins)}</Text>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Coin Guide Card */}
        <View style={{
          backgroundColor: 'rgba(255,215,0,0.08)',
          borderRadius: 12,
          padding: 12,
          marginBottom: 8,
          borderWidth: 1,
          borderColor: 'rgba(255,215,0,0.25)',
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
        }}>
          <Text style={{ fontSize: 20 }}>🪙</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 13, color: '#FFD700', fontWeight: 'bold' }}>コインの貯め方</Text>
            <Text style={{ fontSize: 11, color: '#aaa', marginTop: 2 }}>スコア÷100枚 + 合体ボーナス2枚/回。毎日プレイで積み上げよう！</Text>
          </View>
        </View>

        {/* Skin Shop */}
        <Text style={styles.sectionTitle}>スキン</Text>

        {buyableSkins.map((skin) => {
          const owned = unlockedSkins.includes(skin.id);
          const price = SKIN_PRICES[skin.id] || 0;

          return (
            <View key={skin.id} style={styles.shopCard}>
              <View style={styles.shopCardHeader}>
                <View
                  style={[styles.skinPreview, { backgroundColor: skin.bodyColor }]}
                />
                <View style={styles.shopCardInfo}>
                  <Text style={styles.shopCardName}>{skin.name}</Text>
                  <Text style={styles.shopCardDesc}>{skin.description}</Text>
                  <View style={{ flexDirection:'row', flexWrap:'wrap', gap:4, marginTop:4 }}>
                    {skin.id === 'scottish' && <Text style={tagStyle}>🔇 静かな着地</Text>}
                    {skin.id === 'siamese' && <Text style={tagStyle}>💨 スリムな体型</Text>}
                    {skin.id === 'munchkin' && <Text style={tagStyle}>🪨 低重心・安定</Text>}
                    {skin.id === 'bengal' && <Text style={tagStyle}>⚡ アクティブ</Text>}
                    {skin.id === 'ragdoll' && <Text style={tagStyle}>🧸 おっとり系</Text>}
                  </View>
                </View>
              </View>
              {owned ? (
                <View style={styles.ownedBadge}>
                  <Text style={styles.ownedText}>所持済み</Text>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.buyButton}
                  onPress={() => handleBuySkin(skin.id, price)}
                >
                  <Text style={styles.buyButtonText}>🪙 {price} で購入</Text>
                </TouchableOpacity>
              )}
            </View>
          );
        })}

        {/* IAP Items */}
        <Text style={styles.sectionTitle}>課金アイテム</Text>

        <View style={{
          backgroundColor: 'rgba(255,215,0,0.12)',
          borderRadius: 12,
          padding: 12,
          marginBottom: 12,
          borderWidth: 1,
          borderColor: 'rgba(255,215,0,0.4)',
        }}>
          <Text style={{ fontSize: 13, color: '#FFD700', textAlign: 'center', fontWeight: 'bold' }}>
            🎮 ゲームプレイでコインを貯めてスキンを解放！
          </Text>
          <Text style={{ fontSize: 12, color: '#aaa', textAlign: 'center', marginTop: 4 }}>
            スコア×÷100 + 合体×2枚 獲得。コンティニューも使えます
          </Text>
        </View>

        {SHOP_ITEMS.map((item) => (
          <View key={item.productId} style={styles.shopCard}>
            <View style={styles.shopCardInfo}>
              <Text style={styles.shopCardName}>{item.name}</Text>
              <Text style={styles.shopCardDesc}>{item.description}</Text>
            </View>
            <TouchableOpacity
              style={[styles.buyButton, styles.iapButton]}
              onPress={() =>
                Alert.alert(
                  "課金アイテム",
                  `${item.name}（¥${item.priceJPY}）\n\nApp Store決済は準備中です。\nコインはゲームプレイで獲得できます！`,
                  [{ text: "OK" }]
                )
              }
            >
              <Text style={styles.buyButtonText}>¥{item.priceJPY}</Text>
            </TouchableOpacity>
          </View>
        ))}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    fontSize: 16,
    color: COLORS.secondary,
    fontWeight: "bold",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.text,
  },
  coins: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.text,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.text,
    marginTop: 20,
    marginBottom: 12,
  },
  shopCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  shopCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  skinPreview: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: "#00000020",
    marginRight: 12,
  },
  shopCardInfo: {
    flex: 1,
  },
  shopCardName: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.text,
  },
  shopCardDesc: {
    fontSize: 13,
    color: COLORS.textLight,
    marginTop: 2,
  },
  buyButton: {
    backgroundColor: COLORS.secondary,
    paddingVertical: 12,
    borderRadius: 20,
    alignItems: "center",
  },
  iapButton: {
    backgroundColor: "#4CAF50",
    marginTop: 12,
  },
  buyButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  ownedBadge: {
    backgroundColor: "#E8F5E9",
    paddingVertical: 10,
    borderRadius: 20,
    alignItems: "center",
  },
  ownedText: {
    color: "#4CAF50",
    fontSize: 14,
    fontWeight: "bold",
  },
});
