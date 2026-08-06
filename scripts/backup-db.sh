#!/bin/bash
# Auto-backup: dumps the SQLite database to a SQL file and pushes to GitHub.
# Runs every 3 hours via PM2 cron. If the devbox is wiped, restore by running:
#   sqlite3 prisma/dev.db < prisma/backup.sql

cd "$(dirname "$0")/.."

echo "[backup] Starting backup at $(date)"

# Dump the database
if ! sqlite3 prisma/dev.db .dump > prisma/backup.sql; then
  echo "[backup] ERROR: sqlite3 dump failed"
  exit 1
fi

echo "[backup] DB dumped ($(wc -l < prisma/backup.sql) lines)"

# Stage the file (handles both new and modified)
git add prisma/backup.sql

# Check if there is anything to commit
if git diff --cached --quiet; then
  echo "[backup] No changes since last backup, skipping commit."
  exit 0
fi

# Pull latest first to avoid push rejection
git pull --rebase --autostash origin main 2>&1 || echo "[backup] Pull had issues, attempting push anyway"

git commit -m "chore: auto-backup $(date '+%Y-%m-%d %H:%M %Z')"

if git push origin main; then
  echo "[backup] Backup pushed to GitHub successfully at $(date)"
else
  echo "[backup] ERROR: git push failed — backup committed locally but not pushed"
  exit 1
fi
