import { ShopItem } from "../types";

export const SHOP_ITEMS: ShopItem[] = [
  { productId: "remove_ads", name: "広告削除", description: "バナー広告とインタースティシャル広告を永久に削除します", priceJPY: 480, type: "non_consumable" },
  { productId: "coin_pack_small", name: "コイン500枚", description: "ゲーム内コイン500枚を獲得", priceJPY: 160, type: "consumable", coinAmount: 500 },
  { productId: "coin_pack_medium", name: "コイン1500枚", description: "ゲーム内コイン1,500枚を獲得（お得！）", priceJPY: 400, type: "consumable", coinAmount: 1500 },
  { productId: "coin_pack_large", name: "コイン5000枚", description: "ゲーム内コイン5,000枚を獲得（超お得！）", priceJPY: 1000, type: "consumable", coinAmount: 5000 },
  { productId: "neko_samurai_skin", name: "ネコ侍スキン", description: "刀を背負った侍ネコ！限定デザイン", priceJPY: 320, type: "non_consumable" },
];
