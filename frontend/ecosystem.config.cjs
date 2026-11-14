/** PM2 process for the Next.js site. API calls go to https://api.joborio.com */
module.exports = {
  apps: [
    {
      name: "joborio-web",
      cwd: __dirname,
      script: "node_modules/next/dist/bin/next",
      args: "start -H 127.0.0.1 -p 3000",
      instances: 1,
      autorestart: true,
      env: {
        NODE_ENV: "production",
        PORT: "3000",
      },
    },
  ],
};
