#!/usr/bin/env bash
set -euo pipefail

# Usage: GITHUB_TOKEN=... ./export_all_repos.sh ItsMehRAWRXD

if [[ -z "${1:-}" ]]; then
  echo "Usage: GITHUB_TOKEN=... $0 <github-username>" >&2
  exit 1
fi

if [[ -z "${GITHUB_TOKEN:-}" ]]; then
  echo "GITHUB_TOKEN env var required" >&2
  exit 1
fi

USER="$1"
BASE_DIR="/workspace/fleet_all"
mkdir -p "$BASE_DIR"

api() {
  curl -s -H "Authorization: token $GITHUB_TOKEN" -H "Accept: application/vnd.github+json" "$1"
}

create_repo() {
  local name="$1"
  local desc="$2"
  curl -s -X POST -H "Authorization: token $GITHUB_TOKEN" -H "Accept: application/vnd.github+json" \
    https://api.github.com/user/repos \
    -d "{\"name\":\"$name\",\"private\":false,\"description\":\"$desc\"}" >/dev/null || true
}

push_repo() {
  local dir="$1" name="$2"
  (cd "$dir" && git remote remove origin >/dev/null 2>&1 || true)
  (cd "$dir" && git remote add origin "https://x-access-token:$GITHUB_TOKEN@github.com/$USER/$name.git")
  (cd "$dir" && git push -u origin main >/dev/null 2>&1 || true)
}

echo "Discovering repositories for $USER ..." >&2
REPOS=$(api "https://api.github.com/user/repos?per_page=100" | python3 - <<'PY'
import sys, json
data=json.load(sys.stdin)
for r in data:
    print(r.get('name',''))
PY
)

for repo in $REPOS; do
  [[ -z "$repo" ]] && continue
  echo "Processing repo: $repo" >&2
  # Clone minimal
  WORK="${BASE_DIR}/${repo}__origin"
  rm -rf "$WORK"
  git clone --quiet --no-checkout "https://x-access-token:${GITHUB_TOKEN}@github.com/${USER}/${repo}.git" "$WORK" || { echo "skip $repo" >&2; continue; }
  (cd "$WORK" && git fetch --all --quiet)
  BRANCHES=$(cd "$WORK" && git ls-remote --heads origin | awk '{print $2}' | sed -e 's#refs/heads/##g')
  for b in $BRANCHES; do
    # Skip default branch
    DEFAULT=$(api "https://api.github.com/repos/$USER/$repo" | python3 - <<'PY'
import sys, json
print(json.load(sys.stdin).get('default_branch','main'))
PY
)
    if [[ "$b" == "$DEFAULT" ]]; then continue; fi
    slug=$(echo "$b" | tr '[:upper:]' '[:lower:]' | sed -E 's/[^a-z0-9]+/-/g; s/^-+//; s/-+$//')
    [[ -z "$slug" ]] && continue
    name="export-${repo}-${slug}"
    dest="${BASE_DIR}/${name}"
    rm -rf "$dest" && mkdir -p "$dest"
    (cd "$WORK" && git archive --format=tar "origin/$b") | tar -C "$dest" -xf - || true
    (cd "$dest" && rm -rf .git node_modules out dist build .next .cache || true)
    (cd "$dest" && git init -b main >/dev/null && git add -A && git commit -m "chore: export from $repo@$b" >/dev/null || true)
    create_repo "$name" "Exported files from $repo branch $b"
    push_repo "$dest" "$name"
    echo "$repo/$b -> https://github.com/$USER/$name"
  done
done

echo "Done." >&2
