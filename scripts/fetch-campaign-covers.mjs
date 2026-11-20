/**
 * Downloads the real promotion artwork from Yuanta's CMS into `public/campaigns`.
 *
 * The ten promotions in `src/data/campaigns.json` are transcribed from
 * yuanta.co.th/promotion, so their covers come from the same place rather than
 * from `generate-campaign-covers.mjs`: a drawn gradient behind a campaign whose
 * copy is verbatim reads as a placeholder next to the real banner the client
 * will have already seen on the public site.
 *
 * The events have no public counterpart and keep their generated SVGs — the two
 * scripts divide by that line, and each refuses to touch the other's files:
 * this one writes only `.webp`, the generator only `.svg`.
 *
 * **Why resize.** The upstream banners are print-weight — one is 4500×2354 at
 * 15 MB — and the card crops them to a 16:9 thumbnail. Each is refitted to
 * 960×540, the same frame the generated covers use, which is what keeps the
 * grid from pulling 20 MB to paint ten cards.
 *
 * The output is committed. This is a one-off authoring tool, not a build step —
 * re-run it only after adding a promotion to the fixture:
 *
 *     npm run covers:fetch
 */

import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const SRC = "src/data/campaigns.json";
const OUT = "public/campaigns";
const BASE = "https://www.yuanta.co.th/cms/uploads";
/** 16:9 — the aspect the card and detail banners both crop to. */
const WIDTH = 960;
const HEIGHT = 540;

/**
 * Campaign id → the file the public site serves for it.
 *
 * Taken by reading `/promotion`'s markup in document order, where each card's
 * `/blog/…` href is immediately followed by its own `<img>`. Recorded here
 * rather than re-scraped on every run: the listing is paginated and reordered
 * as campaigns open and close, so a scrape would silently repoint a cover at
 * whichever campaign happened to take that slot.
 *
 * The `medium_` prefix is the CMS's own derivative, not a size we chose — those
 * entries have no larger original exposed.
 */
const SOURCES = {
  "cmp-global-rewards": "01_Global_bonds_CMS_6bb49f757f.webp",
  "cmp-openacc-400": "25_YTR_26_06_fb55162176.webp",
  "cmp-global-cost": "1_Global_Banner_77_1982f30520.webp",
  "cmp-ytreward-2026": "11_Promotion_Open_Ac_02_1_c7e8a95618.webp",
  "cmp-aomwise-dual": "medium_05_Aomwise_03_a72fe3d1a1.webp",
  "cmp-dr-qqqm19": "medium_12_cms_d370c5226e.webp",
  "cmp-aomwise-fgf": "medium_18_SEO_c28376d8fc.webp",
  "cmp-vietnam-x2": "medium_10_02_cf8f9ed703.webp",
  "cmp-stock-transfer": "medium_11_5_06_78a15a4e46.webp",
  "cmp-voice-survey": "medium_End_Banner_1069_602_25d775a9fb.webp",
};

const campaigns = JSON.parse(fs.readFileSync(SRC, "utf8"));
fs.mkdirSync(OUT, { recursive: true });

let written = 0;
for (const campaign of campaigns) {
  // A `.svg` cover belongs to the generator; leaving it alone is what stops the
  // two scripts from overwriting each other's output on an interleaved run.
  if (!campaign.cover.endsWith(".webp")) continue;

  const source = SOURCES[campaign.id];
  if (!source) {
    throw new Error(`${campaign.id}: cover is a .webp but no upstream file is recorded in SOURCES`);
  }

  const response = await fetch(`${BASE}/${source}`, {
    headers: { "User-Agent": "Mozilla/5.0" },
  });
  if (!response.ok) {
    throw new Error(`${campaign.id}: ${source} → HTTP ${response.status}`);
  }

  // `cover`, not `contain`: the banners run between 1.78 and 1.91, so the two
  // widest lose a sliver off each side rather than gaining letterbox bars that
  // the card's own dark overlay would then sit on top of.
  const out = await sharp(Buffer.from(await response.arrayBuffer()))
    .resize(WIDTH, HEIGHT, { fit: "cover", position: "centre" })
    .webp({ quality: 82 })
    .toBuffer();

  fs.writeFileSync(path.join("public", campaign.cover), out);
  console.log(`${campaign.id} ← ${source}  ${(out.length / 1024).toFixed(0)} KB`);
  written += 1;
}

console.log(`${written} covers → ${OUT}`);
