/**
 * PM2 process file for JobOrio (VPS / Node-capable host).
 *
 * From repo root:
 *   pm2 start ecosystem.config.js
 *   pm2 save
 *   pm2 startup
 *
 * Next web: build with `npm run build` in frontend/ (never NEXT_OUTPUT_EXPORT / dist).
 * Then: pm2 startOrReload ecosystem.config.js --update-env && pm2 save
 */
const path = require("path");

const root = __dirname;
const frontend = path.join(root, "frontend");
const backend = path.join(root, "backend");

module.exports = {
  apps: [
    {
      name: "joborio-web",
      cwd: frontend,
      script: "node_modules/next/dist/bin/next",
      args: "start -H 0.0.0.0 -p 3000",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      max_memory_restart: "512M",
      env: {
        NODE_ENV: "production",
        PORT: "3000",
      },
    },
    {
      name: "joborio-queue",
      cwd: backend,
      script: "artisan",
      args: "queue:work --sleep=3 --tries=3 --max-time=3600",
      interpreter: "php",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      max_memory_restart: "256M",
      env: {
        APP_ENV: "production",
      },
    },
    {
      name: "joborio-scheduler",
      cwd: backend,
      script: "artisan",
      args: "schedule:work",
      interpreter: "php",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      max_memory_restart: "128M",
      env: {
        APP_ENV: "production",
      },
    },
  ],
};
