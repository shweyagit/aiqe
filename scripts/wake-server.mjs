import { chromium } from '@playwright/test';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

// Ensure working directory is project root (needed for cron)
const __dirname = dirname(fileURLToPath(import.meta.url));
process.chdir(resolve(__dirname, '..'));

const SERVERS = [
  'https://payment-suite-5.preview.emergentagent.com/',
];
const MAX_RETRIES = 10;
const RETRY_INTERVAL_MS = 5000;

async function wakeServer(BASE_URL) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] Waking up server at ${BASE_URL}...`);

  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        await page.goto(BASE_URL, { timeout: 30000, waitUntil: 'domcontentloaded' });

        // Look for "Wake up servers" button in the iframe
        const iframe = page.frameLocator('#contentFrame');
        const wakeButton = iframe.getByRole('button', { name: /wake up servers/i });

        try {
          await wakeButton.waitFor({ state: 'visible', timeout: 5000 });
          await wakeButton.click();
          console.log(`[${timestamp}] Clicked "Wake up servers" button`);
          await page.waitForTimeout(5000);
        } catch {
          // No wake button — server may already be up
        }

        // Also check for Accept button in nested iframe
        try {
          const acceptButton = iframe.getByRole('button', { name: /accept/i });
          await acceptButton.waitFor({ state: 'visible', timeout: 3000 });
          await acceptButton.click();
          console.log(`[${timestamp}] Clicked Accept button`);
          await page.waitForTimeout(3000);
        } catch {
          // No accept button
        }

        // Check if app is loaded
        const title = await page.title();
        if (title !== 'Loading...' && !page.url().includes('loading-preview')) {
          console.log(`[${timestamp}] Server is up (attempt ${attempt}) - Title: "${title}"`);
          return;
        }

        console.log(`[${timestamp}] Attempt ${attempt}/${MAX_RETRIES} - still loading...`);
      } catch (e) {
        console.log(`[${timestamp}] Attempt ${attempt}/${MAX_RETRIES} - ${e.message}`);
      }

      if (attempt < MAX_RETRIES) {
        await page.waitForTimeout(RETRY_INTERVAL_MS);
      }
    }

    // Final reload check after all retries
    await page.reload({ waitUntil: 'domcontentloaded', timeout: 30000 });
    const finalTitle = await page.title();
    if (finalTitle !== 'Loading...') {
      console.log(`[${timestamp}] Server is up after retries - Title: "${finalTitle}"`);
    } else {
      console.warn(`[${timestamp}] Server did not respond after ${MAX_RETRIES} attempts.`);
    }
  } finally {
    await browser.close();
  }
}

async function wakeAll() {
  for (const url of SERVERS) {
    await wakeServer(url).catch(e => {
      console.error(`[${new Date().toISOString()}] Fatal error for ${url}: ${e.message}`);
    });
  }
}

wakeAll().catch(e => {
  console.error(`[${new Date().toISOString()}] Fatal error: ${e.message}`);
  process.exit(1);
});
