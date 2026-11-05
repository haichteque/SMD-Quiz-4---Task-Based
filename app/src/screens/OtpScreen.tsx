import { useEffect, useState } from "react";
import { StyleSheet, Text } from "react-native";

import { PrimaryButton } from "../components/PrimaryButton";
import { Screen } from "../components/Screen";
import { TextField } from "../components/TextField";
import { formatPhone } from "../phone";
import { theme } from "../theme";

const RESEND_SECONDS = 30;

type Props = {
  phone: string;
  verifying: boolean;
  resending: boolean;
  error: string | null;
  onVerify: (code: string) => void;
  onResend: () => void;
  onChangeNumber: () => void;
};

export function OtpScreen({
  phone,
  verifying,
  resending,
  error,
  onVerify,
  onResend,
  onChangeNumber,
}: Props) {
  const [code, setCode] = useState("");
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (secondsLeft <= 0) {
      return;
    }
    const timer = setTimeout(() => setSecondsLeft((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft]);

  function submit() {
    const digits = code.replace(/\D/g, "");
    if (digits.length !== 6) {
      setLocalError("Enter the 6-digit code.");
      return;
    }
    setLocalError(null);
    onVerify(digits);
  }

  function resend() {
    setCode("");
    setLocalError(null);
    setSecondsLeft(RESEND_SECONDS);
    onResend();
  }

  const message = localError ?? error;
  const canResend = secondsLeft <= 0 && !verifying && !resending;

  return (
    <Screen step="Step 2 of 2" title="Enter the code" subtitle={`Sent to ${formatPhone(phone)}.`}>
      <TextField
        label="One-time code"
        accessibilityLabel="otp-code"
        value={code}
        onChangeText={(value) => setCode(value.replace(/\D/g, "").slice(0, 6))}
        placeholder="______"
        keyboardType="number-pad"
        maxLength={6}
        autoComplete="sms-otp"
      />
      {message ? <Text style={styles.error}>{message}</Text> : null}
      <PrimaryButton
        label="Verify"
        accessibilityLabel="verify-otp"
        onPress={submit}
        loading={verifying}
        disabled={resending}
      />
      <PrimaryButton
        label={canResend ? "Resend code" : `Resend in ${secondsLeft}s`}
        accessibilityLabel="resend-otp"
        onPress={resend}
        variant="ghost"
        disabled={!canResend}
        loading={resending}
      />
      <PrimaryButton
        label="Change number"
        accessibilityLabel="change-number"
        onPress={onChangeNumber}
        variant="ghost"
        disabled={verifying || resending}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  error: {
    color: theme.danger,
    fontSize: 14,
    lineHeight: 20,
  },
});