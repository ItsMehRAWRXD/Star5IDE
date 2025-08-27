# Star5IDE

## LLM Scanner and Minimal Agent

### scripts/scan_llm_apis.sh
- Probes major OpenAI-compatible providers and local servers.
- Usage:
  - `bash scripts/scan_llm_apis.sh`
  - `OPENROUTER_API_KEY=... bash scripts/scan_llm_apis.sh openrouter deepseek`
- Env vars (set as needed):
  - OPENROUTER_API_KEY, OPENROUTER_MODEL
  - DEEPSEEK_API_KEY, DEEPSEEK_MODEL
  - MOONSHOT_API_KEY, MOONSHOT_MODEL
  - TOGETHER_API_KEY, TOGETHER_MODEL
  - FIREWORKS_API_KEY, FIREWORKS_MODEL
  - GROQ_API_KEY, GROQ_MODEL
  - HF_TOKEN, HF_MODEL
  - OLLAMA_MODEL, VLLM_BASE_URL, VLLM_MODEL, KOBOLD_URL, TEXTGEN_URL

### agents/minimal_agent.js
- OpenAI-compatible agent template.
- Usage:
  - `npm i openai`
  - `API_KEY=... BASE_URL=https://openrouter.ai/api/v1 MODEL=nousresearch/hermes-3-llama-3.1-8b node agents/minimal_agent.js`
- Works with Groq/Together/DeepSeek/etc. by changing BASE_URL and API_KEY.
