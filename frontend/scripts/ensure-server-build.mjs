/**
 * Guard for `npm start` / PM2: refuse broken builds that cause CSS/JS 404s.
 */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const nextDir = path.join(root, ".next");
const required = path.join(nextDir, "required-server-files.js");
const buildIdPath = path.join(nextDir, "BUILD_ID");
const chunksDir = path.join(nextDir, "static", "chunks");

function fail(lines) {
  console.error("");
  for (const line of lines) console.error(line);
  console.error("");
  process.exit(1);
}

if (!existsSync(buildIdPath) || !existsSync(required)) {
  fail([
    "No server build found (.next missing).",
    "Run: npm run build",
    "Do NOT use: npm run dist  (Apache/static upload only)",
  ]);
}

const text = readFileSync(required, "utf8");
if (/["']output["']\s*:\s*["']export["']/.test(text)) {
  fail([
    "This .next folder is a STATIC EXPORT build.",
    "PM2 / next start cannot serve CSS → unstyled site + chunk 404s.",
    "Fix:",
    "  rm -rf .next out dist",
    "  npm run build",
    "  pm2 delete joborio || true",
    "  pm2 start ecosystem.config.js",
  ]);
}

if (!existsSync(chunksDir)) {
  fail([
    "Missing .next/static/chunks — HTML will 404 every CSS/JS file.",
    "The build is incomplete or static assets were deleted after build.",
    "Fix:",
    "  rm -rf .next",
    "  npm run build",
    "  ls .next/static/chunks/*.css   # must list files",
    "  pm2 restart joborio --update-env",
  ]);
}

const css = readdirSync(chunksDir).filter((f) => f.endsWith(".css"));
const js = readdirSync(chunksDir).filter((f) => f.endsWith(".js"));
if (css.length < 1 || js.length < 5) {
  fail([
    `Broken static assets: ${css.length} css, ${js.length} js in .next/static/chunks`,
    "Rebuild on THIS server (do not copy only HTML):",
    "  rm -rf .next && npm run build && pm2 restart joborio",
  ]);
}

const buildId = readFileSync(buildIdPath, "utf8").trim();
const sampleCss = path.join(chunksDir, css[0]);
const size = statSync(sampleCss).size;
console.log(
  `[joborio] server build OK  BUILD_ID=${buildId}  chunks=${js.length}js/${css.length}css  sample=${css[0]} (${size}b)`,
);
