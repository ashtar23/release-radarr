import { Platform } from "react-native";
import {
  isGlassEffectAPIAvailable,
  isLiquidGlassAvailable,
} from "expo-glass-effect";

import { androidVersion, iosVersion } from "@/constants/platform";

function resolveGlassEffect(): boolean {
  if (Platform.OS !== "ios") return false;
  try {
    return isGlassEffectAPIAvailable() && isLiquidGlassAvailable();
  } catch {
    return false;
  }
}

/**
 * Feature capability flags derived from OS identity and version.
 *
 * All version comparisons live here — nothing else should import from
 * `platform.ts` to make version comparisons directly.
 *
 * To drop support for an old OS version: update the comparison so the
 * affected flag becomes a constant `true` or `false`, then let TypeScript
 * flag the dead branches for cleanup.
 */
type Capabilities = {
  // ── iOS version-gated ────────────────────────────────────────────────────
  /** iOS 26+: Liquid Glass navigation and tab bars are active.
   *  Do NOT set explicit `headerBlurEffect` or NativeTabs `blurEffect`. */
  liquidGlass: boolean;
  /** iOS 26+: GlassView can be rendered — runtime check via expo-glass-effect.
   *  Use this for rendering decisions; use `liquidGlass` for styling decisions. */
  glassEffect: boolean;
  /** iOS 16–25: explicit `"systemChromeMaterial"` blur on transparent headers. */
  headerBlurEffect: boolean;

  // ── Android version-gated ────────────────────────────────────────────────
  /** Android API 36+ (Android 16): MD3 Expressive shapes → larger radii (16dp vs 12dp). */
  expressiveShape: boolean;
  /** Android API 36+: edge-to-edge display is mandatory, cannot opt-out. */
  mandatoryEdgeToEdge: boolean;
  /** Android API 33+: system predictive back gesture animations are enabled. */
  predictiveBack: boolean;

  // ── OS identity ──────────────────────────────────────────────────────────
  /** iOS only: `contentInsetAdjustmentBehavior: "automatic"` on ScrollView. */
  autoContentInsets: boolean;
  /** iOS only: `keyboardDismissMode: "interactive"`. */
  interactiveKeyboardDismiss: boolean;
  /** iOS only: `automaticallyAdjustKeyboardInsets`. */
  automaticKeyboardInsets: boolean;
  /** iOS only: `minimizeBehavior: "onScrollDown"` on NativeTabs. */
  tabMinimize: boolean;
  /** iOS only: `role="search"` on NativeTabs.Trigger. */
  tabSearchRole: boolean;
  /** iOS 16–25: `blurEffect="systemChromeMaterial"` on NativeTabs. */
  tabBlurEffect: boolean;
  /** iOS only: `headerTransparent` on NativeStack. */
  headerTransparent: boolean;
};

export const capabilities: Capabilities = {
  // iOS version-gated
  liquidGlass: iosVersion >= 26,
  glassEffect: resolveGlassEffect(),
  headerBlurEffect: iosVersion >= 16 && iosVersion < 26,

  // Android version-gated
  expressiveShape: androidVersion >= 36,
  mandatoryEdgeToEdge: androidVersion >= 36,
  predictiveBack: androidVersion >= 33,

  // OS identity
  autoContentInsets: Platform.OS === "ios",
  interactiveKeyboardDismiss: Platform.OS === "ios",
  automaticKeyboardInsets: Platform.OS === "ios",
  tabMinimize: Platform.OS === "ios",
  headerTransparent: Platform.OS === "ios",
  tabSearchRole: Platform.OS === "ios",
  tabBlurEffect: Platform.OS === "ios" && iosVersion < 26,
};
