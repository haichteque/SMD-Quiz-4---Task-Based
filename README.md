# Phone OTP verification (Expo Go + Firebase)

React Native app that verifies a phone number with Firebase Phone Authentication. It runs in **Expo Go**. There is no custom APK.

Firebase test phone numbers do not send a real SMS, and they do not need the Blaze plan. The capture script injects a simulated SMS into the emulator so the recording shows a message arriving. Checking the code is a real Firebase Auth call.

## Firebase console

1. Create a project at [Firebase console](https://console.firebase.google.com). The free Spark plan is enough.
2. Authentication, Sign-in method: enable **Phone**.
3. Under **Phone numbers for testing**, add `+923001234567` with code `123456`.
4. Project settings, Add app, choose **Web** (not Android). The web config for this project is already in `app/src/firebase.ts`.

If you use a different test number, edit `scripts/test-config.json`. The country code on the first screen defaults to `+92`.

## Run

```
cd app
npm install
npx expo start
```

Press `a` to open the Android emulator in Expo Go, or scan the QR code with Expo Go on a phone.

## What the app does

1. Enter a phone number and tap **Send OTP**. The app calls `signInWithPhoneNumber`.
2. Enter the 6-digit code and tap **Verify**. The app calls `confirmation.confirm`.
3. Success shows the verified number and the Firebase user id. A wrong code shows the Firebase error.
4. **Resend code** is available after 30 seconds. **Change number** starts over.

Expo Go cannot render reCAPTCHA. Debug runs set `appVerificationDisabledForTesting`, so only numbers saved as Firebase test numbers can complete sign-in.

## Screenshots and recording

With the dev server running and the emulator on the phone screen:

```
powershell -ExecutionPolicy Bypass -File scripts\capture.ps1
```

The script opens `exp://10.0.2.2:8081` in Expo Go, records the screen, and writes:

- `submission/screenshots/01-phone-entered.png`
- `submission/screenshots/02-otp-screen.png`
- `submission/screenshots/03-sms-received.png`
- `submission/screenshots/04-otp-entered.png`
- `submission/screenshots/05-success.png`
- `submission/screenshots/06-failure.png`
- `submission/recording.mp4`

The SMS in that recording is simulated with `adb emu sms send`. Firebase does not deliver SMS for test numbers.
