import type { Browser } from "puppeteer-core";

// On Vercel we pull a prebuilt headless Chromium; locally we reuse an installed
// Chrome/Chromium. Override the local binary with PUPPETEER_EXECUTABLE_PATH.
const REMOTE_PACK_URL =
  process.env.CHROMIUM_PACK_URL ??
  "https://github.com/Sparticuz/chromium/releases/download/v131.0.1/chromium-v131.0.1-pack.tar";

const LOCAL_CHROME_PATHS = [
  process.env.PUPPETEER_EXECUTABLE_PATH,
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium-browser",
  "/usr/bin/chromium",
];

export async function launchBrowser(): Promise<Browser> {
  const puppeteer = (await import("puppeteer-core")).default;

  if (process.env.VERCEL) {
    const chromium = (await import("@sparticuz/chromium-min"))
      .default as unknown as {
      args: string[];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      defaultViewport: any;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      headless: any;
      executablePath: (url?: string) => Promise<string>;
    };
    return puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(REMOTE_PACK_URL),
      headless: chromium.headless,
    });
  }

  const { existsSync } = await import("fs");
  const executablePath = LOCAL_CHROME_PATHS.find((p) => p && existsSync(p));
  if (!executablePath) {
    throw new Error(
      "Локальный Chrome не найден. Установите Google Chrome или задайте PUPPETEER_EXECUTABLE_PATH.",
    );
  }
  return puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
    executablePath,
  });
}
