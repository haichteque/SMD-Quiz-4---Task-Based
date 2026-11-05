import { StyleSheet, Text, TextInput, View } from "react-native";

import { theme } from "../theme";

type Props = {
  label: string;
  accessibilityLabel: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  keyboardType?: "number-pad" | "phone-pad";
  maxLength?: number;
  autoComplete?: "sms-otp" | "tel";
  flex?: number;
  width?: number;
};

export function TextField({
  label,
  accessibilityLabel,
  value,
  onChangeText,
  placeholder,
  keyboardType = "phone-pad",
  maxLength,
  autoComplete,
  flex,
  width,
}: Props) {
  return (
    <View style={[styles.wrap, flex ? { flex, minWidth: 0 } : null, width ? { width } : null]}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        accessibilityLabel={accessibilityLabel}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.muted}
        keyboardType={keyboardType}
        maxLength={maxLength}
        autoComplete={autoComplete}
        autoCorrect={false}
        style={styles.input}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 8,
  },
  label: {
    color: theme.muted,
    fontSize: 13,
    fontWeight: "600",
  },
  input: {
    minHeight: 52,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.line,
    backgroundColor: theme.inputBg,
    paddingHorizontal: 14,
    color: theme.ink,
    fontSize: 18,
    fontWeight: "600",
  },
});