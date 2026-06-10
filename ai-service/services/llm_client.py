"""
LLM client with Groq (free/fast) primary + Anthropic fallback.
Groq provides Llama3-70B, Mixtral, Gemma at no cost with generous rate limits.
"""
import os
import json
import logging
from typing import Any

from groq import AsyncGroq
from anthropic import AsyncAnthropic

logger = logging.getLogger(__name__)

# Groq model hierarchy (free, fastest first)
GROQ_MODELS = [
    "llama-3.3-70b-versatile",   # Llama 3.3 70B — best quality free
    "llama-3.1-8b-instant",      # Fast fallback
    "mixtral-8x7b-32768",        # Mixtral fallback
]

groq_client = AsyncGroq(api_key=os.getenv("GROQ_API_KEY", ""))
anthropic_client = AsyncAnthropic(api_key=os.getenv("ANTHROPIC_API_KEY", ""))


async def chat_completion(
    messages: list[dict],
    system: str | None = None,
    max_tokens: int = 800,
    temperature: float = 0.3,
    json_mode: bool = False,
    prefer_groq: bool = True,
) -> str:
    """
    Universal chat completion — tries Groq first, falls back to Anthropic claude-sonnet-4-6.
    Returns the assistant's text response.
    """
    if prefer_groq and os.getenv("GROQ_API_KEY"):
        for model in GROQ_MODELS:
            try:
                groq_messages = []
                if system:
                    groq_messages.append({"role": "system", "content": system})
                groq_messages.extend(messages)

                kwargs: dict[str, Any] = {
                    "model": model,
                    "messages": groq_messages,
                    "max_tokens": max_tokens,
                    "temperature": temperature,
                }
                if json_mode:
                    kwargs["response_format"] = {"type": "json_object"}

                response = await groq_client.chat.completions.create(**kwargs)
                return response.choices[0].message.content or ""

            except Exception as e:
                logger.warning("Groq model %s failed: %s — trying next", model, e)
                continue

    # Anthropic fallback
    if os.getenv("ANTHROPIC_API_KEY"):
        try:
            anthropic_messages = messages
            response = await anthropic_client.messages.create(
                model="claude-sonnet-4-6",
                max_tokens=max_tokens,
                system=system or "You are a helpful assistant.",
                messages=anthropic_messages,
            )
            return response.content[0].text
        except Exception as e:
            logger.error("Anthropic fallback also failed: %s", e)
            raise

    raise RuntimeError("No LLM backend configured (set GROQ_API_KEY or ANTHROPIC_API_KEY)")


async def json_completion(
    messages: list[dict],
    system: str | None = None,
    max_tokens: int = 800,
) -> dict:
    """Chat completion that always returns parsed JSON."""
    # Try Groq with json_mode first
    if os.getenv("GROQ_API_KEY"):
        for model in GROQ_MODELS:
            try:
                groq_messages = []
                if system:
                    groq_messages.append({"role": "system", "content": system})
                groq_messages.extend(messages)

                response = await groq_client.chat.completions.create(
                    model=model,
                    messages=groq_messages,
                    max_tokens=max_tokens,
                    temperature=0.1,
                    response_format={"type": "json_object"},
                )
                raw = response.choices[0].message.content or "{}"
                return json.loads(raw)
            except json.JSONDecodeError:
                continue
            except Exception as e:
                logger.warning("Groq json_completion failed: %s", e)
                continue

    # Anthropic fallback — parse JSON from response
    if os.getenv("ANTHROPIC_API_KEY"):
        text = await chat_completion(messages, system=system, max_tokens=max_tokens, prefer_groq=False)
        # Strip markdown code fences if present
        text = text.strip()
        if text.startswith("```"):
            text = text.split("```")[1]
            if text.startswith("json"):
                text = text[4:]
        return json.loads(text.strip())

    raise RuntimeError("No LLM backend configured")
