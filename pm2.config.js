const ROOT = __dirname;

// Server-side date logic (weekly summary, capacity, leaves, SSR) runs in
// whatever TZ this process starts with, regardless of the host machine's
// timezone — set it to your team's timezone, not the devbox's.
// See SETUP_GUIDE.md. Defaults to UTC if unset.
const TEAM_TZ = process.env.TEAM_TZ || "UTC";

module.exports = {
  apps: [
    {
      name: "lifecycle",
      script: "npm",
      args: "run start",
      cwd: ROOT,
      restart_delay: 3000,
      max_restarts: 10,
      env: {
        NODE_ENV: "production",
        TZ: TEAM_TZ,
      },
    },
    {
      // Canva-internal tunnel tool. If you're not on a Canva devbox, replace
      // this app with whatever gives you a public URL (ngrok, a reverse
      // proxy, etc.) — see SETUP_GUIDE.md.
      name: "tunnel",
      script: "infra",
      args: "highway http 3000",
      cwd: ROOT,
      restart_delay: 5000,
      max_restarts: 10,
    },
    // DB backup is handled by system crontab, not pm2 (more reliable than
    // pm2's cron_restart). Add this once you have your own git remote:
    //   0 */3 * * * cd <this-repo> && bash scripts/backup-db.sh >> logs/backup.log 2>&1
  ],
};
