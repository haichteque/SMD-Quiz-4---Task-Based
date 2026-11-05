import { ActivityIndicator, Pressable, StyleSheet, Text } from "react-native";

import { theme } from "../theme";

type Props = {
  label: string;
  accessibilityLabel: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: "primary" | "ghost" | "danger";
};

export function PrimaryButton({
  label,
  accessibilityLabel,
  onPress,
  disabled = false,
  loading = false,
  variant = "primary",
}: Props) {
  const blocked = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: blocked }}
      disabled={blocked}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        variant === "primary" && styles.primary,
        variant === "ghost" && styles.ghost,
        variant === "danger" && styles.danger,
        pressed && !blocked && styles.pressed,
        blocked && styles.disabled,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === "ghost" ? theme.primary : "#FFFFFF"} />
      ) : (
        <Text
          style={[
            styles.label,
            variant === "ghost" && styles.ghostLabel,
            variant === "danger" && styles.dangerLabel,
          ]}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 52,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  primary: {
    backgroundColor: theme.primary,
  },
  ghost: {
    backgroundColor: "transparent",
  },
  danger: {
    backgroundColor: theme.danger,
  },
  pressed: {
    opacity: 0.88,
  },
  disabled: {
    opacity: 0.55,
  },
  label: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  ghostLabel: {
    color: theme.primary,
  },
  dangerLabel: {
    color: "#FFFFFF",
  },
});