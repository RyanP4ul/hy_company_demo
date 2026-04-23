#!/bin/bash
cd /home/z/my-project
while true; do
  echo "[$(date)] Starting dev server..."
  node node_modules/.bin/next dev -p 3000 2>&1
  echo "[$(date)] Server stopped, restarting in 2s..."
  sleep 2
done
