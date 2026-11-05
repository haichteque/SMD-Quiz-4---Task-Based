import { createRequire } from "node:module";
import { mkdir, rename } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(new URL("../app/package.json", import.meta.url));
const { chromium } = require("playwright");

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const shotDir = path.join(root, "submission", "screenshots");
const videoDir = path.join(root, "submission");

const phone = "3001234567";
const code = "123456";
const wrongCode = "000000";

async function shot(page, name) {
  const file = path.join(shotDir, name);
  await page.screenshot({ path: file });
  console.log("Saved", name);
}

async function bodyText(page) {
  return page.locator("body").innerText();
}

async function waitForText(page, text, timeout = 45000) {
  await page.getByText(text, { exact: false }).first().waitFor({ timeout });
}

await mkdir(shotDir, { recursive: true });
await mkdir(videoDir, { recursive: true });

const browser = await chromium.launch({ channel: "chrome", headless: true });
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  recordVideo: { dir: videoDir, size: { width: 390, height: 844 } },
});
const page = await context.newPage();
page.setDefaultTimeout(45000);
page.on("console", (message) => {
  if (message.type() === "error" || message.type() === "warning") {
    console.log("browser", message.type(), message.text());
  }
});
page.on("pageerror", (error) => console.log("pageerror", error.message));
page.on("response", async (response) => {
  if (response.status() < 400) {
    return;
  }
  const url = response.url();
  if (!url.includes("googleapis.com") && !url.includes("firebase")) {
    return;
  }
  let body = "";
  try {
    body = await response.text();
  } catch {
    body = "(unreadable)";
  }
  console.log("HTTP", response.status(), url, body.slice(0, 800));
});

try {
  await page.goto("http://localhost:8081", { waitUntil: "domcontentloaded", timeout: 120000 });
  await waitForText(page, "Enter your number", 90000);
  await page.getByLabel("phone-number").fill(phone);
  await shot(page, "01-phone-entered.png");

  await page.getByLabel("send-otp").click();
  await page.waitForFunction(
    () => {
      const text = document.body.innerText;
      return text.includes("Enter the code") || text.includes("Failure") || text.includes("rejected") || text.includes("not valid") || text.includes("error");
    },
    null,
    { timeout: 60000 },
  );

  const afterSend = await bodyText(page);
  if (!afterSend.includes("Enter the code")) {
    await shot(page, "02-send-error.png");
    throw new Error("Send OTP did not open the code screen:\n" + afterSend.slice(0, 1200));
  }
  await shot(page, "02-otp-screen.png");

  await page.getByLabel("otp-code").fill(code);
  await shot(page, "03-otp-entered.png");
  await page.getByLabel("verify-otp").click();
  await waitForText(page, "Phone verified", 60000);
  await shot(page, "04-success.png");

  await page.getByLabel("start-over").click();
  await waitForText(page, "Enter your number");
  await page.getByLabel("phone-number").fill(phone);
  await page.getByLabel("send-otp").click();
  try {
    await waitForText(page, "Enter the code", 30000);
  } catch (error) {
    await shot(page, "05-failure-debug.png");
    throw new Error(`${error.message}\n${(await bodyText(page)).slice(0, 1200)}`);
  }
  await page.getByLabel("otp-code").fill(wrongCode);
  await page.getByLabel("verify-otp").click();
  await waitForText(page, "Verification failed", 60000);
  await shot(page, "05-failure.png");
} finally {
  const video = page.video();
  await context.close();
  await browser.close();
  if (video) {
    const recorded = await video.path();
    await mkdir(videoDir, { recursive: true });
    await rename(recorded, path.join(videoDir, "recording.webm"));
    console.log("Saved recording.webm");
  }
}
