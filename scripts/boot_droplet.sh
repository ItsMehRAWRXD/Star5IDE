#!/usr/bin/env bash
# -----------------------------------------------------------------------------
# boot_droplet.sh  –  “file-full” variant 🗄️
# -----------------------------------------------------------------------------
# Creates/uses a *persistent* SSH key on disk (~/.ssh/id_ed25519), uploads the
# public key to DigitalOcean if missing, then spins up a hardened Droplet using
# the same cloud-init as launch_ephemeral.sh.  Designed for developers who like
# their key to stick around (e.g. PuTTY users) – the opposite of the file-less
# flow.
# -----------------------------------------------------------------------------
# Usage examples:
#   DO_API_TOKEN=dop_v1_xxx ./boot_droplet.sh            # all defaults
#   NAME=myapp REGION=sfo3 SIZE=s-4vcpu-8gb \
#       DO_API_TOKEN=xxx ./boot_droplet.sh               # overrides
# -----------------------------------------------------------------------------

set -euo pipefail

# ──────────────────────────── Config & CLI flags ─────────────────────────────
NAME="${NAME:-screenpilot}"
REGION="${REGION:-nyc3}"
SIZE="${SIZE:-s-2vcpu-2gb}"
TOKEN="${DO_API_TOKEN:-}"
[[ ${1:-} =~ ^dop_v1_ ]] && TOKEN="$1"   # allow positional token

if [[ -z $TOKEN ]]; then
  echo "❌  DO_API_TOKEN env-var or first arg is required"; exit 1; fi
export DIGITALOCEAN_ACCESS_TOKEN="$TOKEN"

# ──────────────────── Self-priority (optional niceness) ──────────────────────
if command -v renice &>/dev/null; then renice -n -5 -p $$ &>/dev/null || true; fi

# ───────────────────────── Ensure doctl is available ─────────────────────────
if ! command -v doctl &>/dev/null; then
  echo "⬇️  Installing doctl…" >&2
  curl -sL "https://github.com/digitalocean/doctl/releases/latest/download/doctl-$(uname -s | tr 'A-Z' 'a-z')-amd64.tar.gz" | tar -xz doctl
  sudo mv doctl /usr/local/bin/
fi

# ──────────────────────── Verify / create local SSH key ──────────────────────
KEY_PATH="$HOME/.ssh/id_ed25519"
if [[ ! -f $KEY_PATH ]]; then
  echo "🔑  Generating local SSH key: $KEY_PATH"
  mkdir -p "$(dirname "$KEY_PATH")"
  ssh-keygen -t ed25519 -N "" -f "$KEY_PATH" -C "$(whoami)@$(hostname)"
fi
PUB_KEY="$(cat "$KEY_PATH.pub")"

# ───────────────────────── Upload public key if needed ───────────────────────
KEY_ID=$(doctl compute ssh-key list --no-header --format ID,PublicKey | \
        awk -v k="$PUB_KEY" '$0 ~ k {print $1}')
if [[ -z $KEY_ID ]]; then
  echo "📤  Uploading public key to DigitalOcean…"
  KEY_ID=$(doctl compute ssh-key create "${NAME}-key" \
            --public-key "$PUB_KEY" --output json | jq -r '.[0].id')
else
  echo "✅  Re-using existing key id $KEY_ID"
fi

# ───────────────────────── Build cloud-init configuration ────────────────────
CLOUDCFG=$(mktemp)
cat >"$CLOUDCFG" <<YAML
#cloud-config
timezone: America/New_York
package_update: true
package_upgrade: true
users:
  - default
  - name: rawr
    groups: [sudo,docker]
    shell: /bin/bash
    sudo: ALL=(ALL) NOPASSWD:ALL
    ssh_authorized_keys:
      - $PUB_KEY
packages:
  - ufw
  - fail2ban
  - git
  - curl
  - nodejs
  - npm
  - docker.io
runcmd:
  - ufw allow OpenSSH
  - ufw allow 80
  - ufw allow 443
  - ufw --force enable
  - systemctl enable --now docker
  - npm install -g pm2
  - echo "✅ setup complete" | systemd-cat -t cloud-init
YAML

# ─────────────────────────────  Create Droplet  ──────────────────────────────
echo "🚀  Creating droplet '$NAME'…"
IP=$(doctl compute droplet create "$NAME" \
      --region "$REGION" \
      --size "$SIZE" \
      --image ubuntu-22-04-x64 \
      --ssh-keys "$KEY_ID" \
      --user-data-file "$CLOUDCFG" \
      --tag-names web,prod \
      --wait --output json |
      jq -r '.[0].networks.v4[]|select(.type=="public")|.ip_address')

# ─────────────────────── Wait for SSH port ready ─────────────────────────────
echo "⏳  Waiting for SSH…"; for i in {1..30}; do
  timeout 3 bash -c "</dev/tcp/$IP/22" &>/dev/null && break; sleep 2; done

# ───────────────────────────  Hand-off to SSH  ───────────────────────────────
clear
echo "✅  Droplet ready at $IP — connect with:"
echo "    ssh rawr@$IP"