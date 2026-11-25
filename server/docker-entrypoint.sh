#!/bin/sh
set -e

# YouTube breaks old yt-dlp releases often; refresh on every boot so a restart picks up fixes.
pip install --no-cache-dir -q -U "yt-dlp[default,curl-cffi]" || echo "yt-dlp update failed, using installed version"

node /opt/bgutil/server/build/main.js &

exec pnpm start
