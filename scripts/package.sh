#!/usr/bin/env bash
# Zip the extension for store upload
set -euo pipefail
cd "$(dirname "$0")/.."
V=$(python3 -c "import json; print(json.load(open('manifest.json'))['version'])")
mkdir -p dist
Z="dist/already-$V.zip"
rm -f "$Z"
zip -r "$Z" \
  manifest.json background.js content.js content.css lib.js \
  popup.html popup.js popup.css fonts icons \
  -x "*.DS_Store"
echo "$Z"
