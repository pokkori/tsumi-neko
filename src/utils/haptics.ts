import { Platform } from "react-native";

// Haptics module - dynamically imported to avoid crashes on web
let Haptics: typeof import("expo-haptics") | null = null;

async function getHaptics() {
  if (Platform.OS === "web") return null;
  if (Haptics) return Haptics;
  try {
    Haptics = await import("expo-haptics");
    return Haptics;
  } catch {
    return null;
  }
}

export async function hapticsLight(): Promise<void> {
  const h = await getHaptics();
  if (!h) return;
  try {
    await h.impactAsync(h.ImpactFeedbackStyle.Light);
  } catch {}
}

export async function hapticsMedium(): Promise<void> {
  const h = await getHaptics();
  if (!h) return;
  try {
    await h.impactAsync(h.ImpactFeedbackStyle.Medium);
  } catch {}
}

export async function hapticsSuccess(): Promise<void> {
  const h = await getHaptics();
  if (!h) return;
  try {
    await h.notificationAsync(h.NotificationFeedbackType.Success);
  } catch {}
}

export async function hapticsHeavy(): Promise<void> {
  const h = await getHaptics();
  if (!h) return;
  try {
    await h.impactAsync(h.ImpactFeedbackStyle.Heavy);
  } catch {}
}

export async function hapticsError(): Promise<void> {
  const h = await getHaptics();
  if (!h) return;
  try {
    await h.notificationAsync(h.NotificationFeedbackType.Error);
  } catch {}
}

/** Heavy impact + success notification for merges */
export async function hapticsMerge(): Promise<void> {
  const h = await getHaptics();
  if (!h) return;
  try {
    await h.impactAsync(h.ImpactFeedbackStyle.Heavy);
    await h.notificationAsync(h.NotificationFeedbackType.Success);
  } catch {}
}

/** Double heavy impact for large cat merges */
export async function hapticsMergeLarge(): Promise<void> {
  const h = await getHaptics();
  if (!h) return;
  try {
    await h.impactAsync(h.ImpactFeedbackStyle.Heavy);
    setTimeout(async () => {
      try {
        await h.impactAsync(h.ImpactFeedbackStyle.Heavy);
      } catch {}
    }, 50);
  } catch {}
}

/** Error notification + heavy impact for collapse */
export async function hapticsCollapse(): Promise<void> {
  const h = await getHaptics();
  if (!h) return;
  try {
    await h.notificationAsync(h.NotificationFeedbackType.Error);
    await h.impactAsync(h.ImpactFeedbackStyle.Heavy);
  } catch {}
}

/** Medium impact for combo */
export async function hapticsCombo(): Promise<void> {
  const h = await getHaptics();
  if (!h) return;
  try {
    await h.impactAsync(h.ImpactFeedbackStyle.Medium);
  } catch {}
}
