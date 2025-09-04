#!/usr/bin/env bash
set -euo pipefail
DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$DIR/.." && pwd)"

# 1) Encrypt a message using Carmilla (OpenSSL) CLI
echo "secret text" | node "$ROOT/tools/carmilla-openssl.js" encrypt --pass demo --hint demo-hint > "$DIR/secret.pkg"
echo "[demo] packaged to $DIR/secret.pkg"

# 2) Build an injection that decrypts and prints the payload
INJECT="const { spawnSync } = require('child_process');\n"
INJECT+="const pkg = require('fs').readFileSync(require('path').join(__dirname,'secret.pkg'),'utf8');\n"
INJECT+="const out = spawnSync(process.execPath, ['${ROOT//\//\/}/tools/carmilla-openssl.js','decrypt','--pass','demo'], { input: pkg, encoding: 'utf8' });\n"
INJECT+="console.log('[injected] decrypted =>', out.stdout.toString());\n"

# 3) Patch and run target with two injection points
node "$ROOT/tools/carpatcher.js" js "$DIR/car-target.js" --patch "$INJECT" --patch "console.log('[injected] second patch');" --run

