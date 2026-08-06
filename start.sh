#!/bin/bash
# Planner startup script (quick foreground run — for a persistent deployment
# use pm2 instead: pm2 start pm2.config.js). Run from anywhere:
#   bash start.sh

cd "$(dirname "$0")"

echo "🔄 Pulling latest changes..."
git pull

echo "🚀 Starting app server..."
npm run start &
SERVER_PID=$!

echo "⏳ Waiting for server to be ready..."
sleep 5

echo "🌐 Starting tunnel..."
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Share the 'Go to:' URL with your team"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Trap Ctrl+C to also kill the server
trap "kill $SERVER_PID 2>/dev/null; exit" INT TERM

infra highway http 3000
