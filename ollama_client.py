import asyncio
import logging
from typing import List, Dict, Optional

try:
    import aiohttp  # type: ignore
except ImportError as e:  # pragma: no cover
    raise ImportError("The 'aiohttp' package is required for async Ollama client support. Install it via 'pip install aiohttp'.") from e

try:
    import requests  # type: ignore
except ImportError as e:  # pragma: no cover
    raise ImportError("The 'requests' package is required for synchronous Ollama client support. Install it via 'pip install requests'.") from e

__all__ = [
    "OllamaClient",
    "AsyncOllamaClient",
]

logger = logging.getLogger(__name__)

API_URL_DEFAULT = "http://localhost:11434"


class OllamaError(RuntimeError):
    """Raised when the Ollama server returns an error response."""


class OllamaClient:
    """Synchronous wrapper around a local Ollama HTTP API.

    Example
    -------
    >>> client = OllamaClient(model="llama3")
    >>> reply = client.chat([
    ...     {"role": "user", "content": "Hello!"}
    ... ])
    >>> print(reply)
    """

    def __init__(self, model: str = "llama3", base_url: str = API_URL_DEFAULT, timeout: int = 120):
        self.model = model
        self.base_url = base_url.rstrip("/")
        self.timeout = timeout
        self._url_chat = f"{self.base_url}/v1/chat/completions"

    # ---------------------------------------------------------------------
    # Public helpers
    # ---------------------------------------------------------------------
    def chat(self, messages: List[Dict[str, str]], stream: bool = False, **kwargs) -> str:
        """Perform a chat completion request.

        Parameters
        ----------
        messages: list
            A list of dicts following the same schema as OpenAI Chat API: each
            dict requires keys ``role`` and ``content``.
        stream: bool, default False
            When *True* this method returns a generator yielding tokens as soon
            as they are produced by the server. When *False* a single string
            containing the entire response is returned.
        **kwargs: dict
            Extra arguments forwarded to the Ollama API body (e.g. ``temperature``).
        """
        payload: Dict[str, object] = {
            "model": self.model,
            "messages": messages,
            **kwargs,
        }
        logger.debug("POST %s payload=%s", self._url_chat, payload)
        resp = requests.post(self._url_chat, json=payload, timeout=self.timeout, stream=stream)
        if resp.status_code != 200:
            raise OllamaError(f"Ollama error {resp.status_code}: {resp.text}")

        if not stream:
            data = resp.json()
            return data["choices"][0]["message"]["content"]

        # streaming response (Server-Sent Events style, but Ollama chunks JSON per line)
        def _iter():
            for line in resp.iter_lines():
                if not line:
                    continue
                try:
                    data = line.decode("utf-8")
                    chunk = json.loads(data)  # lazy import of json inside closure
                except Exception as exc:  # pragma: no cover
                    logger.warning("Failed to decode Ollama chunk: %s", exc)
                    continue
                if "done" in chunk and chunk["done"]:
                    break
                yield chunk.get("choices", [{}])[0].get("delta", {}).get("content", "")
        import json  # local import to keep top tidy

        return _iter()


class AsyncOllamaClient:
    """Asynchronous wrapper using *aiohttp* for high-throughput scenarios."""

    def __init__(self, model: str = "llama3", base_url: str = API_URL_DEFAULT, timeout: int = 120):
        self.model = model
        self.base_url = base_url.rstrip("/")
        self.timeout = timeout
        self._url_chat = f"{self.base_url}/v1/chat/completions"
        self._session: Optional[aiohttp.ClientSession] = None

    async def __aenter__(self):
        if self._session is None:
            timeout = aiohttp.ClientTimeout(total=self.timeout)
            self._session = aiohttp.ClientSession(timeout=timeout)
        return self

    async def __aexit__(self, exc_type, exc, tb):
        if self._session:
            await self._session.close()
            self._session = None

    async def chat(self, messages: List[Dict[str, str]], stream: bool = False, **kwargs) -> str:
        if self._session is None:
            raise RuntimeError("AsyncOllamaClient must be used within an 'async with' block or .open()/.close().")

        payload: Dict[str, object] = {
            "model": self.model,
            "messages": messages,
            **kwargs,
        }
        logger.debug("POST %s payload=%s", self._url_chat, payload)
        async with self._session.post(self._url_chat, json=payload) as resp:
            if resp.status != 200:
                text = await resp.text()
                raise OllamaError(f"Ollama error {resp.status}: {text}")

            if not stream:
                data = await resp.json()
                return data["choices"][0]["message"]["content"]

            async for line in resp.content:
                if not line.strip():
                    continue
                try:
                    chunk = json.loads(line)
                except Exception as exc:
                    logger.warning("Failed to decode Ollama chunk: %s", exc)
                    continue
                if chunk.get("done"):
                    break
                yield chunk.get("choices", [{}])[0].get("delta", {}).get("content", "")