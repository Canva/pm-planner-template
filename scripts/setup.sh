#!/bin/bash
# One-time setup for a fresh instance of this planner. Safe to re-run —
# it won't overwrite an existing .env or re-create the admin account.
#
# Usage: bash scripts/setup.sh
set -e

cd "$(dirname "$0")/.."
ROOT="$(pwd)"

echo "=== Lifecycle Planner template setup ==="
echo "Working directory: $ROOT"
echo

# 1. .env
if [ -f .env ]; then
  echo "[1/5] .env already exists — leaving it as-is."
else
  echo "[1/5] Creating .env from .env.example..."
  cp .env.example .env
  SECRET=$(openssl rand -hex 32)
  # Portable in-place sed for both GNU and BSD sed
  sed -i.bak "s#^NEXTAUTH_SECRET=.*#NEXTAUTH_SECRET=\"$SECRET\"#" .env && rm -f .env.bak
  echo "    Generated a unique NEXTAUTH_SECRET for this instance."
fi
echo

# 2. Install dependencies
echo "[2/5] Installing dependencies (npm install)..."
npm install --no-fund --no-audit
echo

# 3. Apply database migrations
echo "[3/5] Applying database migrations..."
npx prisma generate
npx prisma migrate deploy
echo

# 4. First admin account
echo "[4/5] First admin account"
if [ -z "$ADMIN_NAME" ] || [ -z "$ADMIN_EMAIL" ]; then
  read -rp "    Your name (for the first admin account): " ADMIN_NAME
  read -rp "    Your email: " ADMIN_EMAIL
fi
export ADMIN_NAME ADMIN_EMAIL
node prisma/seed.mjs
echo

# 5. Build
echo "[5/5] Building the app..."
npm run build
echo

echo "=== Setup complete ==="
echo "Start it with:      npm run start"
echo "Or under pm2 with:  pm2 start pm2.config.js"
echo
echo "Then open the app, pick your account (the one you just created), and go to"
echo "Admin -> Settings to set your team name and monday.com/Slack integrations,"
echo "and Admin -> Team to add your team members."
echo "See SETUP_GUIDE.md for the full walkthrough."
