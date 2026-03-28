import type { AndroidSymbolName, IOSSymbolName } from "@/components/app-symbol";
import type { Href } from "expo-router";

type HeaderActionVisibilityState = {
  /** Hides the action entirely when false. */
  visible?: boolean;
  /** Keeps the action visible but non-interactive when true. */
  disabled?: boolean;
};

/**
 * A single actionable item shown inside a local header menu.
 */
export type HeaderMenuItem = HeaderActionVisibilityState & {
  /** Stable identifier for the menu item. */
  id: string;
  /** User-facing label shown in the native menu. */
  label: string;
  /** Optional SF Symbol used for iOS menu rendering. */
  iosIcon?: IOSSymbolName;
  /** Marks the menu item as destructive when true. */
  destructive?: boolean;
  /** Displays the menu item in the "on" state when true. */
  isOn?: boolean;
  /** Called when the user selects the menu item. */
  onPress: () => void;
};

type HeaderButtonActionBase = HeaderActionVisibilityState & {
  /** Marks this action as a visible header button. */
  kind: "button";
  /** Stable identifier for the action. */
  id: string;
  /** Accessibility and discoverability label for the action. */
  label: string;
  /** SF Symbol used for the native iOS header button. */
  iosIcon: IOSSymbolName;
  /** Optional Android symbol used for the Android header button fallback. */
  androidIcon?: AndroidSymbolName;
  /** Optional tint color used when the action should stand out visually. */
  tintColor?: string;
  /** Optional size for the header button icon. Defaults to 26. */
  iconSize?: number;
};

type HeaderButtonNavigationAction = HeaderButtonActionBase & {
  /** Declarative route target for navigation-style header buttons. */
  href: Href;
  /** Command handlers are not used for navigation actions. */
  onPress?: never;
};

type HeaderButtonCommandAction = HeaderButtonActionBase & {
  /** Called when the user presses a command-style button. */
  onPress: () => void;
  /** Navigation targets are not used for command-style actions. */
  href?: never;
};

/**
 * A single visible local header action rendered as a button on iOS.
 */
export type HeaderButtonAction =
  | HeaderButtonNavigationAction
  | HeaderButtonCommandAction;

/**
 * A grouped local header action rendered as a native menu on iOS.
 */
export type HeaderMenuAction = HeaderActionVisibilityState & {
  /** Marks this action as a header menu. */
  kind: "menu";
  /** Stable identifier for the menu action. */
  id: string;
  /** User-facing label for the menu. */
  label: string;
  /** SF Symbol used for the menu trigger on iOS. */
  iosIcon: IOSSymbolName;
  /** Optional menu title shown at the top of the native menu. */
  menuTitle?: string;
  /** Menu items rendered inside the native menu. */
  items: HeaderMenuItem[];
};

/**
 * A screen-owned header action that can be mapped into the current mobile
 * header implementation.
 */
export type HeaderAction = HeaderButtonAction | HeaderMenuAction;
