import { useEffect, useState } from "react";

import {
  Confirmation,
  messageFor,
  sendOtp,
  signOutUser,
  verifyOtp,
  watchAuth,
} from "./src/firebase";
import { OtpScreen } from "./src/screens/OtpScreen";
import { PhoneScreen } from "./src/screens/PhoneScreen";
import { ResultScreen } from "./src/screens/ResultScreen";

type Step = "phone" | "otp" | "result";
type Result =
  | { ok: true; phone: string; uid: string }
  | { ok: false; phone: string; message: string };

export default function App() {
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    signOutUser().catch(() => undefined);
  }, []);

  useEffect(() => {
    if (step !== "otp") {
      return;
    }
    let isFirstEvent = true;
    return watchAuth((user) => {
      if (isFirstEvent) {
        isFirstEvent = false;
        return;
      }
      if (!user) {
        return;
      }
      setResult({ ok: true, phone: user.phoneNumber ?? phone, uid: user.uid });
      setError(null);
      setStep("result");
    });
  }, [step, phone]);

  async function handleSend(e164: string) {
    setSending(true);
    setError(null);
    try {
      const next = await sendOtp(e164);
      setPhone(e164);
      setConfirmation(next);
      setStep("otp");
    } catch (err) {
      setError(messageFor(err));
    } finally {
      setSending(false);
    }
  }

  async function handleVerify(code: string) {
    if (!confirmation) {
      setError("Request a code before verifying.");
      return;
    }
    setVerifying(true);
    setError(null);
    try {
      const user = await verifyOtp(confirmation, code);
      setResult({ ok: true, phone: user.phoneNumber ?? phone, uid: user.uid });
      setStep("result");
    } catch (err) {
      setResult({ ok: false, phone, message: messageFor(err) });
      setStep("result");
    } finally {
      setVerifying(false);
    }
  }

  async function handleStartOver() {
    setSending(true);
    try {
      await signOutUser();
    } catch {
      // A failed sign-out should not trap the demo on the result screen.
    } finally {
      setConfirmation(null);
      setResult(null);
      setPhone("");
      setError(null);
      setStep("phone");
      setSending(false);
    }
  }

  if (step === "result" && result) {
    return (
      <ResultScreen
        result={result}
        onTryAgain={() => {
          setError(null);
          setStep("otp");
        }}
        onStartOver={handleStartOver}
      />
    );
  }

  if (step === "otp") {
    return (
      <OtpScreen
        phone={phone}
        verifying={verifying}
        resending={sending}
        error={error}
        onVerify={handleVerify}
        onResend={() => handleSend(phone)}
        onChangeNumber={handleStartOver}
      />
    );
  }

  return <PhoneScreen loading={sending} error={error} onSend={(e164) => handleSend(e164)} />;
}