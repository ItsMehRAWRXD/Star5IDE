#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

APP_ID="${1-}"
if [ -z "$APP_ID" ]; then
  APP_ID="$(doctl apps list --format ID,DefaultIngress | awk '/lionfish-app-ey7kn/ {print $1; exit}')"
fi

if [ -z "$APP_ID" ]; then
  echo "Unable to resolve APP_ID. Pass it explicitly as first arg or ensure the ingress matches." >&2
  exit 1
fi

doctl apps create-deployment "$APP_ID" --force-rebuild --wait

echo "Deployment completed for $APP_ID"

