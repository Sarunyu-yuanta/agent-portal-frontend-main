#!/usr/bin/env node
/**
 * Scans the browser bundle (`.next/static`) for things that must not reach a
 * visitor's DevTools. Run after `next build`: `npm run check:bundle`.
 *
 * - Secret-looking strings (private keys, bearer tokens, API keys): always fail.
 * - Mock client data from `src/mocks`: fail when the build targets the real API
 *   (`NEXT_PUBLIC_API_MODE=http`), otherwise just reported, because in mock mode
 *   the app is meant to ship it.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const STATIC_DIR = ".next/static";
const apiMode = process.env.NEXT_PUBLIC_API_MODE ?? "mock";

const SECRET_PATTERNS = [
  ["private key", /-----BEGIN [A-Z ]*PRIVATE KEY-----/],
  ["bearer token", /Bearer [A-Za-z0-9\-._~+/]{20,}=*/],
  ["AWS access key", /\bAKIA[0-9A-Z]{16}\b/],
  ["API key (sk-…)", /\bsk-[A-Za-z0-9_-]{20,}\b/],
  ["JWT", /\beyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/],
];

/** Names of the mock clients: if any is in the bundle, the mock dataset is. */
const mockSentinels = JSON.parse(readFileSync("src/mocks/clients.json", "utf8"))
  .slice(0, 5)
  .map((client) => client.name);

function* jsFiles(dir) {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) yield* jsFiles(path);
    else if (path.endsWith(".js")) yield path;
  }
}

let files;
try {
  files = [...jsFiles(STATIC_DIR)];
} catch {
  console.error(`No ${STATIC_DIR} — run \`npm run build\` first.`);
  process.exit(1);
}

const secrets = [];
const mocks = new Set();
for (const file of files) {
  const source = readFileSync(file, "utf8");
  for (const [label, pattern] of SECRET_PATTERNS) {
    if (pattern.test(source)) secrets.push(`${label} in ${file}`);
  }
  if (mockSentinels.some((name) => source.includes(name))) mocks.add(file);
}

let failed = false;
if (secrets.length > 0) {
  failed = true;
  console.error("✗ Secret-looking strings in the browser bundle:");
  for (const line of secrets) console.error(`  ${line}`);
}
if (mocks.size > 0) {
  const message = `Mock client data in ${mocks.size} browser chunk(s) (API mode: ${apiMode}).`;
  if (apiMode === "http") {
    failed = true;
    console.error(`✗ ${message} A real-API build must not ship src/mocks.`);
    for (const file of mocks) console.error(`  ${file}`);
  } else {
    console.log(`• ${message} Expected in mock mode.`);
  }
}

if (failed) process.exit(1);
console.log(
  `✓ ${files.length} chunks checked: no secrets${apiMode === "http" ? ", no mock data" : ""}.`,
);
