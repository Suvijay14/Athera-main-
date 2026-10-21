import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const filePath =
  "/Users/suvijay/Downloads/Athera App Mockup – Athera app (clickable) (1).html";
const url = `file://${encodeURI(filePath).replace(/#/g, "%23")}`;
const outDir = "/Users/suvijay/Athera/tmp-mockup-capture";

async function visibleText(page) {
  return page.evaluate(() => {
    const walk = (el) => {
      const texts = [];
      for (const node of el.childNodes) {
        if (node.nodeType === Node.TEXT_NODE) {
          const t = node.textContent?.trim();
          if (t) texts.push(t);
        } else if (node.nodeType === Node.ELEMENT_NODE) {
          const style = window.getComputedStyle(node);
          if (style.display === "none" || style.visibility === "hidden") continue;
          texts.push(...walk(node));
        }
      }
      return texts;
    };
    return [...new Set(walk(document.body))].filter((t) => t.length > 0);
  });
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 960 } });
await page.goto(url, { waitUntil: "networkidle", timeout: 120_000 });
await page.waitForTimeout(4000);

fs.mkdirSync(outDir, { recursive: true });
const steps = [];

async function snap(name) {
  const texts = await visibleText(page);
  const idx = steps.length + 1;
  await page.screenshot({
    path: path.join(outDir, `${String(idx).padStart(2, "0")}-${name}.png`),
    fullPage: false,
  });
  steps.push({ index: idx, name, texts });
}

await snap("initial");

const replay = page.getByRole("button", { name: /Replay/i });
if (await replay.count()) {
  await replay.first().click();
  await page.waitForTimeout(1000);
}

for (let i = 0; i < 24; i++) {
  await snap(`step-${i + 1}`);
  const next = page.getByRole("button", { name: /^Next$/i });
  if (!(await next.count())) break;
  if (await next.first().isDisabled().catch(() => true)) break;
  await next.first().click();
  await page.waitForTimeout(800);
}

fs.writeFileSync(path.join(outDir, "capture.json"), JSON.stringify(steps, null, 2));
console.log(JSON.stringify({ steps: steps.length, outDir }, null, 2));
await browser.close();
