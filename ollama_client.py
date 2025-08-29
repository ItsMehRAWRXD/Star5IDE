"""Lightweight asynchronous client for interacting with a local Ollama server.

This module provides a simple, well-typed wrapper around the Ollama HTTP API
for common operations: listing models, text generation, chat, and embeddings.

Default base URL targets a local Ollama instance running on 127.0.0.1:11434.

Example:
    import asyncio

    from ollama_client import OllamaClient

    async def main():
        async with OllamaClient() as client:
            is_up = await client.ping()
            if not is_up:
                print("Ollama is not reachable at http://127.0.0.1:11434")
                return
            print(await client.list_models())
            text = await client.generate(model="llama3.1", prompt="Say hi in one sentence.")
            print(text)

    asyncio.run(main())
"""

from __future__ import annotations

import asyncio
import json
from typing import Any, AsyncGenerator, Dict, List, Optional

import aiohttp


class OllamaClient:
    """Async client for the Ollama REST API.

    Parameters
    ----------
    base_url: str
        Base URL of the Ollama server. Defaults to "http://127.0.0.1:11434".
    request_timeout_seconds: float
        Timeout in seconds for each HTTP request.
    session: Optional[aiohttp.ClientSession]
        Optional externally managed aiohttp session. If not provided, a session
        will be created and managed by this client.
    """

    def __init__(
        self,
        base_url: str = "http://127.0.0.1:11434",
        request_timeout_seconds: float = 120.0,
        session: Optional[aiohttp.ClientSession] = None,
    ) -> None:
        self._base_url = base_url.rstrip("/")
        self._timeout_seconds = float(request_timeout_seconds)
        self._external_session = session
        self._session: Optional[aiohttp.ClientSession] = None

    async def __aenter__(self) -> "OllamaClient":
        await self._ensure_session()
        return self

    async def __aexit__(self, exc_type, exc, tb) -> None:  # type: ignore[no-untyped-def]
        await self.aclose()

    async def _ensure_session(self) -> aiohttp.ClientSession:
        if self._external_session is not None:
            return self._external_session
        if self._session is None:
            timeout = aiohttp.ClientTimeout(total=self._timeout_seconds)
            self._session = aiohttp.ClientSession(timeout=timeout)
        return self._session

    async def aclose(self) -> None:
        if self._external_session is not None:
            return
        if self._session is not None:
            await self._session.close()
            self._session = None

    # ----------------------------- Utilities ----------------------------- #
    async def ping(self) -> bool:
        """Return True if the Ollama server responds, False otherwise."""
        try:
            session = await self._ensure_session()
            url = f"{self._base_url}/api/tags"
            async with session.get(url) as resp:
                return resp.status == 200
        except Exception:
            return False

    # ---------------------------- Model Management ---------------------------- #
    async def list_models(self) -> List[Dict[str, Any]]:
        """List locally available models (same as `ollama list`)."""
        session = await self._ensure_session()
        url = f"{self._base_url}/api/tags"
        async with session.get(url) as resp:
            resp.raise_for_status()
            data = await resp.json()
            # Expected shape: { "models": [ {"name": "llama3:latest", ...}, ... ] }
            return list(data.get("models", []))

    # ---------------------------- Text Generation ---------------------------- #
    async def generate(
        self,
        model: str,
        prompt: str,
        *,
        stream: bool = False,
        options: Optional[Dict[str, Any]] = None,
    ) -> Any:
        """Generate text with a model via /api/generate.

        When stream is False (default), returns the full generated string.
        When stream is True, returns an async generator yielding string chunks.
        """
        session = await self._ensure_session()
        url = f"{self._base_url}/api/generate"
        payload: Dict[str, Any] = {
            "model": model,
            "prompt": prompt,
            "stream": bool(stream),
        }
        if options:
            payload["options"] = options

        if not stream:
            async with session.post(url, json=payload) as resp:
                resp.raise_for_status()
                data = await resp.json()
                # Non-streaming returns full response text under "response"
                return data.get("response", "")

        async def _stream_generator() -> AsyncGenerator[str, None]:
            async with session.post(url, json=payload) as resp:
                resp.raise_for_status()
                async for raw_line in resp.content:
                    line = raw_line.decode("utf-8").strip()
                    if not line:
                        continue
                    try:
                        event = json.loads(line)
                    except json.JSONDecodeError:
                        continue
                    if "response" in event and event.get("response"):
                        yield str(event["response"])
                    if event.get("done") is True:
                        break

        return _stream_generator()

    # --------------------------------- Chat --------------------------------- #
    async def chat(
        self,
        model: str,
        messages: List[Dict[str, str]],
        *,
        stream: bool = False,
        options: Optional[Dict[str, Any]] = None,
    ) -> Any:
        """Chat with a model via /api/chat.

        `messages` is a list like:
        [{"role": "system", "content": "You are helpful."}, {"role": "user", "content": "Hello"}]

        When stream is False, returns the assistant's final message string.
        When stream is True, returns an async generator yielding string chunks.
        """
        session = await self._ensure_session()
        url = f"{self._base_url}/api/chat"
        payload: Dict[str, Any] = {
            "model": model,
            "messages": messages,
            "stream": bool(stream),
        }
        if options:
            payload["options"] = options

        if not stream:
            async with session.post(url, json=payload) as resp:
                resp.raise_for_status()
                data = await resp.json()
                # Non-streaming returns an object with message {role, content}
                message = data.get("message", {})
                return str(message.get("content", ""))

        async def _stream_generator() -> AsyncGenerator[str, None]:
            async with session.post(url, json=payload) as resp:
                resp.raise_for_status()
                async for raw_line in resp.content:
                    line = raw_line.decode("utf-8").strip()
                    if not line:
                        continue
                    try:
                        event = json.loads(line)
                    except json.JSONDecodeError:
                        continue
                    if "message" in event:
                        content_part = (
                            (event.get("message") or {}).get("content") or ""
                        )
                        if content_part:
                            yield str(content_part)
                    if event.get("done") is True:
                        break

        return _stream_generator()

    # ------------------------------- Embeddings ------------------------------- #
    async def embeddings(self, model: str, prompt: str) -> List[float]:
        """Create embeddings using /api/embeddings.

        Returns a list of floats representing the embedding vector.
        """
        session = await self._ensure_session()
        url = f"{self._base_url}/api/embeddings"
        payload = {"model": model, "prompt": prompt}
        async with session.post(url, json=payload) as resp:
            resp.raise_for_status()
            data = await resp.json()
            # Expected: { "embedding": [float, float, ...] }
            embedding = data.get("embedding")
            if not isinstance(embedding, list):
                raise ValueError("Unexpected embeddings response shape: missing 'embedding' list")
            return [float(x) for x in embedding]


__all__ = [
    "OllamaClient",
]

