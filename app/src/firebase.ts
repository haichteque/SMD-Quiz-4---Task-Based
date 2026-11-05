import { FirebaseApp, getApps, initializeApp } from "firebase/app";
import {
  ApplicationVerifier,
  Auth,
  ConfirmationResult,
  User,
  getAuth,
  inMemoryPersistence,
  initializeAuth,
  onAuthStateChanged,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  signOut,
} from "firebase/auth";

export type Confirmation = ConfirmationResult;
export type AuthUser = User;

const firebaseConfig = {
  apiKey: "AIzaSyC7NZbUtdAs4OD1Jn5YjbT6t6H_OjhnWHI",
  authDomain: "smd-quiz-4-task.firebaseapp.com",
  projectId: "smd-quiz-4-task",
  storageBucket: "smd-quiz-4-task.firebasestorage.app",
  messagingSenderId: "1011231402703",
  appId: "1:1011231402703:web:bcdae2072cf2285fd865ba",
};

const MESSAGES: Record<string, string> = {
  "auth/invalid-phone-number":
    "That phone number is not valid. Include the country code and digits only.",
  "auth/missing-phone-number": "Enter a phone number first.",
  "auth/invalid-verification-code": "That code is incorrect. Check the SMS and try again.",
  "auth/invalid-verification-id":
    "This verification session is no longer valid. Request a new code.",
  "auth/session-expired": "The code expired. Request a new one.",
  "auth/code-expired": "The code expired. Request a new one.",
  "auth/too-many-requests": "Too many attempts. Wait a few minutes and try again.",
  "auth/quota-exceeded": "The SMS quota for this Firebase project is used up.",
  "auth/network-request-failed": "Network error. Check the connection and try again.",
  "auth/operation-not-allowed":
    "Firebase blocked this SMS region. In Authentication settings, allow the country for this phone number.",
  "auth/captcha-check-failed":
    "App verification failed. Use a phone number saved under Firebase test numbers.",
  "auth/invalid-app-credential":
    "Firebase rejected the app credential. Check the web config in src/firebase.ts.",
  "auth/missing-client-identifier":
    "App verification failed. This Expo Go build only supports Firebase test phone numbers.",
  "auth/operation-not-supported-in-this-environment":
    "Phone sign-in is not available in this runtime. Restart Expo after the Firebase config change.",
  "auth/argument-error": "Firebase rejected the verification request. Check the phone number.",
};

function fakeRecaptchaToken(): string {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let token = "";
  for (let i = 0; i < 50; i += 1) {
    token += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return token;
}

// Expo Go has no DOM, so RecaptchaVerifier cannot be constructed. Firebase's
// React Native build accepts any ApplicationVerifier. Test phone numbers are
// the only numbers that succeed while app verification is disabled.
const testVerifier = {
  type: "recaptcha",
  verify: () => Promise.resolve(fakeRecaptchaToken()),
  // Called by the Auth SDK after each attempt. Not part of the public type.
  _reset() {
    return undefined;
  },
} as ApplicationVerifier;

let auth: Auth | null = null;

function getVerifier(instance: Auth): ApplicationVerifier {
  if (typeof document === "undefined") {
    return testVerifier;
  }
  const container = document.createElement("div");
  document.body.appendChild(container);
  return new RecaptchaVerifier(instance, container, { size: "invisible" });
}

function firebaseAuth(): Auth {
  if (auth) {
    return auth;
  }

  const app: FirebaseApp =
    getApps()[0] ??
    initializeApp({
      apiKey: firebaseConfig.apiKey,
      authDomain: firebaseConfig.authDomain,
      projectId: firebaseConfig.projectId,
      storageBucket: firebaseConfig.storageBucket,
      messagingSenderId: firebaseConfig.messagingSenderId,
      appId: firebaseConfig.appId,
    });

  try {
    auth = initializeAuth(app, { persistence: inMemoryPersistence });
  } catch {
    auth = getAuth(app);
  }
  auth.settings.appVerificationDisabledForTesting = true;
  return auth;
}

export function messageFor(error: unknown): string {
  const code =
    typeof error === "object" && error !== null && "code" in error
      ? String((error as { code: unknown }).code)
      : "";
  if (code && MESSAGES[code]) {
    return MESSAGES[code];
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return "Something went wrong. Try again.";
}

export async function sendOtp(e164: string): Promise<Confirmation> {
  const instance = firebaseAuth();
  return signInWithPhoneNumber(instance, e164, getVerifier(instance));
}

export async function verifyOtp(confirmation: Confirmation, code: string): Promise<AuthUser> {
  const credential = await confirmation.confirm(code);
  if (!credential?.user) {
    throw new Error("Verification did not return a signed-in user.");
  }
  return credential.user;
}

export async function signOutUser(): Promise<void> {
  const instance = firebaseAuth();
  if (instance.currentUser) {
    await signOut(instance);
  }
}

export function watchAuth(listener: (user: AuthUser | null) => void): () => void {
  return onAuthStateChanged(firebaseAuth(), listener);
}
