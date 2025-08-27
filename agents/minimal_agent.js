/* Minimal agent template using an OpenAI-compatible API */

import OpenAI from 'openai';

const apiKey = process.env.API_KEY || process.env.OPENROUTER_API_KEY || process.env.DEEPSEEK_API_KEY || process.env.GROQ_API_KEY || '';
const baseURL = process.env.BASE_URL || process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';
const model = process.env.MODEL || process.env.OPENROUTER_MODEL || 'nousresearch/hermes-3-llama-3.1-8b';

if (!apiKey) {
  console.error('Set API_KEY (or provider-specific key).');
  process.exit(1);
}

const client = new OpenAI({ apiKey, baseURL });

async function runAgent() {
  const system = process.env.SYSTEM || 'You are a helpful assistant. Be concise.';
  const user = process.env.INPUT || 'Say hi';

  const resp = await client.chat.completions.create({
    model,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user }
    ],
    max_tokens: Number(process.env.MAX_TOKENS || 256)
  });

  console.log(resp.choices?.[0]?.message?.content || '');
}

runAgent().catch(err => {
  console.error(err?.response?.data || err?.message || err);
  process.exit(1);
});

