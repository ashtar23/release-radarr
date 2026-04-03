import {
  Platform,
  StyleSheet,
  Switch,
  View,
  type ViewStyle,
} from "react-native";

import { ListRow } from "@/components/list-row";
import { ThemedText } from "@/components/themed-text";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

type ListSwitchRowProps = {
  label: string;
  subtitle?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
  style?: ViewStyle;
  testID?: string;
};

/**
 * Purpose-built grouped list row with a trailing switch control.
 *
 * Use this instead of `ListRow.trailingIcon` when a row needs a real control
 * layout with label/subtitle text on the left and a `Switch` on the right.
 */
export function ListSwitchRow({
  label,
  subtitle,
  value,
  onValueChange,
  disabled,
  style,
  testID,
}: ListSwitchRowProps) {
  const theme = useTheme();
  const trackColor =
    Platform.OS === "ios"
      ? {
          false: theme.separator,
          true: theme.interactive.focusRing,
        }
      : undefined;

  return (
    <ListRow style={style} disabled={disabled}>
      <View style={styles.rowContent}>
        <View style={styles.rowText}>
          <ThemedText>{label}</ThemedText>
          {subtitle ? (
            <ThemedText type="small" themeColor="textSecondary">
              {subtitle}
            </ThemedText>
          ) : null}
        </View>
        <Switch
          value={value}
          onValueChange={onValueChange}
          disabled={disabled}
          testID={testID}
          trackColor={trackColor}
        />
      </View>
    </ListRow>
  );
}

const styles = StyleSheet.create({
  rowContent: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing.two,
  },
  rowText: {
    flex: 1,
    gap: Spacing.half,
  },
});
