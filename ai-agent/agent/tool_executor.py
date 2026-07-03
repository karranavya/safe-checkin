"""
Dispatches LLM tool calls to the correct async tool function.
"""
import json
from tools.guest_tools import search_guests
from tools.alert_tools import search_alerts
from tools.stats_tools import get_stats, get_top_hotels_by_alerts
from tools.text_search import text_search
from tools.activity_tools import search_activity_logs
from tools.hotel_tools import search_hotels
from tools.officer_tools import search_officers


async def execute_tool(
    tool_name: str,
    tool_input: dict,
    hotel_id: str | None = None,
    is_police: bool = False,
    is_admin: bool = False,
    police_id: str | None = None,        # ⭐ NEW — the requesting officer's own ID
    police_role: str | None = None,      # ⭐ NEW — "admin_police" or "sub_police"
) -> str:
    try:
        result = await _dispatch(
            tool_name=tool_name,
            params=tool_input,
            hotel_id=hotel_id,
            is_police=is_police,
            is_admin=is_admin,
            police_id=police_id,
            police_role=police_role,
        )
    except Exception as exc:
        result = f"Tool error ({tool_name}): {str(exc)}"

    if isinstance(result, str):
        return result
    return json.dumps(result, default=str, ensure_ascii=False)


async def _dispatch(
    tool_name: str,
    params: dict,
    hotel_id: str | None,
    is_police: bool,
    is_admin: bool,
    police_id: str | None,
    police_role: str | None,
) -> object:

    if tool_name == "search_guests":
        return await search_guests(params=params, hotel_id=hotel_id, is_police=is_police)

    if tool_name == "search_alerts":
        return await search_alerts(params=params, hotel_id=hotel_id, is_police=is_police)

    if tool_name == "get_stats":
        return await get_stats(params=params, hotel_id=hotel_id, is_police=is_police)

    if tool_name == "text_search":
        return await text_search(params=params, is_police=is_police)

    if tool_name == "search_activity_logs":
        return await search_activity_logs(params=params, is_admin=is_admin)

    if tool_name == "search_hotels":
        return await search_hotels(params=params)

    if tool_name == "search_officers":
        return await search_officers(
            params=params,
            requesting_police_id=police_id,
            requesting_role=police_role,
        )

    if tool_name == "get_top_hotels_by_alerts":
        return await get_top_hotels_by_alerts(params=params)

    return f"Unknown tool '{tool_name}'."