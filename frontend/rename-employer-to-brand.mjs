// Moves the brand dashboard from /employer/* to /brand/* (URLs only).
// API paths (/api/v1/employer), role names and "@/lib/api/employer" imports are NOT touched.
//
// Run from the frontend folder:   node rename-employer-to-brand.mjs
//
// What it does
//   app/employer/<everything>        -> app/brand/(portal)/<everything>   (URL: /brand/...)
//   app/employer/onboarding          -> app/brand/setup                   (URL: /brand/setup)
//   "/employer/..." links and regexes in app, components, lib (except lib/api), scripts,
//   README.md and public/_hostinger.htaccess are rewritten to "/brand/...".
//
// (portal) is a Next.js route group: it is not part of the URL, but it keeps the dashboard
// login-guard layout away from /brand/login, /brand/register, /brand/verify, /brand/onboarding.

import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const p = (...a) => path.join(root, ...a);
const fail = (msg) => {
  console.error(`\nERROR: ${msg}\n`);
  process.exit(1);
};

if (!fs.existsSync(p("package.json")) || !fs.existsSync(p("app"))) {
  fail("Run this from the frontend folder (the one that contains package.json and app/).");
}
const portal = p("app", "brand", "(portal)");
if (fs.existsSync(portal)) fail("Already migrated: app/brand/(portal) exists.");
if (!fs.existsSync(p("app", "employer"))) fail("app/employer not found, nothing to move.");

// ---------------------------------------------------------------- 1. move folders
fs.mkdirSync(portal, { recursive: true });
for (const name of fs.readdirSync(p("app", "employer"))) {
  const from = p("app", "employer", name);
  const to = name === "onboarding" ? p("app", "brand", "setup") : path.join(portal, name);
  if (fs.existsSync(to)) fail(`${path.relative(root, to)} already exists.`);
  fs.renameSync(from, to);
}
fs.rmSync(p("app", "employer"), { recursive: true, force: true });

// ---------------------------------------------------------------- 2. rewrite links
const EXT = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".md"]);
const SKIP_DIRS = new Set(["node_modules", ".next", "out", "dist", ".git"]);
const SKIP_PREFIX = [path.join("lib", "api") + path.sep];

function* walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(e.name)) continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) yield* walk(full);
    else yield full;
  }
}

function transform(src) {
  let s = src;
  // Company setup for an existing account (was /employer/onboarding).
  s = s.replace(/(["'`])\/employer\/onboarding(?=["'`/?#])/g, "$1/brand/setup");
  // Any other quoted route: "/employer", "/employer/x", `/employer/${id}`
  s = s.replace(/(["'`])\/employer(?=[/"'`?#])/g, "$1/brand");
  // Regex literals such as /^\/employer\/programs\/([^/]+)/
  s = s.replace(/\\\/employer\\\//g, "\\/brand\\/");
  // Comments / docs that mention the dashboard URL (but never the API path).
  s = s.replace(/(?<!v1)\/employer\/dashboard/g, "/brand/dashboard");
  return s;
}

let changedFiles = 0;
const roots = ["app", "components", "lib", "scripts"].filter((d) => fs.existsSync(p(d)));
const files = [...roots.flatMap((d) => [...walk(p(d))]), p("README.md")].filter((f) => fs.existsSync(f));
for (const file of files) {
  const rel = path.relative(root, file);
  if (!EXT.has(path.extname(file))) continue;
  if (SKIP_PREFIX.some((x) => rel.startsWith(x))) continue;
  const before = fs.readFileSync(file, "utf8");
  const after = transform(before);
  if (after !== before) {
    fs.writeFileSync(file, after);
    changedFiles++;
  }
}

// Apache rewrites for the static export (dynamic /brand/programs/{id} URLs).
const htaccess = p("public", "_hostinger.htaccess");
if (fs.existsSync(htaccess)) {
  const before = fs.readFileSync(htaccess, "utf8");
  const after = before.replace(/employer\/programs/g, "brand/programs");
  if (after !== before) {
    fs.writeFileSync(htaccess, after);
    changedFiles++;
  }
}

// ---------------------------------------------------------------- 3. targeted edits
function patch(rel, from, to) {
  const file = p(...rel.split("/"));
  if (!fs.existsSync(file)) return console.warn(`  skipped (missing): ${rel}`);
  let s = fs.readFileSync(file, "utf8");
  const eol = s.includes("\r\n") ? "\r\n" : "\n";
  const a = from.replace(/\n/g, eol);
  const b = to.replace(/\n/g, eol);
  if (!s.includes(a)) return console.warn(`  could not patch ${rel} (text not found, check it by hand)`);
  fs.writeFileSync(file, s.replace(a, b));
}

// /brand/login, /brand/register, /brand/verify, /brand/onboarding stay public; the rest is the portal.
patch(
  "lib/auth/redirect.ts",
  `  if (p.startsWith("/brand")) return f.isEmployer;`,
  `  if (p === "/brand" || p.startsWith("/brand/")) {
    const open = ["/brand/login", "/brand/register", "/brand/verify", "/brand/onboarding"];
    if (open.some((x) => p === x || p.startsWith(\`\${x}/\`))) return true;
    return f.isEmployer;
  }`,
);
patch(
  "components/layout/DashboardGlobalSearch.tsx",
  `href.startsWith("/brand") || href.startsWith("/brand")`,
  `href.startsWith("/brand")`,
);

console.log(`\nDone. Moved app/employer -> app/brand/(portal) (+ onboarding -> app/brand/setup).`);
console.log(`Rewrote links in ${changedFiles} files.`);
console.log(`Next: delete the .next folder, then run  npm run dev  (or npm run build).`);
