import { StyleSheet, Text, View } from "react-native";

import { PrimaryButton } from "../components/PrimaryButton";
import { Screen } from "../components/Screen";
import { formatPhone } from "../phone";
import { theme } from "../theme";

type Success = { ok: true; phone: string; uid: string };
type Failure = { ok: false; phone: string; message: string };

type Props = {
  result: Success | Failure;
  onTryAgain: () => void;
  onStartOver: () => void;
};

export function ResultScreen({ result, onTryAgain, onStartOver }: Props) {
  if (result.ok) {
    return (
      <Screen
        step="Done"
        title="Phone verified"
        subtitle="Firebase accepted the code for this number."
      >
        <View style={[styles.banner, styles.successBanner]}>
          <Text style={[styles.bannerTitle, styles.successText]}>Success</Text>
          <Text style={styles.bannerBody}>{formatPhone(result.phone)} is verified.</Text>
        </View>
        <Text style={styles.metaLabel}>Firebase user ID</Text>
        <Text accessibilityLabel="verified-uid" style={styles.metaValue}>
          {result.uid}
        </Text>
        <PrimaryButton label="Start over" accessibilityLabel="start-over" onPress={onStartOver} />
      </Screen>
    );
  }

  return (
    <Screen
      step="Done"
      title="Verification failed"
      subtitle={`Firebase rejected the code for ${formatPhone(result.phone)}.`}
    >
      <View style={[styles.banner, styles.failureBanner]}>
        <Text style={[styles.bannerTitle, styles.failureText]}>Failure</Text>
        <Text accessibilityLabel="failure-reason" style={styles.bannerBody}>
          {result.message}
        </Text>
      </View>
      <PrimaryButton label="Try again" accessibilityLabel="try-again" onPress={onTryAgain} />
      <PrimaryButton
        label="Start over"
        accessibilityLabel="start-over"
        onPress={onStartOver}
        variant="ghost"
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  banner: {
    borderRadius: 12,
    padding: 14,
    gap: 6,
  },
  successBanner: {
    backgroundColor: theme.successBg,
  },
  failureBanner: {
    backgroundColor: theme.dangerBg,
  },
  bannerTitle: {
    fontSize: 18,
    fontWeight: "800",
  },
  successText: {
    color: theme.success,
  },
  failureText: {
    color: theme.danger,
  },
  bannerBody: {
    color: theme.ink,
    fontSize: 15,
    lineHeight: 22,
  },
  metaLabel: {
    color: theme.muted,
    fontSize: 13,
    fontWeight: "600",
  },
  metaValue: {
    color: theme.ink,
    fontSize: 13,
    lineHeight: 18,
  },
});