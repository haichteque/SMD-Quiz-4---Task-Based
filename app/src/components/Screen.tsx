import { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";

import { theme } from "../theme";

type Props = {
  step: string;
  title: string;
  subtitle: string;
  children: ReactNode;
};

export function Screen({ step, title, subtitle, children }: Props) {
  return (
    <View style={styles.safe}>
      <StatusBar style="dark" />
      <View style={styles.inner}>
        <Text style={styles.kicker}>PHONE VERIFICATION</Text>
        <Text style={styles.step}>{step}</Text>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
        <View style={styles.card}>{children}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: theme.bg,
    paddingTop: 56,
    paddingBottom: 24,
  },
  inner: {
    flex: 1,
    paddingHorizontal: 20,
  },
  kicker: {
    color: theme.primary,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
  step: {
    marginTop: 10,
    color: theme.muted,
    fontSize: 13,
    fontWeight: "600",
  },
  title: {
    marginTop: 4,
    color: theme.ink,
    fontSize: 30,
    fontWeight: "800",
  },
  subtitle: {
    marginTop: 8,
    color: theme.muted,
    fontSize: 15,
    lineHeight: 22,
  },
  card: {
    marginTop: 24,
    backgroundColor: theme.card,
    borderRadius: 16,
    padding: 18,
    gap: 14,
    borderWidth: 1,
    borderColor: theme.line,
  },
});