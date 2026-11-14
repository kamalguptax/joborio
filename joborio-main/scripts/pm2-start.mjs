/**
 * PM2 entry: verify .next/static chunks, then `next start`.
 */
import { spawnSync, spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const ensure = path.join(root, "scripts", "ensure-server-build.mjs");
const nextCli = path.join(root, "node_modules", "next", "dist", "bin", "next");

const check = spawnSync(process.execPath, [ensure], {
  cwd: root,
  stdio: "inherit",
  env: process.env,
});
if (check.status !== 0) process.exit(check.status ?? 1);

const child = spawn(
  process.execPath,
  [nextCli, "start", "-H", "127.0.0.1", "-p", process.env.PORT || "3001"],
  {
    cwd: root,
    stdio: "inherit",
    env: {
      ...process.env,
      NODE_ENV: "production",
      NEXT_OUTPUT_EXPORT: "",
      NEXT_STANDALONE: "",
    },
  },
);

child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code ?? 1);
});
