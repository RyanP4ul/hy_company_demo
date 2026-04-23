#!/bin/bash
# Keep-alive dev server wrapper
cd /home/z/my-project

echo "[$(date)] Starting HyOps dev server with keep-alive..."

# Start the Next.js dev server
node node_modules/.bin/next dev -p 3000 &
SERVER_PID=$!

# Keep making requests every 10 seconds to prevent the server from being killed
while kill -0 $SERVER_PID 2>/dev/null; do
  sleep 10
  curl -s -o /dev/null -w "" http://localhost:3000/ --max-time 5 2>/dev/null || true
done

echo "[$(date)] Server process $SERVER_PID died. Exiting keep-alive."
