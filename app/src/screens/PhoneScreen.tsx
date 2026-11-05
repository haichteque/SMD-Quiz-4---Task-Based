import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { PrimaryButton } from "../components/PrimaryButton";
import { Screen } from "../components/Screen";
import { TextField } from "../components/TextField";
import { toE164 } from "../phone";
import { theme } from "../theme";

type Props = {
  loading: boolean;
  error: string | null;
  onSend: (e164: string) => void;
};

export function PhoneScreen({ loading, error, onSend }: Props) {
  const [countryCode, setCountryCode] = useState("+92");
  const [nationalNumber, setNationalNumber] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  function submit() {
    const e164 = toE164(countryCode, nationalNumber);
    if (!e164) {
      setLocalError("Enter a country code like +92 and a phone number of 6 to 14 digits.");
      return;
    }
    setLocalError(null);
    onSend(e164);
  }

  const message = localError ?? error;

  return (
    <Screen
      step="Step 1 of 2"
      title="Enter your number"
      subtitle="Firebase will send a 6-digit code by SMS. Test numbers use the code saved in the Firebase console."
    >
      <View style={styles.row}>
        <TextField
          label="Country"
          accessibilityLabel="country-code"
          value={countryCode}
          onChangeText={setCountryCode}
          placeholder="+92"
          maxLength={5}
          autoComplete="tel"
          width={96}
        />
        <TextField
          label="Phone number"
          accessibilityLabel="phone-number"
          value={nationalNumber}
          onChangeText={setNationalNumber}
          placeholder="3XXXXXXXXX"
          keyboardType="number-pad"
          maxLength={14}
          autoComplete="tel"
          flex={1}
        />
      </View>
      {message ? <Text style={styles.error}>{message}</Text> : null}
      <PrimaryButton
        label="Send OTP"
        accessibilityLabel="send-otp"
        onPress={submit}
        loading={loading}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: 12,
  },
  error: {
    color: theme.danger,
    fontSize: 14,
    lineHeight: 20,
  },
});