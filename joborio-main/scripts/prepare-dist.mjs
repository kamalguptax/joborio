import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const distDir = path.join(root, "dist");
const outDir = path.join(root, "out");

function nextPaths() {
  const base = path.join(root, "node_modules", "next");
  return {
    pkg: path.join(base, "package.json"),
    hook: path.join(base, "dist", "server", "require-hook.js"),
    cli: path.join(base, "dist", "bin", "next"),
  };
}

function isNextReady() {
  const { pkg, hook, cli } = nextPaths();
  return existsSync(pkg) && existsSync(hook) && existsSync(cli);
}

const env = {
  ...process.env,
  NEXT_OUTPUT_EXPORT: "1",
  NEXT_STANDALONE: "",
  NEXT_PUBLIC_API_URL:
    process.env.NEXT_PUBLIC_API_URL ||
    "https://api.joborio.com",
};

if (!isNextReady()) {
  console.error("Next.js is not installed correctly.");
  console.error("Run: npm run reinstall");
  process.exit(1);
}

const { cli: nextCli } = nextPaths();
const binPath = path.join(root, "node_modules", ".bin");
const buildEnv = {
  ...env,
  PATH: binPath + path.delimiter + (env.PATH || process.env.PATH || ""),
};

console.log("Static export for shared hosting (API:", env.NEXT_PUBLIC_API_URL, ")");
console.log("(Usually 3–8 minutes…)\n");

const build = spawnSync(process.execPath, [nextCli, "build"], {
  cwd: root,
  stdio: "inherit",
  env: buildEnv,
  shell: false,
});

if (build.error) {
  console.error("\nFailed to start next build:", build.error.message);
  process.exit(1);
}
if (build.status !== 0) {
  console.error(`\nnext build failed (exit code ${build.status}).`);
  process.exit(build.status ?? 1);
}

if (!existsSync(outDir)) {
  console.error("\nExpected out/ folder from static export. Check next.config output: export.");
  process.exit(1);
}

function publishDist() {
  if (!existsSync(distDir)) {
    cpSync(outDir, distDir, { recursive: true });
    return;
  }
  try {
    rmSync(distDir, { recursive: true, force: true, maxRetries: 2, retryDelay: 200 });
    cpSync(outDir, distDir, { recursive: true });
  } catch (err) {
    if (process.platform !== "win32" || err?.code !== "EPERM") throw err;
    console.warn("\ndist is locked. Mirroring out/ into dist/ without deleting the folder.");
    const mirror = spawnSync(
      "robocopy",
      [outDir, distDir, "/MIR", "/NFL", "/NDL", "/NJH", "/R:1", "/W:1"],
      { stdio: "inherit", windowsHide: true },
    );
    const code = mirror.status ?? 16;
    if (code >= 8) {
      console.error(`\nCould not update dist (robocopy exit ${code}). Close anything using frontend/dist and run npm run dist again.`);
      process.exit(code);
    }
  }
}

publishDist();

const htaccessSrc = path.join(root, "public", "_hostinger.htaccess");
const htaccessDst = path.join(distDir, ".htaccess");
if (existsSync(htaccessSrc)) {
  writeFileSync(htaccessDst, readFileSync(htaccessSrc, "utf8"));
}

console.log("\nCreated frontend/dist (static HTML — upload ALL files to public_html).");
console.log("Includes .htaccess for /p/{handle} and other dynamic URLs on Apache.");
console.log("Backend CORS + API:", env.NEXT_PUBLIC_API_URL);
