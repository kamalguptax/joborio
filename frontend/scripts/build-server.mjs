/**
 * Server build for PM2 / `next start`.
 * Never sets output: "export" — that mode breaks CSS under PM2
 * (HTML points at static chunks that `next start` does not serve correctly).
 *
 * Static Hostinger upload: use `npm run build:dist` instead.
 */
import { existsSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const nextCli = path.join(root, "node_modules", "next", "dist", "bin", "next");

if (!existsSync(nextCli)) {
  console.error("Next.js is not installed. Run: npm ci");
  process.exit(1);
}

const env = {
  ...process.env,
  // Force server mode even if the shell still has NEXT_OUTPUT_EXPORT=1
  // from a previous `npm run dist`.
  NEXT_OUTPUT_EXPORT: "",
  NEXT_STANDALONE: "",
  NODE_ENV: "production",
  PATH:
    path.join(root, "node_modules", ".bin") +
    path.delimiter +
    (process.env.PATH || ""),
};

console.log("Building Next.js for PM2 / next start (NOT static export)…\n");

const build = spawnSync(process.execPath, [nextCli, "build"], {
  cwd: root,
  stdio: "inherit",
  env,
  shell: false,
});

if (build.error) {
  console.error("Failed to start next build:", build.error.message);
  process.exit(1);
}
if (build.status !== 0) {
  process.exit(build.status ?? 1);
}

const required = path.join(root, ".next", "required-server-files.js");
if (existsSync(required)) {
  const text = readFileSync(required, "utf8");
  if (/["']output["']\s*:\s*["']export["']/.test(text)) {
    console.error(
      "\nERROR: Build still has output:\"export\". CSS will break under PM2.",
    );
    console.error(
      "Unset NEXT_OUTPUT_EXPORT and run: npm run build  (not npm run dist)",
    );
    process.exit(1);
  }
}

console.log("\nServer build ready. Start with: pm2 start ecosystem.config.js");
console.log("Or: npm start -- -H 127.0.0.1 -p 3001");
