import { useMemo } from "react";
import { Platform } from "react-native";
import type {
  NativeStackHeaderItem,
  NativeStackHeaderItemButton,
  NativeStackHeaderItemMenu,
  NativeStackHeaderItemMenuAction,
  NativeStackNavigationOptions,
} from "@react-navigation/native-stack";

import type {
  HeaderAction,
  HeaderButtonAction,
  HeaderMenuAction,
  HeaderMenuItem,
} from "@/features/navigation/header-actions/types";

/**
 * Resolves screen-owned header actions into the current mobile header
 * implementation.
 *
 * Currently, this is implemented as native iOS header items via the
 * `unstable_headerRightItems` API, while Android screens should use the
 * `HeaderIconButton` component directly in their `headerRight` option. This is
 * a temporary solution until a unified header API is implemented.
 *
 * @Platform iOS only
 *
 */
export function useHeaderActions(
  actions: HeaderAction[],
): NativeStackNavigationOptions["unstable_headerRightItems"] {
  return useMemo(() => {
    const visibleActions = actions.filter((action) => action.visible !== false);

    if (Platform.OS !== "ios" || visibleActions.length === 0) {
      return undefined;
    }

    return (): NativeStackHeaderItem[] =>
      visibleActions.map((action) => {
        if (action.kind === "button") {
          return toNativeButtonHeaderItem(action);
        }

        const visibleMenuItems = action.items.filter(
          (item) => item.visible !== false,
        );

        return toNativeMenuHeaderItem(action, visibleMenuItems);
      });
  }, [actions]);
}

/**
 * Converts a visible screen-owned button action into a native iOS header
 * button item.
 */
function toNativeButtonHeaderItem(
  action: HeaderButtonAction,
): NativeStackHeaderItemButton {
  return {
    type: "button",
    label: action.label,
    icon: { type: "sfSymbol", name: action.iosIcon },
    onPress: action.onPress,
    disabled: action.disabled,
  };
}

/**
 * Converts a visible screen-owned menu action into a native iOS header menu
 * item.
 */
function toNativeMenuHeaderItem(
  action: HeaderMenuAction,
  items: HeaderMenuItem[],
): NativeStackHeaderItemMenu {
  return {
    type: "menu",
    label: action.label,
    icon: { type: "sfSymbol", name: action.iosIcon },
    disabled: action.disabled,
    menu: {
      title: action.menuTitle,
      items: items.map(toNativeMenuItem),
    },
  };
}

/**
 * Converts a header menu item into the native iOS menu action shape.
 */
function toNativeMenuItem(
  item: HeaderMenuItem,
): NativeStackHeaderItemMenuAction {
  return {
    type: "action",
    label: item.label,
    icon: item.iosIcon ? { type: "sfSymbol", name: item.iosIcon } : undefined,
    onPress: item.onPress,
    disabled: item.disabled,
  };
}
