/**
 * Downloads one mock photo per Thai FCN underlying into
 * `public/underlying-logos`.
 *
 * The Thai desk's rows carry no artwork — they are theme, tickers and terms —
 * so every surface that draws one next to a global product (Order Management's
 * cards and tables) had half its rows blank. These fill the gap in the same
 * currency the global desk's fixtures use: 80×80 Unsplash photographs standing
 * in for issuer artwork, served through Lorem Picsum, which is Unsplash's
 * library behind a seedable URL.
 *
 * **Seeded by the ticker**, so a run is reproducible and one underlying keeps
 * its photograph forever: QCOM US is the same picture under "Chips" as under
 * "Semiconductor", and adding a theme never reshuffles the ones already there.
 *
 * The files are committed. This is a one-off authoring tool, not a build step —
 * the app itself never reaches the network, and nothing here runs on `next
 * build`. Re-run it only after adding a theme, and only with a connection:
 *
 *     npm run logos
 */

import fs from "node:fs";
import path from "node:path";

const SRC = "src/app/(dashboard)/client/[id]/thai-structured-data.ts";
const OUT = "public/underlying-logos";
/** Matches the global desk's own `bond-logos/*.jpg`, which are 80×80. */
const SIZE = 80;

/** "NVDA US" → "nvda". Must match `underlyingLogo()` in the data module. */
const slug = (ticker) =>
  ticker.split(/\s+/)[0].toLowerCase().replace(/[^a-z0-9]+/g, "-");

const source = fs.readFileSync(SRC, "utf8");
const tickers = [
  ...new Set(
    [...source.matchAll(/bbg1:\s*"([^"]*)",\s*bbg2:\s*"([^"]*)",\s*bbg3:\s*"([^"]*)"/g)]
      .flatMap((m) => [m[1], m[2], m[3]])
      .filter(Boolean),
  ),
];

if (tickers.length === 0) {
  throw new Error(`No underlyings found in ${SRC} — has the row shape changed?`);
}

fs.mkdirSync(OUT, { recursive: true });

let written = 0;
for (const ticker of tickers) {
  const name = slug(ticker);
  const url = `https://picsum.photos/seed/${encodeURIComponent(name)}/${SIZE}`;
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok) throw new Error(`${ticker}: ${res.status} from ${url}`);
  const bytes = Buffer.from(await res.arrayBuffer());
  // A truncated or HTML response would still write a file, and a broken image
  // only shows up as a placeholder three screens away.
  if (bytes.length < 500 || bytes[0] !== 0xff || bytes[1] !== 0xd8) {
    throw new Error(`${ticker}: not a JPEG (${bytes.length} bytes)`);
  }
  fs.writeFileSync(path.join(OUT, `${name}.jpg`), bytes);
  written += 1;
  // Gentle on a free service that is doing us a favour.
  await new Promise((r) => setTimeout(r, 120));
}

console.log(`${written} photos → ${OUT}`);
