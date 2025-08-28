#!/usr/bin/env bash

set -euo pipefail

# Minimal multi-provider LLM API scanner
# - Probes major OpenAI-compatible hosts and common local servers
# - Uses tiny prompts and short timeouts
# - Skips providers without required env vars
#
# Providers and expected env vars:
#   OpenRouter  : OPENROUTER_API_KEY [OPENROUTER_MODEL]
#   DeepSeek    : DEEPSEEK_API_KEY   [DEEPSEEK_MODEL]
#   Moonshot    : MOONSHOT_API_KEY   [MOONSHOT_MODEL]
#   Together    : TOGETHER_API_KEY   [TOGETHER_MODEL]
#   Fireworks   : FIREWORKS_API_KEY  [FIREWORKS_MODEL]
#   Groq        : GROQ_API_KEY       [GROQ_MODEL]
#   HuggingFace : HF_TOKEN           [HF_MODEL]
#   Local: Ollama (no key), vLLM (no key), Kobold (no key), textgen-webui (no key)
#
# Usage examples:
#   bash scripts/scan_llm_apis.sh           # probe everything available
#   OPENROUTER_API_KEY=... bash scripts/scan_llm_apis.sh openrouter deepseek
#

MAX_TIME=${MAX_TIME:-8}
PROMPT=${PROMPT:-"ping"}

has_cmd() { command -v "$1" >/dev/null 2>&1; }

print_divider() { printf '\n%s\n' "========================================"; }

req() {
  local name="$1"; shift
  local method="$1"; shift
  local url="$1"; shift
  local headers=("$@")
  local data

  if [[ "$method" == POST:* ]]; then
    data="${method#POST:}"
    method="POST"
  fi

  print_divider
  echo "[${name}] ${method} ${url}"
  echo "Timeout: ${MAX_TIME}s"

  if [[ "${method}" == "POST" ]]; then
    curl -sS --max-time "${MAX_TIME}" -X POST \
      "${url}" \
      -H "Content-Type: application/json" \
      ${headers[@]/#/-H } \
      -d "${data}" | head -c 800; echo
  else
    curl -sS --max-time "${MAX_TIME}" -X GET \
      "${url}" \
      ${headers[@]/#/-H } | head -c 800; echo
  fi
}

probe_openrouter() {
  [[ -z "${OPENROUTER_API_KEY:-}" ]] && echo "[openrouter] skipped (set OPENROUTER_API_KEY)" && return 0
  local model="${OPENROUTER_MODEL:-nousresearch/hermes-3-llama-3.1-8b}"
  local url="https://openrouter.ai/api/v1/chat/completions"
  local body
  body=$(cat <<JSON
{ "model":"${model}", "messages":[{"role":"user","content":"${PROMPT}"}], "max_tokens":64 }
JSON
)
  req "openrouter" "POST:${body}" "${url}" \
    "Authorization: Bearer ${OPENROUTER_API_KEY}" \
    "X-Title: scanner" \
    "HTTP-Referer: https://local.test"
}

probe_deepseek() {
  [[ -z "${DEEPSEEK_API_KEY:-}" ]] && echo "[deepseek] skipped (set DEEPSEEK_API_KEY)" && return 0
  local model="${DEEPSEEK_MODEL:-deepseek-chat}"
  local url="https://api.deepseek.com/v1/chat/completions"
  local body
  body=$(cat <<JSON
{ "model":"${model}", "messages":[{"role":"user","content":"${PROMPT}"}], "max_tokens":64 }
JSON
)
  req "deepseek" "POST:${body}" "${url}" \
    "Authorization: Bearer ${DEEPSEEK_API_KEY}"
}

probe_moonshot() {
  [[ -z "${MOONSHOT_API_KEY:-}" ]] && echo "[moonshot] skipped (set MOONSHOT_API_KEY)" && return 0
  local model="${MOONSHOT_MODEL:-moonshot-v1-8k}"
  local url="https://api.moonshot.cn/v1/chat/completions"
  local body
  body=$(cat <<JSON
{ "model":"${model}", "messages":[{"role":"user","content":"${PROMPT}"}], "max_tokens":64 }
JSON
)
  req "moonshot" "POST:${body}" "${url}" \
    "Authorization: Bearer ${MOONSHOT_API_KEY}"
}

probe_together() {
  [[ -z "${TOGETHER_API_KEY:-}" ]] && echo "[together] skipped (set TOGETHER_API_KEY)" && return 0
  local model="${TOGETHER_MODEL:-NousResearch/Nous-Hermes-2-Mixtral-8x7B-DPO}"
  local url="https://api.together.xyz/v1/chat/completions"
  local body
  body=$(cat <<JSON
{ "model":"${model}", "messages":[{"role":"user","content":"${PROMPT}"}], "max_tokens":64 }
JSON
)
  req "together" "POST:${body}" "${url}" \
    "Authorization: Bearer ${TOGETHER_API_KEY}"
}

probe_fireworks() {
  [[ -z "${FIREWORKS_API_KEY:-}" ]] && echo "[fireworks] skipped (set FIREWORKS_API_KEY)" && return 0
  local model="${FIREWORKS_MODEL:-accounts/fireworks/models/llama-v3p1-8b-instruct}"
  local url="https://api.fireworks.ai/inference/v1/chat/completions"
  local body
  body=$(cat <<JSON
{ "model":"${model}", "messages":[{"role":"user","content":"${PROMPT}"}], "max_tokens":64 }
JSON
)
  req "fireworks" "POST:${body}" "${url}" \
    "Authorization: Bearer ${FIREWORKS_API_KEY}"
}

probe_groq() {
  [[ -z "${GROQ_API_KEY:-}" ]] && echo "[groq] skipped (set GROQ_API_KEY)" && return 0
  local model="${GROQ_MODEL:-llama-3.1-70b-versatile}"
  local url="https://api.groq.com/openai/v1/chat/completions"
  local body
  body=$(cat <<JSON
{ "model":"${model}", "messages":[{"role":"user","content":"${PROMPT}"}], "max_tokens":64 }
JSON
)
  req "groq" "POST:${body}" "${url}" \
    "Authorization: Bearer ${GROQ_API_KEY}"
}

probe_hf() {
  [[ -z "${HF_TOKEN:-}" ]] && echo "[huggingface] skipped (set HF_TOKEN)" && return 0
  local model_path="${HF_MODEL:-meta-llama/Llama-3-8b-instruct}"
  local url="https://api-inference.huggingface.co/models/${model_path}"
  local body
  body=$(cat <<JSON
{ "inputs":"${PROMPT}", "parameters": {"max_new_tokens": 32} }
JSON
)
  req "huggingface" "POST:${body}" "${url}" \
    "Authorization: Bearer ${HF_TOKEN}"
}

probe_ollama() {
  local url="http://localhost:11434/api/chat"
  local body
  local model="${OLLAMA_MODEL:-llama3}"
  body=$(cat <<JSON
{ "model":"${model}", "messages":[{"role":"user","content":"${PROMPT}"}], "stream": false }
JSON
)
  req "ollama" "POST:${body}" "${url}"
}

probe_vllm() {
  local base="${VLLM_BASE_URL:-http://localhost:8000}"
  local url="${base%/}/v1/chat/completions"
  local model="${VLLM_MODEL:-your-loaded-model-name}"
  local body
  body=$(cat <<JSON
{ "model":"${model}", "messages":[{"role":"user","content":"${PROMPT}"}], "max_tokens":64 }
JSON
)
  req "vllm" "POST:${body}" "${url}"
}

probe_kobold() {
  local url="${KOBOLD_URL:-http://localhost:5001}/api/v1/generate"
  local body
  body=$(cat <<JSON
{ "prompt": "You: ${PROMPT}\\nAssistant:", "max_new_tokens": 32, "stop": ["You:"] }
JSON
)
  req "kobold" "POST:${body}" "${url}"
}

probe_textgen() {
  local url="${TEXTGEN_URL:-http://127.0.0.1:5000}/api/v1/generate"
  local body
  body=$(cat <<JSON
{ "prompt": "You: ${PROMPT}\\nAssistant:", "max_new_tokens": 32, "stop": ["You:"] }
JSON
)
  req "textgen-webui" "POST:${body}" "${url}"
}

run_all() {
  probe_openrouter
  probe_deepseek
  probe_moonshot
  probe_together
  probe_fireworks
  probe_groq
  probe_hf
  probe_ollama || true
  probe_vllm || true
  probe_kobold || true
  probe_textgen || true
}

main() {
  if [[ $# -gt 0 ]]; then
    for p in "$@"; do
      case "$p" in
        openrouter) probe_openrouter;;
        deepseek) probe_deepseek;;
        moonshot|kimi) probe_moonshot;;
        together) probe_together;;
        fireworks) probe_fireworks;;
        groq) probe_groq;;
        hf|huggingface) probe_hf;;
        ollama) probe_ollama||true;;
        vllm) probe_vllm||true;;
        kobold) probe_kobold||true;;
        textgen|textgen-webui) probe_textgen||true;;
        *) echo "Unknown provider: $p";;
      esac
    done
  else
    run_all
  fi
}

main "$@"

