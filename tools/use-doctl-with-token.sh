#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
KEY_FILE="$SCRIPT_DIR/.do_token.key"
ENC_FILE="$SCRIPT_DIR/.do_token.enc"

if [ ! -s "$KEY_FILE" ] || [ ! -s "$ENC_FILE" ]; then
  echo "Encrypted token or key missing. Run tools/provision-do-token.sh first." >&2
  exit 1
fi

TOKEN="$(openssl enc -aes-256-cbc -pbkdf2 -d -base64 -pass file:"$KEY_FILE" -in "$ENC_FILE")"
export DIGITALOCEAN_ACCESS_TOKEN="$TOKEN"

exec "$@"

