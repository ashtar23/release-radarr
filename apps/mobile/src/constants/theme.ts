/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import "@/global.css";

import { Platform, type ColorSchemeName } from "react-native";

export type ThemeName = "light" | "dark";

type ShadowToken = {
  elevation: number;
  shadowColor: string;
  shadowOffset: { width: number; height: number };
  shadowOpacity: number;
  shadowRadius: number;
};

export type AppTheme = {
  text: string;
  background: string;
  backgroundElement: string;
  backgroundSelected: string;
  textSecondary: string;
  separator: string;
  control: {
    radius: {
      sm: number;
      md: number;
      lg: number;
    };
    input: {
      height: number;
      textSize: number;
      textLineHeight: number;
      textMinHeight: number;
      clearButtonSize: number;
      clearButtonRadius: number;
    };
  };
  status: {
    success: string;
    error: string;
    warning: string;
    info: string;
  };
  interactive: {
    linkPrimary: string;
    focusRing: string;
  };
  accent: {
    watchlist: string;
  };
  input: {
    fallbackBorder: string;
    fallbackBorderFocused: string;
    fallbackBorderError: string;
    placeholder: string;
    androidShadow: ShadowToken;
    androidShadowFocused: ShadowToken;
  };
  glassInput: {
    tintIdle: string;
    tintFocused: string;
    bgIdle: string;
    bgFocused: string;
    borderIdle: string;
    borderFocused: string;
    borderError: string;
  };
  card: {
    titleCard: {
      background: string;
      border: string;
      pressedOverlay: string;
      meta: string;
      shadow: ShadowToken;
    };
  };
};

/**
 * Mobile token-to-role mapping.
 *
 * Goal:
 * - keep one semantic owner role per color token
 * - make audits deterministic
 * - avoid ad hoc "best guess" token usage
 */
export const THEME_TOKEN_ROLE_MATRIX = {
  "surface/base": "background",
  "surface/elevated": "backgroundElement",
  "surface/selected": "backgroundSelected",
  "text/primary": "text",
  "text/secondary": "textSecondary",
  "status/success": "status.success",
  "status/error": "status.error",
  "status/warning": "status.warning",
  "status/info": "status.info",
  "interactive/link-primary": "interactive.linkPrimary",
  "interactive/focus-ring": "interactive.focusRing",
  "accent/watchlist": "accent.watchlist",
  "input/placeholder": "input.placeholder",
  "input/fallback-border-default": "input.fallbackBorder",
  "input/fallback-border-focus": "input.fallbackBorderFocused",
  "input/fallback-border-error": "input.fallbackBorderError",
  "shadow/input-default": "input.androidShadow.shadowColor",
  "shadow/input-focused": "input.androidShadowFocused.shadowColor",
  "glass-input/tint-idle": "glassInput.tintIdle",
  "glass-input/tint-focused": "glassInput.tintFocused",
  "glass-input/bg-idle": "glassInput.bgIdle",
  "glass-input/bg-focused": "glassInput.bgFocused",
  "glass-input/border-idle": "glassInput.borderIdle",
  "glass-input/border-focused": "glassInput.borderFocused",
  "glass-input/border-error": "glassInput.borderError",
  "card/title-card-background": "card.titleCard.background",
  "card/title-card-border": "card.titleCard.border",
  "card/title-card-pressed-overlay": "card.titleCard.pressedOverlay",
  "card/title-card-meta": "card.titleCard.meta",
  "card/title-card-shadow": "card.titleCard.shadow.shadowColor",
} as const;

/**
 * Platform baseline references used when evaluating and evolving token values.
 *
 * References:
 * - Apple HIG color: https://developer.apple.com/design/human-interface-guidelines/color
 * - RN DynamicColorIOS: https://reactnative.dev/docs/dynamiccolorios
 * - RN PlatformColor: https://reactnative.dev/docs/platformcolor
 * - Android Material 3: https://developer.android.com/develop/ui/compose/designsystems/material3#color-scheme
 */
export const THEME_PLATFORM_BASELINE = {
  "surface/base": { ios: "systemBackground", android: "surface" },
  "surface/elevated": {
    ios: "secondarySystemBackground",
    android: "surfaceContainer",
  },
  "surface/selected": {
    ios: "tertiarySystemFill",
    android: "surfaceContainerHigh",
  },
  "text/primary": { ios: "label", android: "onSurface" },
  "text/secondary": { ios: "secondaryLabel", android: "onSurfaceVariant" },
  "status/success": {
    ios: "semantic success",
    android: "custom semantic success",
  },
  "status/error": { ios: "systemRed", android: "error" },
  "status/warning": { ios: "systemOrange", android: "tertiary" },
  "status/info": { ios: "systemBlue", android: "primary" },
  "interactive/link-primary": { ios: "link", android: "primary" },
  "interactive/focus-ring": { ios: "tintColor", android: "primary" },
  "accent/watchlist": { ios: "systemOrange", android: "secondaryContainer" },
  "input/placeholder": { ios: "placeholderText", android: "onSurfaceVariant" },
  "input/fallback-border-default": { ios: "separator", android: "outline" },
  "input/fallback-border-focus": { ios: "tintColor", android: "primary" },
  "input/fallback-border-error": { ios: "systemRed", android: "error" },
  "shadow/input-default": { ios: "shadow", android: "shadow" },
  "shadow/input-focused": { ios: "shadow", android: "shadow" },
  "glass-input/tint-idle": {
    ios: "system fill over blur",
    android: "custom overlay tint",
  },
  "glass-input/tint-focused": {
    ios: "system fill/emphasis over blur",
    android: "custom overlay tint",
  },
  "glass-input/bg-idle": {
    ios: "clear + blur material",
    android: "surface with alpha overlay",
  },
  "glass-input/bg-focused": {
    ios: "system fill over blur",
    android: "surface with alpha overlay",
  },
  "glass-input/border-idle": {
    ios: "separator over material",
    android: "outline variant",
  },
  "glass-input/border-focused": {
    ios: "separator/tint over material",
    android: "outline",
  },
  "glass-input/border-error": {
    ios: "systemRed over material",
    android: "error",
  },
  "card/search-background": {
    ios: "secondarySystemBackground",
    android: "surfaceContainerLow",
  },
  "card/search-border": {
    ios: "separator",
    android: "outlineVariant",
  },
  "card/search-pressed-overlay": {
    ios: "quaternarySystemFill",
    android: "onSurface with low alpha",
  },
  "card/search-meta": {
    ios: "secondaryLabel",
    android: "onSurfaceVariant",
  },
  "card/search-shadow": {
    ios: "shadow",
    android: "shadow",
  },
} as const;

export const Colors = {
  light: {
    text: "#000000",
    background: "#ffffff",
    backgroundElement: "#F0F0F3",
    backgroundSelected: "#E0E1E6",
    textSecondary: "#60646C",
    separator: "rgba(60,60,67,0.29)",
    control: {
      radius: {
        sm: 8,
        md: 12,
        lg: 18,
      },
      input: {
        height: 44,
        textSize: 16,
        textLineHeight: 20,
        textMinHeight: 20,
        clearButtonSize: 24,
        clearButtonRadius: 12,
      },
    },
    status: {
      success: "#0f6b2c",
      error: "#b42318",
      warning: "#b54708",
      info: "#175cd3",
    },
    interactive: {
      linkPrimary: "#2b6fe0",
      focusRing: "#2b6fe0",
    },
    accent: {
      watchlist: "#A86D1C",
    },
    input: {
      fallbackBorder: "#60646C",
      fallbackBorderFocused: "#000000",
      fallbackBorderError: "#b42318",
      placeholder: "#60646C",
      androidShadow: {
        elevation: 1,
        shadowColor: "#000000",
        shadowOffset: { width: 0, height: 0.5 },
        shadowOpacity: 0.14,
        shadowRadius: 1,
      },
      androidShadowFocused: {
        elevation: 4,
        shadowColor: "#000000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.18,
        shadowRadius: 6,
      },
    },
    glassInput: {
      tintIdle: "rgba(244,244,248,0.86)",
      tintFocused: "rgba(244,244,248,0.86)",
      bgIdle: "rgba(242,242,247,0.92)",
      bgFocused: "rgba(242,242,247,0.72)",
      borderIdle: "rgba(60,60,67,0.12)",
      borderFocused: "rgba(0,0,0,0.44)",
      borderError: "rgba(180,35,24,0.75)",
    },
    card: {
      titleCard: {
        background: "#F7F8FA",
        border: "rgba(60,60,67,0.16)",
        pressedOverlay: "rgba(15,23,42,0.08)",
        meta: "#60646C",
        shadow: {
          elevation: 1,
          shadowColor: "#000000",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.08,
          shadowRadius: 2,
        },
      },
    },
  },
  dark: {
    text: "#ffffff",
    background: "#000000",
    backgroundElement: "#212225",
    backgroundSelected: "#2E3135",
    textSecondary: "#B0B4BA",
    separator: "rgba(84,84,88,0.65)",
    control: {
      radius: {
        sm: 8,
        md: 12,
        lg: 18,
      },
      input: {
        height: 44,
        textSize: 16,
        textLineHeight: 20,
        textMinHeight: 20,
        clearButtonSize: 24,
        clearButtonRadius: 12,
      },
    },
    status: {
      success: "#2cb670",
      error: "#f97066",
      warning: "#fdb022",
      info: "#53b1fd",
    },
    interactive: {
      linkPrimary: "#74aeff",
      focusRing: "#74aeff",
    },
    accent: {
      watchlist: "#E5B24A",
    },
    input: {
      fallbackBorder: "#B0B4BA",
      fallbackBorderFocused: "#ffffff",
      fallbackBorderError: "#f97066",
      placeholder: "#B0B4BA",
      androidShadow: {
        elevation: 2,
        shadowColor: "#000000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.34,
        shadowRadius: 4,
      },
      androidShadowFocused: {
        elevation: 4,
        shadowColor: "#000000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.42,
        shadowRadius: 6,
      },
    },
    glassInput: {
      tintIdle: "rgba(20,20,24,0.72)",
      tintFocused: "rgba(20,20,24,0.72)",
      bgIdle: "rgba(17,17,20,0.72)",
      bgFocused: "rgba(17,17,20,0.6)",
      borderIdle: "rgba(255,255,255,0.16)",
      borderFocused: "rgba(255,255,255,0.35)",
      borderError: "rgba(249,112,102,0.8)",
    },
    card: {
      titleCard: {
        background: "#111317",
        border: "rgba(255,255,255,0.14)",
        pressedOverlay: "rgba(255,255,255,0.12)",
        meta: "#B0B4BA",
        shadow: {
          elevation: 2,
          shadowColor: "#000000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.24,
          shadowRadius: 4,
        },
      },
    },
  },
} as const satisfies Record<ThemeName, AppTheme>;

type PrimitiveThemeColorKey = {
  [Key in keyof AppTheme]: AppTheme[Key] extends string ? Key : never;
}[keyof AppTheme];

export type ThemeColor = PrimitiveThemeColorKey;

export function resolveThemeName(
  colorScheme: ColorSchemeName | "unspecified" | undefined,
): ThemeName {
  return colorScheme === "dark" ? "dark" : "light";
}

export function getThemeByColorScheme(
  colorScheme: ColorSchemeName | "unspecified" | undefined,
) {
  return Colors[resolveThemeName(colorScheme)];
}

export function isDarkTheme(theme: AppTheme) {
  return theme === Colors.dark;
}

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: "system-ui",
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: "ui-serif",
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: "ui-rounded",
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "var(--font-display)",
    serif: "var(--font-serif)",
    rounded: "var(--font-rounded)",
    mono: "var(--font-mono)",
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
