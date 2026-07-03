"""
ReAct-style agent loop.

Key fix: photo markdown is injected by Python AFTER the LLM generates its
response, instead of asking the LLM to copy it. Small models reliably strip
or transform markdown syntax like ![label](url), so we don't trust them with
it. Instead:
  1. During tool execution, collect photo markdown from search_guests results.
  2. After the LLM produces its final text, append the photo markdown directly.
  3. The frontend MessageContent component parses ![label](url) and renders <img>.
"""
from openai import AsyncOpenAI
import json
import re
from config.settings import get_settings
from agent.tool_executor import execute_tool

settings = get_settings()

_client = AsyncOpenAI(
    base_url="https://integrate.api.nvidia.com/v1",
    api_key=settings.nvidia_api_key,
)

MODEL = settings.nvidia_model
MAX_TOKENS = 1024
MAX_HISTORY_TURNS = 12
MAX_TOOL_ITERATIONS = 4


def _enhance_prompt_with_context(system_prompt: str, messages: list[dict]) -> str:
    if len(messages) <= 2:
        return system_prompt
    last_assistant = None
    for msg in reversed(messages):
        content = msg.get("content", "")
        if msg.get("role") == "assistant" and len(content) > 40:
            if "What would you like" not in content and "How can I" not in content:
                last_assistant = content
                break
    if not last_assistant:
        return system_prompt
    return (
        system_prompt
        + f"\n\nDATA FROM PREVIOUS RESPONSE (use to answer follow-ups without re-querying):\n"
        f"{last_assistant[:600]}"
    )


def _balance_and_parse(text: str) -> dict | None:
    """Brace-balanced JSON extraction — handles truncated model output."""
    start = text.find('{')
    if start == -1:
        return None

    depth = 0
    in_string = False
    escape_next = False
    end = -1

    for i, ch in enumerate(text[start:], start):
        if escape_next:
            escape_next = False
            continue
        if ch == '\\' and in_string:
            escape_next = True
            continue
        if ch == '"':
            in_string = not in_string
            continue
        if in_string:
            continue
        if ch == '{':
            depth += 1
        elif ch == '}':
            depth -= 1
            if depth == 0:
                end = i + 1
                break

    candidates = []
    if end != -1:
        candidates.append(text[start:end])
    if depth > 0:
        candidates.append(text[start:] + '}' * depth)

    for candidate in candidates:
        try:
            return json.loads(candidate)
        except (json.JSONDecodeError, ValueError):
            continue
    return None


def _extract_params(raw_params: dict) -> dict:
    """Flatten schema-bleed nested 'properties' key and drop empty strings."""
    if not isinstance(raw_params, dict):
        return {}
    result = {}
    for k, v in raw_params.items():
        if k == "properties":
            continue
        if v != "" and v is not None:
            result[k] = v
    props = raw_params.get("properties", {})
    if isinstance(props, dict):
        for k, v in props.items():
            if k not in result and v != "" and v is not None:
                result[k] = v
    return result


def _try_parse_inline_tool_call(content: str) -> tuple[str, dict] | None:
    """Detect a tool call written as plain text JSON instead of tool_calls."""
    if not content or '{' not in content:
        return None
    parsed = _balance_and_parse(content.strip())
    if not parsed or not isinstance(parsed, dict) or "name" not in parsed:
        return None
    raw_params = (
        parsed.get("parameters")
        or parsed.get("arguments")
        or parsed.get("input")
        or {}
    )
    return parsed["name"], _extract_params(raw_params)


def _collect_photo_markdown(tool_name: str, tool_result: str) -> list[tuple[str, str]]:
    """
    Extract (guest_name, photo_markdown) pairs from a search_guests result.
    Called after every tool execution — only search_guests produces photos.
    """
    if tool_name != "search_guests":
        return []
    try:
        data = json.loads(tool_result)
    except (json.JSONDecodeError, ValueError):
        return []
    if not isinstance(data, list):
        return []

    collected = []
    for guest in data:
        if not isinstance(guest, dict):
            continue
        photos = guest.get("photos", "")
        if photos and "![" in photos:
            collected.append((guest.get("name", "Guest"), photos))
    return collected


async def run_agent(
    messages: list[dict],
    system_prompt: str,
    tools: list[dict],
    hotel_id: str | None = None,
    is_police: bool = False,
    is_admin: bool = False,
    police_id: str | None = None,
    police_role: str | None = None,
) -> str:
    if not messages:
        raise ValueError("messages list cannot be empty")

    trimmed = messages[-MAX_HISTORY_TURNS:]
    enhanced_prompt = _enhance_prompt_with_context(system_prompt, trimmed)

    openai_tools = _convert_tools(tools)

    working_messages = [
        {"role": "system", "content": enhanced_prompt},
        *trimmed,
    ]

    # Collect photo markdown across all tool calls in this turn.
    # Python will inject these after the LLM response — never trust the
    # LLM to copy ![label](url) syntax correctly with smaller models.
    all_photos: list[tuple[str, str]] = []

    for iteration in range(MAX_TOOL_ITERATIONS):

        response = await _client.chat.completions.create(
            model=MODEL,
            max_tokens=MAX_TOKENS,
            messages=working_messages,
            tools=openai_tools,
            tool_choice="auto",
        )

        msg = response.choices[0].message

        tool_name = None
        tool_input = None
        tool_call_id = None

        if msg.tool_calls:
            tc = msg.tool_calls[0]
            tool_name = tc.function.name
            try:
                tool_input = json.loads(tc.function.arguments)
            except json.JSONDecodeError:
                tool_input = {}
            tool_call_id = tc.id
        else:
            inline = _try_parse_inline_tool_call(msg.content or "")
            if inline:
                tool_name, tool_input = inline

        if tool_name is None:
            # Final text response from LLM
            reply = msg.content or "Please try rephrasing your question."
            return _inject_photos(reply, all_photos)

        tool_result = await execute_tool(
            tool_name=tool_name,
            tool_input=tool_input or {},
            hotel_id=hotel_id,
            is_police=is_police,
            is_admin=is_admin,
            police_id=police_id,
            police_role=police_role,
        )

        # Collect photos immediately after execution
        all_photos.extend(_collect_photo_markdown(tool_name, tool_result))

        if tool_call_id:
            working_messages.append(msg)
            working_messages.append({
                "role": "tool",
                "tool_call_id": tool_call_id,
                "content": tool_result,
            })
        else:
            working_messages.append({"role": "assistant", "content": "Let me check that."})
            working_messages.append({
                "role": "user",
                "content": (
                    f"[SYSTEM: Tool '{tool_name}' returned: {tool_result}. "
                    f"Answer in plain natural language. Do NOT output JSON or markdown syntax.]"
                ),
            })

    # Max iterations — force final answer
    final = await _client.chat.completions.create(
        model=MODEL,
        max_tokens=MAX_TOKENS,
        messages=working_messages,
    )
    reply = final.choices[0].message.content or "Please try rephrasing your question."
    return _inject_photos(reply, all_photos)


def _inject_photos(reply: str, photos: list[tuple[str, str]]) -> str:
    """
    Append photo markdown to the reply if:
    - Photos were collected from tool results, AND
    - The LLM didn't already include them (checked by presence of '![')

    For a single guest: append photos after the text.
    For multiple guests: label each block with the guest name.
    """
    if not photos:
        return reply

    # If the LLM somehow did include valid photo markdown, don't duplicate
    if "![" in reply:
        return reply

    if len(photos) == 1:
        _, markdown = photos[0]
        return reply.rstrip() + "\n\n" + markdown
    else:
        blocks = []
        for name, markdown in photos:
            blocks.append(f"**{name}**\n{markdown}")
        return reply.rstrip() + "\n\n" + "\n\n".join(blocks)


def _convert_tools(anthropic_tools: list[dict]) -> list[dict]:
    return [
        {
            "type": "function",
            "function": {
                "name": t["name"],
                "description": t["description"],
                "parameters": t.get("input_schema", {
                    "type": "object",
                    "properties": {},
                }),
            },
        }
        for t in anthropic_tools
    ]