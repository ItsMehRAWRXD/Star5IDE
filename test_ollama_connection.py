#!/usr/bin/env python3
"""Quick connectivity check for a local Ollama server.

Requirements:
    - ollama daemon running locally (default: 127.0.0.1:11434)
    - a model pulled locally (e.g., `ollama pull llama3.1`)

Usage:
    python test_ollama_connection.py --model llama3.1 --prompt "Hello"
"""

from __future__ import annotations

import argparse
import asyncio
import sys
from typing import Optional

from ollama_client import OllamaClient


async def run_check(model: str, prompt: str, base_url: str) -> int:
    async with OllamaClient(base_url=base_url) as client:
        print(f"Pinging Ollama at {base_url}...")
        if not await client.ping():
            print("ERROR: Ollama server is not reachable. Is it running?\n"
                  "Try: `ollama serve` in another terminal.")
            return 2

        print("Listing local models...")
        models = await client.list_models()
        model_names = [m.get("name", "") for m in models]
        print("Found models:", ", ".join(model_names) or "<none>")
        if model not in model_names:
            print(
                f"WARNING: Model '{model}' not in local list. If generation fails, try `ollama pull {model}`."
            )

        print(f"\nGenerating with model '{model}'...")
        try:
            text = await client.generate(model=model, prompt=prompt)
        except Exception as exc:
            print(f"Generation failed: {exc}")
            return 3

        print("\n--- Generation output (truncated to 500 chars) ---")
        print(text[:500])
        print("--- end ---\n")
        return 0


def main(argv: Optional[list[str]] = None) -> int:
    parser = argparse.ArgumentParser(description="Test connection to local Ollama")
    parser.add_argument("--model", default="llama3.1", help="Model to use (default: llama3.1)")
    parser.add_argument("--prompt", default="Say hello in one short sentence.", help="Prompt text")
    parser.add_argument("--base-url", default="http://127.0.0.1:11434", help="Ollama base URL")
    args = parser.parse_args(argv)

    return asyncio.run(run_check(model=args.model, prompt=args.prompt, base_url=args.base_url))


if __name__ == "__main__":
    sys.exit(main())

