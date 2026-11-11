/**
 * JobOrio Next.js on PM2 (Nginx → 127.0.0.1:3001).
 *
 * If browser shows /_next/static/chunks/*.css 404:
 *   Next is running, but .next/static is missing/incomplete on THIS machine.
 *
 * Fix ON THE SERVER (same folder PM2 uses as cwd):
 *
 *   cd /www/wwwroot/joborio.com
 *   rm -rf .next out dist
 *   npm ci
 *   npm run build
 *   ls .next/static/chunks/*.css
 *   pm2 delete joborio || true
 *   pm2 start ecosystem.config.js
 *   pm2 save
 *   CSS=$(ls .next/static/chunks/*.css | head -1 | xargs -n1 basename)
 *   curl -sI "http://127.0.0.1:3001/_next/static/chunks/$CSS" | head -5
 *   # Expect HTTP/1.1 200. Then purge Cloudflare cache for /_next/*
 *
 * Never use `npm run dist` with PM2.
 */
module.exports = {
  apps: [
    {
      name: "joborio",
      cwd: __dirname,
      script: "scripts/pm2-start.mjs",
      interpreter: "node",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      max_restarts: 15,
      min_uptime: "5s",
      exp_backoff_restart_delay: 2000,
      max_memory_restart: "512M",
      error_file: "logs/joborio-error.log",
      out_file: "logs/joborio-out.log",
      merge_logs: true,
      time: true,
      env: {
        NODE_ENV: "production",
        PORT: "3001",
        NEXT_OUTPUT_EXPORT: "",
        NEXT_STANDALONE: "",
      },
    },
  ],
};
