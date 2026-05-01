#!/bin/bash
# Double-fork daemon to keep dev server alive
cd /home/z/my-project

# Fork once
(
  # Fork twice to detach from terminal
  (
    while true; do
      bun run dev >> /home/z/my-project/dev.log 2>&1
      sleep 2
    done
  ) &
  disown
) &
disown

echo "Daemon started"
