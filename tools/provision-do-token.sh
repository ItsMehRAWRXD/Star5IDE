#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
KEY_FILE="$SCRIPT_DIR/.do_token.key"
ENC_FILE="$SCRIPT_DIR/.do_token.enc"

mkdir -p "$SCRIPT_DIR"

if [ ! -s "$KEY_FILE" ]; then
  umask 077
  head -c 32 /dev/urandom | base64 > "$KEY_FILE"
fi

TOKEN_INPUT="${1-}"
if [ -z "$TOKEN_INPUT" ]; then
  # Read token from stdin (recommended to avoid shell history)
  TOKEN="$(cat)"
else
  TOKEN="$TOKEN_INPUT"
fi

# Trim CR/LF
TOKEN="$(printf "%s" "$TOKEN" | tr -d '\r\n')"
if [ -z "$TOKEN" ]; then
  echo "No token provided on stdin or as argument" >&2
  exit 1
fi

umask 077
printf "%s" "$TOKEN" | openssl enc -aes-256-cbc -pbkdf2 -salt -base64 -pass file:"$KEY_FILE" -out "$ENC_FILE"

echo "Encrypted token written to $ENC_FILE"
echo "Key stored at $KEY_FILE (kept local; gitignored)"

