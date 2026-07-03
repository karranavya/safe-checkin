"""
All Anthropic-format tool definitions.
IMPORTANT: All tool variables must be defined BEFORE the tool list variables.
"""

SEARCH_GUESTS_TOOL = {
    "name": "search_guests",
    "description": (
        "Search for hotel guests by room number, name, Aadhaar last 4 digits, "
        "nationality, check-in status, or check-in date. "
        "Use this whenever the user asks about a specific guest, room, or who is currently staying."
    ),
    "input_schema": {
        "type": "object",
        "properties": {
            "room":          { "type": "string",  "description": "Room number e.g. '101'" },
            "name":          { "type": "string",  "description": "Guest name or partial name" },
            "aadhaar_last4": { "type": "string",  "description": "Last 4 digits of Aadhaar card" },
            "nationality":   { "type": "string",  "description": "Guest nationality" },
            "status":        { "type": "string",  "enum": ["active", "checked-out", "all"] },
            "checkin_today": { "type": "boolean", "description": "Only guests who checked in today" },
            "hotel_name":    { "type": "string",  "description": "Hotel name (POLICE ONLY)" },
            "limit":         { "type": "number",  "description": "Max results (default 10)" },
        },
    },
}

SEARCH_ALERTS_TOOL = {
    "name": "search_alerts",
    "description": (
        "Search alerts raised by hotels. Filter by status, priority, hotel name, or time period. "
        "Use this when the user asks about reported cases, suspicious guests, or alert statuses."
    ),
    "input_schema": {
        "type": "object",
        "properties": {
            "status":     { "type": "string", "enum": ["Pending", "Acknowledged", "In Progress", "Resolved", "Cancelled", "all"] },
            "priority":   { "type": "string", "enum": ["Low", "Medium", "High", "Critical", "all"] },
            "hotel_name": { "type": "string", "description": "Filter by hotel name (police only)" },
            "period":     { "type": "string", "enum": ["today", "this_week", "this_month", "all"] },
            "limit":      { "type": "number", "description": "Max results (default 10)" },
        },
    },
}

GET_STATS_TOOL = {
    "name": "get_stats",
    "description": (
        "Get summary statistics: total check-ins, active guests, pending alerts, total alerts, "
        "and number of registered hotels. Use for questions like 'how many guests today', "
        "'current occupancy', 'how many alerts this week', 'how many hotels'."
    ),
    "input_schema": {
        "type": "object",
        "properties": {
            "period":     { "type": "string", "enum": ["today", "this_week", "this_month", "all"] },
            "hotel_name": { "type": "string", "description": "Scope to one hotel (police only)" },
        },
    },
}

TEXT_SEARCH_TOOL = {
    "name": "text_search",
    "description": (
        "Search keywords across alert descriptions and guest records. "
        "Use when the user describes a situation or searches for specific words "
        "e.g. 'find alerts mentioning weapon', 'search for drug', 'any mention of suspicious behaviour'."
    ),
    "input_schema": {
        "type": "object",
        "properties": {
            "query":     { "type": "string", "description": "The keyword or phrase to search for" },
            "search_in": { "type": "string", "enum": ["alerts", "guests", "all"] },
        },
        "required": ["query"],
    },
}

ACTIVITY_LOGS_TOOL = {
    "name": "search_activity_logs",
    "description": (
        "Search officer activity logs. ADMIN POLICE ONLY. "
        "Use for questions about what officers have been doing, login history, or case actions."
    ),
    "input_schema": {
        "type": "object",
        "properties": {
            "officer_name": { "type": "string", "description": "Filter by officer name" },
            "action_type":  { "type": "string", "description": "Filter by action type e.g. 'login', 'alert_update'" },
            "severity":     { "type": "string", "enum": ["low", "medium", "high", "critical"] },
            "period":       { "type": "string", "enum": ["today", "this_week", "this_month"] },
            "limit":        { "type": "number" },
        },
    },
}

SEARCH_HOTELS_TOOL = {
    "name": "search_hotels",
    "description": (
        "Get the list of registered hotels with their names, locations, owner info, "
        "and registration details. Use this when asked: hotel names, which hotels are "
        "registered, hotel details, hotel owner, hotel address, hotel rooms count."
    ),
    "input_schema": {
        "type": "object",
        "properties": {
            "name":             { "type": "string",  "description": "Filter by hotel name (optional)" },
            "include_inactive": { "type": "boolean", "description": "Include inactive hotels (default false)" },
        },
    },
}

# ── Tool sets per role ────────────────────────────────────────────────────────

HOTEL_TOOLS = [
    SEARCH_GUESTS_TOOL,
    GET_STATS_TOOL,
    SEARCH_ALERTS_TOOL,
]

SUB_POLICE_TOOLS = [
    SEARCH_GUESTS_TOOL,
    SEARCH_ALERTS_TOOL,
    GET_STATS_TOOL,
    TEXT_SEARCH_TOOL,
    SEARCH_HOTELS_TOOL,
]

ADMIN_POLICE_TOOLS = [
    SEARCH_GUESTS_TOOL,
    SEARCH_ALERTS_TOOL,
    GET_STATS_TOOL,
    TEXT_SEARCH_TOOL,
    ACTIVITY_LOGS_TOOL,
    SEARCH_HOTELS_TOOL,
]
"""
All Anthropic-format tool definitions.
IMPORTANT: All tool variables must be defined BEFORE the tool list variables.
"""

SEARCH_GUESTS_TOOL = {
    "name": "search_guests",
    "description": (
        "Search for hotel guests by room number, name, Aadhaar last 4 digits, "
        "nationality, check-in status, or check-in date. "
        "Use this whenever the user asks about a specific guest, room, or who is currently staying."
    ),
    "input_schema": {
        "type": "object",
        "properties": {
            "room":          { "type": "string",  "description": "Room number e.g. '101'" },
            "name":          { "type": "string",  "description": "Guest name or partial name" },
            "aadhaar_last4": { "type": "string",  "description": "Last 4 digits of Aadhaar card" },
            "nationality":   { "type": "string",  "description": "Guest nationality" },
            "status":        { "type": "string",  "enum": ["active", "checked-out", "all"] },
            "checkin_today": { "type": "boolean", "description": "Only guests who checked in today" },
            "hotel_name":    { "type": "string",  "description": "Hotel name (POLICE ONLY)" },
            "limit":         { "type": "number",  "description": "Max results (default 10)" },
        },
    },
}

SEARCH_ALERTS_TOOL = {
    "name": "search_alerts",
    "description": (
        "Search alerts raised by hotels. Filter by status, priority, hotel name, or time period. "
        "Returns a FLAT LIST of individual alerts — use this for questions like 'show pending alerts' "
        "or 'alerts from X hotel'. For 'which hotel has the most alerts' style ranking questions, "
        "use get_top_hotels_by_alerts instead, NOT this tool."
    ),
    "input_schema": {
        "type": "object",
        "properties": {
            "status":     { "type": "string", "enum": ["Pending", "Acknowledged", "In Progress", "Resolved", "Cancelled", "all"] },
            "priority":   { "type": "string", "enum": ["Low", "Medium", "High", "Critical", "all"] },
            "hotel_name": { "type": "string", "description": "Filter by hotel name (police only)" },
            "period":     { "type": "string", "enum": ["today", "this_week", "this_month", "all"] },
            "limit":      { "type": "number", "description": "Max results (default 10)" },
        },
    },
}

GET_STATS_TOOL = {
    "name": "get_stats",
    "description": (
        "Get summary statistics: total check-ins, active guests, pending alerts, total alerts, "
        "and number of registered hotels. Use for questions like 'how many guests today', "
        "'current occupancy', 'how many alerts this week', 'how many hotels'."
    ),
    "input_schema": {
        "type": "object",
        "properties": {
            "period":     { "type": "string", "enum": ["today", "this_week", "this_month", "all"] },
            "hotel_name": { "type": "string", "description": "Scope to one hotel (police only)" },
        },
    },
}

TEXT_SEARCH_TOOL = {
    "name": "text_search",
    "description": (
        "Search keywords across alert descriptions and guest records. "
        "Use when the user describes a situation or searches for specific words "
        "e.g. 'find alerts mentioning weapon', 'search for drug', 'any mention of suspicious behaviour'."
    ),
    "input_schema": {
        "type": "object",
        "properties": {
            "query":     { "type": "string", "description": "The keyword or phrase to search for" },
            "search_in": { "type": "string", "enum": ["alerts", "guests", "all"] },
        },
        "required": ["query"],
    },
}

ACTIVITY_LOGS_TOOL = {
    "name": "search_activity_logs",
    "description": (
        "Search officer activity logs. ADMIN POLICE ONLY. "
        "Use for questions about what officers have been doing, login history, or case actions."
    ),
    "input_schema": {
        "type": "object",
        "properties": {
            "officer_name": { "type": "string", "description": "Filter by officer name" },
            "action_type":  { "type": "string", "description": "Filter by action type e.g. 'login', 'alert_update'" },
            "severity":     { "type": "string", "enum": ["low", "medium", "high", "critical"] },
            "period":       { "type": "string", "enum": ["today", "this_week", "this_month"] },
            "limit":        { "type": "number" },
        },
    },
}

SEARCH_HOTELS_TOOL = {
    "name": "search_hotels",
    "description": (
        "Get the list of registered hotels with their names, locations, owner info, "
        "and registration details. Use this when asked: hotel names, which hotels are "
        "registered, hotel details, hotel owner, hotel address, hotel rooms count."
    ),
    "input_schema": {
        "type": "object",
        "properties": {
            "name":             { "type": "string",  "description": "Filter by hotel name (optional)" },
            "include_inactive": { "type": "boolean", "description": "Include inactive hotels (default false)" },
        },
    },
}

# ⭐ NEW
SEARCH_OFFICERS_TOOL = {
    "name": "search_officers",
    "description": (
        "Get the list of police officers (sub-police) within your jurisdiction/team. "
        "Use this for ANY question about officers, sub-police, your team, or jurisdiction "
        "staffing — e.g. 'how many officers in my jurisdiction', 'list my sub-police', "
        "'who are my team members', 'show active officers'. "
        "Do NOT use search_hotels for officer-related questions — they are unrelated."
    ),
    "input_schema": {
        "type": "object",
        "properties": {
            "name":        { "type": "string",  "description": "Filter by officer name (optional)" },
            "active_only": { "type": "boolean", "description": "Only active officers (default true)" },
        },
    },
}

# ⭐ NEW
TOP_HOTELS_BY_ALERTS_TOOL = {
    "name": "get_top_hotels_by_alerts",
    "description": (
        "Returns hotels RANKED by number of alerts raised, highest first. "
        "Use this specifically for ranking/superlative questions like 'which hotel has "
        "raised the most alerts', 'top hotels by alert count', 'busiest hotel for alerts'. "
        "Do NOT use search_alerts for this — search_alerts only returns a flat unranked list "
        "and cannot answer 'which hotel has the most' style questions."
    ),
    "input_schema": {
        "type": "object",
        "properties": {
            "limit": { "type": "number", "description": "How many top hotels to return (default 5)" },
        },
    },
}

# ── Tool sets per role ────────────────────────────────────────────────────────

HOTEL_TOOLS = [
    SEARCH_GUESTS_TOOL,
    GET_STATS_TOOL,
    SEARCH_ALERTS_TOOL,
]

SUB_POLICE_TOOLS = [
    SEARCH_GUESTS_TOOL,
    SEARCH_ALERTS_TOOL,
    GET_STATS_TOOL,
    TEXT_SEARCH_TOOL,
    SEARCH_HOTELS_TOOL,
    SEARCH_OFFICERS_TOOL,
    TOP_HOTELS_BY_ALERTS_TOOL,
]

ADMIN_POLICE_TOOLS = [
    SEARCH_GUESTS_TOOL,
    SEARCH_ALERTS_TOOL,
    GET_STATS_TOOL,
    TEXT_SEARCH_TOOL,
    ACTIVITY_LOGS_TOOL,
    SEARCH_HOTELS_TOOL,
    SEARCH_OFFICERS_TOOL,
    TOP_HOTELS_BY_ALERTS_TOOL,
]