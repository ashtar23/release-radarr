import type { IOSSymbolName } from "@/components/app-symbol";

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
  /** Called when the user selects the menu item. */
  onPress: () => void;
};

/**
 * A single visible local header action rendered as a button on iOS.
 */
export type HeaderButtonAction = HeaderActionVisibilityState & {
  /** Marks this action as a visible header button. */
  kind: "button";
  /** Stable identifier for the action. */
  id: string;
  /** Accessibility and discoverability label for the action. */
  label: string;
  /** SF Symbol used for the native iOS header button. */
  iosIcon: IOSSymbolName;
  /** Called when the user presses the button. */
  onPress: () => void;
};

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
