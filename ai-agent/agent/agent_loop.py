"""
ReAct-style agent loop, with a defensive fallback for models that
occasionally write a tool call as plain JSON text instead of using the
structured tool_calls field (a known reliability quirk with some
NVIDIA-hosted Llama models served via OpenAI-compatible APIs).
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
    """Inject last assistant response as context for follow-up questions."""
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


def _try_parse_inline_tool_call(content: str) -> tuple[str, dict] | None:
    """
    Defensive fallback: some models occasionally write the tool call as
    plain JSON text in the response content instead of using the structured
    tool_calls field. Detect that case so we still execute the tool correctly
    instead of leaking raw JSON to the user.
    """
    if not content:
        return None
    text = content.strip()

    # Case 1: the entire content IS the JSON tool call (the common case)
    try:
        parsed = json.loads(text)
        if isinstance(parsed, dict) and "name" in parsed:
            params = parsed.get("parameters") or parsed.get("arguments") or {}
            return parsed["name"], params
    except (json.JSONDecodeError, TypeError):
        pass

    # Case 2: JSON tool call embedded inside other text
    match = re.search(r'\{.*?"name"\s*:\s*"(\w+)".*\}', text, re.DOTALL)
    if match:
        try:
            parsed = json.loads(match.group(0))
            if isinstance(parsed, dict) and "name" in parsed:
                params = parsed.get("parameters") or parsed.get("arguments") or {}
                return parsed["name"], params
        except json.JSONDecodeError:
            pass

    return None


async def run_agent(
    messages: list[dict],
    system_prompt: str,
    tools: list[dict],
    hotel_id: str | None = None,
    is_police: bool = False,
    is_admin: bool = False,
    police_id: str | None = None,    # ⭐ NEW — requesting officer's own ID
    police_role: str | None = None,  # ⭐ NEW — "admin_police" or "sub_police"
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
            tool_input = json.loads(tc.function.arguments)
            tool_call_id = tc.id
        else:
            # ⭐ Defensive fallback — model wrote the call as plain text
            inline = _try_parse_inline_tool_call(msg.content or "")
            if inline:
                tool_name, tool_input = inline

        # No tool call detected either way — this is a genuine final answer
        if tool_name is None:
            return msg.content or "Please try rephrasing your question."

        tool_result = await execute_tool(
            tool_name=tool_name,
            tool_input=tool_input,
            hotel_id=hotel_id,
            is_police=is_police,
            is_admin=is_admin,
            police_id=police_id,
            police_role=police_role,
        )

        if tool_call_id:
            # Real structured tool call — use the proper tool-result format
            working_messages.append(msg)
            working_messages.append({
                "role": "tool",
                "tool_call_id": tool_call_id,
                "content": tool_result,
            })
        else:
            # Inline fallback — no tool_call_id exists to link to, so don't
            # use the "tool" role (the API would reject it). Replace the
            # leaked-JSON message with a clean placeholder instead, then
            # inject the result as an instruction to answer in plain language.
            working_messages.append({"role": "assistant", "content": "Let me check that."})
            working_messages.append({
                "role": "user",
                "content": (
                    f"[SYSTEM: The result of {tool_name} is: {tool_result}. "
                    f"Answer the original question in plain natural language using "
                    f"this data. Do NOT output JSON, function names, or parameters.]"
                ),
            })

    # Exceeded max iterations — force a final text answer with whatever data was collected
    final = await _client.chat.completions.create(
        model=MODEL,
        max_tokens=MAX_TOKENS,
        messages=working_messages,
    )
    return final.choices[0].message.content or "Please try rephrasing your question."


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