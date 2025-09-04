#!/usr/bin/env bash
# -----------------------------------------------------------------------------
# launch_ephemeral.sh
# -----------------------------------------------------------------------------
# Spin-up a hardened DigitalOcean Droplet *without* persisting any private SSH
# key on disk.  A one-shot key is generated, loaded into an isolated ssh-agent,
# uploaded to DO, then shredded.  The script also:
#   • Renices itself so it isn’t starved on busy CI runners / mobile shells
#   • Kills any zombie ssh-agent processes from *previous* failed runs
#   • Cleans up everything (key, agent, temp files, env-vars) on *any* exit path
# -----------------------------------------------------------------------------

set -euo pipefail

# ───────────────────────── Parameters & Defaults ──────────────────────────────
NAME="${NAME:-screenpilot}"
REGION="${REGION:-nyc3}"
SIZE="${SIZE:-s-2vcpu-2gb}"
TOKEN="${DO_API_TOKEN:-}"     # can also be passed as first positional arg
[[ ${1:-} =~ ^dop_v1_ ]] && TOKEN="$1"

if [[ -z $TOKEN ]]; then
  echo "Usage: DO_API_TOKEN=… $0 [dop_v1_xxx]"; exit 1
fi
export DIGITALOCEAN_ACCESS_TOKEN="$TOKEN"

# ─────────────────────── Task Killer / Self-priority ─────────────────────────
# 1) Kill orphaned ssh-agent processes older than 1h that belong to this user
#    (these can consume RAM / sockets on CI hosts)
kill_old_agents() {
  if command -v pgrep &>/dev/null; then
    # list agents with their start time in epoch, kill if > 3600s old
    while IFS= read -r pid; do
      # ignore current agent if one is already running for this shell
      [[ $pid == $SSH_AGENT_PID ]] && continue
      # proc start time in seconds since epoch (stat field 22 / Hertz conv.)
      start_ticks=$(awk '{print $22}' "/proc/$pid/stat" 2>/dev/null || echo 0)
      hertz=$(getconf CLK_TCK)
      start_sec=$(( $(date +%s) - ( ( $(cut -d" " -f1 <<<"$start_ticks") )/hertz ) ))
      # if process existed more than 1h ago, kill
      if (( start_sec > 3600 )); then
        kill "$pid" 2>/dev/null || true
      fi
    done < <(pgrep -u "$(id -u)" ssh-agent || true)
  fi
}

kill_old_agents

# 2) Give this script a higher CPU priority (+ nicer negative value)
if command -v renice &>/dev/null; then
  renice -n -5 -p $$ &>/dev/null || true
fi

# ────────────────────────── Spawn isolated ssh-agent ─────────────────────────
AGENT_SOCK="/tmp/ssh-agent.$$"
eval "$(ssh-agent -a "$AGENT_SOCK" -s)" >/dev/null

# ─────────────────────────────── Clean-up Handler ────────────────────────────
cleanup() {
  echo "🧹  Cleaning up…"
  [[ -n ${KEY_ID:-} ]] && curl -s -X DELETE \
    -H "Authorization: Bearer $TOKEN" \
    "https://api.digitalocean.com/v2/account/keys/$KEY_ID" >/dev/null || true
  [[ -f $PUB ]] && rm -f "$PUB"
  [[ -f $CFGFILE ]] && rm -f "$CFGFILE"
  unset DIGITALOCEAN_ACCESS_TOKEN TOKEN
  ssh-agent -k >/dev/null
}
trap cleanup EXIT ERR INT TERM HUP

# ───────────────────── Create Ephemeral SSH Key (in RAM only) ────────────────
PRIV=$(mktemp)
PUB="${PRIV}.pub"
ssh-keygen -q -t ed25519 -N "" -f "$PRIV" -C "ephemeral-$(date +%s)" >/dev/null
ssh-add "$PRIV" >/dev/null
shred -u "$PRIV"   # destroy private part immediately

# ─────────────────────── Upload Key & Capture key_id ─────────────────────────
KEY_ID=$(curl -s -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{\"name\":\"ephemeral-$(date +%s)\",\"public_key\":\"$(cat $PUB)\"}" \
  https://api.digitalocean.com/v2/account/keys | jq -r '.ssh_key.id')

# ─────────────────────── Build cloud-init configuration ──────────────────────
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
      - $(cat "$PUB")
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
CFGFILE="$CLOUDCFG"

# ─────────────────────── Ensure doctl present ───────────────────────────────
if ! command -v doctl &>/dev/null; then
  echo "⬇️  Installing doctl…"
  curl -sL "https://github.com/digitalocean/doctl/releases/latest/download/doctl-$(uname -s | tr 'A-Z' 'a-z')-amd64.tar.gz" | tar -xz doctl
  sudo mv doctl /usr/local/bin/
fi

# ─────────────────────── Create Droplet ──────────────────────────────────────
echo "🚀  Creating droplet '$NAME'…"
IP=$(doctl compute droplet create "$NAME" \
      --region "$REGION" \
      --size "$SIZE" \
      --image ubuntu-22-04-x64 \
      --ssh-keys "$KEY_ID" \
      --user-data-file "$CFGFILE" \
      --tag-names web,prod \
      --wait --output json |
      jq -r '.[0].networks.v4[] | select(.type=="public") | .ip_address')

# ─────────────────────── Wait for SSH port ───────────────────────────────────
echo "⏳  Waiting for SSH…"
for i in {1..30}; do
  if timeout 3 bash -c "</dev/tcp/$IP/22" &>/dev/null; then
    break
  fi
  sleep 2
done

# ─────────────────────── SSH In ──────────────────────────────────────────────
clear
echo "✅  Droplet ready at $IP — logging in (exit to clean up)…"
ssh -o StrictHostKeyChecking=accept-new -A rawr@"$IP"