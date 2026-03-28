import { Stack, useRouter } from "expo-router";
import { Platform, View } from "react-native";

import { HeaderIconButton } from "@/components/header-icon-button";
import type {
  HeaderAction,
  HeaderButtonAction,
} from "@/features/navigation/header-actions/types";

export type HeaderActionsProps = {
  actions: HeaderAction[];
};

/**
 * Renders screen-owned top-right header actions using the current platform
 * primitives.
 *
 * iOS renders the full resolved action set via `Stack.Toolbar`. Android
 * currently supports up to two visible button actions through `headerRight`.
 * Menu actions remain intentionally deferred on Android until a clearer native
 * fallback is defined.
 */
export function HeaderActions({ actions }: HeaderActionsProps) {
  const router = useRouter();
  const resolvedActions = resolveHeaderActions(actions);
  const visibleButtonActions = resolvedActions
    .filter((action): action is HeaderButtonAction => action.kind === "button")
    .slice(0, 2);

  return (
    <>
      <Stack.Screen
        options={{
          headerRight:
            Platform.OS === "android" && visibleButtonActions.length > 0
              ? () => (
                  <View style={styles.headerButtons}>
                    {visibleButtonActions.map((action) => (
                      <HeaderIconButton
                        key={action.id}
                        onPress={() => runHeaderButtonAction(action, router)}
                        accessibilityLabel={action.label}
                        disabled={action.disabled}
                        tintColor={action.tintColor}
                        iconProps={{
                          ios: action.iosIcon,
                          android: action.androidIcon,
                          size: action.iconSize ?? 26,
                        }}
                      />
                    ))}
                  </View>
                )
              : undefined,
        }}
      />

      {Platform.OS === "ios" && resolvedActions.length > 0 ? (
        <Stack.Toolbar placement="right">
          {resolvedActions.map((action) =>
            action.kind === "button" ? (
              <Stack.Toolbar.Button
                key={action.id}
                tintColor={action.tintColor}
                icon={action.iosIcon}
                onPress={() => runHeaderButtonAction(action, router)}
                accessibilityLabel={action.label}
                disabled={action.disabled}
              />
            ) : (
              <Stack.Toolbar.Menu
                key={action.id}
                icon={action.iosIcon}
                title={action.menuTitle}
                accessibilityLabel={action.label}
                disabled={action.disabled}
              >
                {action.items.map((item) => (
                  <Stack.Toolbar.MenuAction
                    key={item.id}
                    icon={item.iosIcon}
                    onPress={item.onPress}
                    disabled={item.disabled}
                    destructive={item.destructive}
                    isOn={item.isOn}
                  >
                    {item.label}
                  </Stack.Toolbar.MenuAction>
                ))}
              </Stack.Toolbar.Menu>
            ),
          )}
        </Stack.Toolbar>
      ) : null}
    </>
  );
}

function runHeaderButtonAction(
  action: HeaderButtonAction,
  router: ReturnType<typeof useRouter>,
) {
  if ("href" in action && action.href !== undefined) {
    router.push(action.href);
    return;
  }

  action.onPress();
}

const styles = {
  headerButtons: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 4,
  },
};

function resolveHeaderActions(actions: HeaderAction[]): HeaderAction[] {
  return actions.reduce<HeaderAction[]>((resolvedActions, action) => {
    if (action.visible === false) {
      return resolvedActions;
    }

    if (action.kind === "button") {
      resolvedActions.push(action);
      return resolvedActions;
    }

    const visibleItems = action.items.filter((item) => item.visible !== false);

    if (visibleItems.length === 0) {
      return resolvedActions;
    }

    resolvedActions.push({ ...action, items: visibleItems });
    return resolvedActions;
  }, []);
}
